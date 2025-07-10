require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

// Validar variables de entorno importantes
if (!process.env.JWT_SECRET) {
  console.error('❌ La variable de entorno JWT_SECRET no está definida.');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ La variable de entorno MONGO_URI no está definida.');
  process.exit(1);
}

const rootDir = path.join(__dirname, '..');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use(express.static(rootDir));
app.use('/uploads', express.static(uploadsDir));

// Middleware de autenticación
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token requerido' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
}

// Conexión a MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => {
    console.error('❌ Error al conectar con MongoDB:', err);
    process.exit(1);
  });

// Esquemas y modelos
const userSchema = new mongoose.Schema({
  usuario: { type: String, required: true, unique: true },
  correo: { type: String, required: true, unique: true },
  contrasena: { type: String, required: true },
  rol: { type: String, default: 'usuario' }
});
const User = mongoose.model('User', userSchema);

const claseSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  video: { type: String, required: true },
  documento: { type: String },
  nivel: { type: String, required: true, enum: ['1', '2', '3'] }
}, { timestamps: true });
const Clase = mongoose.model('Clase', claseSchema);

// Rutas

// Registro de usuarios
app.post('/register', async (req, res) => {
  const { usuario, correo, contrasena, rol } = req.body;
  if (!usuario || !correo || !contrasena) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ usuario }, { correo }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Usuario o correo ya registrado' });
    }

    const hashedPassword = await bcrypt.hash(contrasena, 10);
    const newUser = new User({ usuario, correo, contrasena: hashedPassword, rol: rol || 'usuario' });

    await newUser.save();
    return res.status(201).json({ message: 'Usuario registrado exitosamente' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error del servidor' });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { usuario, contrasena } = req.body;
  if (!usuario || !contrasena) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  try {
    const user = await User.findOne({ usuario });
    if (!user) {
      return res.status(400).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const isMatch = await bcrypt.compare(contrasena, user.contrasena);
    if (!isMatch) {
      return res.status(400).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const token = jwt.sign(
      { usuario: user.usuario, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({
      message: 'Login exitoso',
      token,
      usuario: user.usuario,
      rol: user.rol
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error del servidor' });
  }
});

// Obtener lista de usuarios (requiere autenticación)
app.get('/usuarios', auth, async (req, res) => {
  try {
    const usuarios = await User.find({}, 'usuario correo rol').sort({ rol: -1 });
    return res.json(usuarios);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Actualizar roles de usuarios (requiere autenticación y rol administrador)
app.post('/usuarios/actualizar', auth, async (req, res) => {
  if (req.user.rol.toLowerCase() !== 'administrador') return res.status(403).json({ error: 'Acceso denegado' });

  try {
    const updates = req.body;
    for (const user of updates) {
      await User.updateOne(
        { usuario: user.usuario },
        { rol: user.rol?.toLowerCase() === 'administrador' ? 'administrador' : 'usuario' }
      );
    }
    return res.json({ message: 'Roles actualizados correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al actualizar roles' });
  }
});

// Validar archivo PDF y tamaño
function validarArchivo(documento) {
  const ALLOWED_TYPES = ['application/pdf'];
  const MAX_SIZE = 2 * 1024 * 1024; // 2MB
  return documento && ALLOWED_TYPES.includes(documento.mimetype) && documento.size <= MAX_SIZE;
}

// Crear clase (requiere autenticación)
app.post('/clases', auth, async (req, res) => {
  try {
    const { titulo, descripcion, video, nivel } = req.body;
    const documento = req.files?.documento;

    if (!titulo || !descripcion || !video || !nivel) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    let documentoPath = '';
    if (documento) {
      if (!validarArchivo(documento)) {
        return res.status(400).json({ error: 'Archivo no válido' });
      }

      const nombreArchivo = Date.now() + '-' + documento.name.replace(/\s/g, '_');
      const rutaDestino = path.join(uploadsDir, nombreArchivo);
      await documento.mv(rutaDestino);
      documentoPath = nombreArchivo;
    }

    const nuevaClase = new Clase({ titulo, descripcion, video, nivel, documento: documentoPath });
    await nuevaClase.save();
    return res.status(201).json({ message: 'Clase guardada correctamente' });

  } catch (error) {
    console.error('Error al guardar clase:', error);
    return res.status(500).json({ error: 'Error del servidor' });
  }
});

// Obtener clases
app.get('/clases', async (req, res) => {
  try {
    const clases = await Clase.find().sort({ createdAt: -1 });
    return res.json(clases);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al obtener clases' });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${port}`);
  console.log(`🔑 JWT_SECRET is set: ${!!JWT_SECRET}`);
  console.log(`🌐 MongoDB URI is set: ${!!MONGO_URI}`);
});
