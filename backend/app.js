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
const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';
const MONGO_URI = process.env.MONGO_URI;

const rootDir = path.join(__dirname, '..');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use(express.static(rootDir));
app.use('/uploads', express.static(uploadsDir));

// Middleware de autenticación mejorado
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

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
  .catch(err => console.error('❌ Error al conectar con MongoDB:', err));

// Definición de esquemas y modelos
const userSchema = new mongoose.Schema({
  usuario: { type: String, required: true, unique: true },
  correo: { type: String, required: true, unique: true },
  contrasena: { type: String, required: true },
  rol: { type: String, default: 'usuario' },
  telefono: { type: String, default: '' },
  fechaCreacion: { type: Date, default: Date.now }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.contrasena);
};

const User = mongoose.model('User', userSchema);

const claseSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  video: { type: String, required: true },
  documento: { type: String },
  nivel: { type: String, required: true, enum: ['1', '2', '3'] }
}, { timestamps: true });
const Clase = mongoose.model('Clase', claseSchema);

// Ruta para registro de usuarios
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
    const newUser = new User({ 
      usuario, 
      correo, 
      contrasena: hashedPassword, 
      rol: rol || 'usuario' 
    });

    await newUser.save();
    return res.status(201).json({ message: 'Usuario registrado exitosamente' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error del servidor' });
  }
});

// Ruta para login
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
      { 
        id: user._id,
        usuario: user.usuario, 
        rol: user.rol 
      },
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

// Obtener datos del usuario actual
app.get('/api/usuario/datos', auth, async (req, res) => {
  try {
    const usuario = await User.findById(req.user.id).select('-contrasena');
    res.json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Actualizar datos del usuario
app.put('/api/usuario/actualizar', auth, async (req, res) => {
  try {
    const { usuario, correo, telefono, nuevaContrasena } = req.body;
    const updateData = { usuario, correo, telefono };

    if (nuevaContrasena) {
      const salt = await bcrypt.genSalt(10);
      updateData.contrasena = await bcrypt.hash(nuevaContrasena, salt);
    }

    const usuarioActualizado = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true }
    ).select('-contrasena');

    // Generar nuevo token si cambió el nombre de usuario
    let token;
    if (usuario !== req.user.usuario) {
      token = jwt.sign(
        { 
          id: usuarioActualizado._id, 
          usuario: usuarioActualizado.usuario,
          rol: usuarioActualizado.rol 
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
    }

    res.json({ 
      message: 'Usuario actualizado',
      usuario: usuarioActualizado,
      token: token || undefined
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Eliminar cuenta de usuario
app.delete('/api/usuario/eliminar', auth, async (req, res) => {
  try {
    const { contrasena } = req.body;
    const usuario = await User.findById(req.user.id);

    // Verificar contraseña
    const isMatch = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!isMatch) {
      return res.status(400).json({ error: 'Contraseña incorrecta' });
    }

    await User.findByIdAndDelete(req.user.id);
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
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
  if (req.user.rol !== 'administrador') return res.status(403).json({ error: 'Acceso denegado' });

  try {
    const updates = req.body;
    for (const user of updates) {
      await User.updateOne(
        { usuario: user.usuario },
        { rol: user.rol === 'administrador' ? 'administrador' : 'usuario' }
      );
    }
    return res.json({ message: 'Roles actualizados correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al actualizar roles' });
  }
});

// Validar archivos PDF, Word, MP3, MP4 y tamaño máximo 10MB
function validarArchivo(documento) {
  const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'audio/mpeg',
    'video/mp4'
  ];
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

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
        return res.status(400).json({ error: 'Archivo no válido o demasiado grande' });
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

// Obtener clase por ID (requiere autenticación)
app.get('/clases/:id', auth, async (req, res) => {
  try {
    const clase = await Clase.findById(req.params.id);
    if (!clase) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }
    return res.json(clase);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al obtener la clase' });
  }
});

// Actualizar clase por ID (requiere autenticación)
app.put('/clases/:id', auth, async (req, res) => {
  try {
    const { titulo, descripcion, video, nivel } = req.body;
    const documento = req.files?.documento;

    if (!titulo || !descripcion || !video || !nivel) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    let documentoPath;
    if (documento) {
      if (!validarArchivo(documento)) {
        return res.status(400).json({ error: 'Archivo no válido o demasiado grande' });
      }

      const nombreArchivo = Date.now() + '-' + documento.name.replace(/\s/g, '_');
      const rutaDestino = path.join(uploadsDir, nombreArchivo);
      await documento.mv(rutaDestino);
      documentoPath = nombreArchivo;
    }

    const updateData = { titulo, descripcion, video, nivel };
    if (documentoPath) {
      updateData.documento = documentoPath;
    }

    const claseActualizada = await Clase.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!claseActualizada) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }

    return res.json({ message: 'Clase actualizada correctamente', clase: claseActualizada });

  } catch (error) {
    console.error('Error al actualizar clase:', error);
    return res.status(500).json({ error: 'Error del servidor' });
  }
});

// Eliminar clase (requiere autenticación)
app.delete('/clases/:id', auth, async (req, res) => {
  try {
    const claseEliminada = await Clase.findByIdAndDelete(req.params.id);
    
    if (!claseEliminada) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }

    // Opcional: Eliminar el archivo asociado si existe
    if (claseEliminada.documento) {
      try {
        await fs.unlink(path.join(uploadsDir, claseEliminada.documento));
      } catch (err) {
        console.error('Error al eliminar archivo:', err);
      }
    }

    return res.json({ message: 'Clase eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar clase:', error);
    return res.status(500).json({ error: 'Error del servidor' });
  }
});

// Obtener todas las clases (requiere autenticación si quieres, o público)
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
});