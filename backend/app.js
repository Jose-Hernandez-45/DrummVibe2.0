const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

// Rutas del frontend
const rootDir = path.join(__dirname, '..');

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

// Servir archivos estáticos del frontend (index.html, templates, assets)
app.use(express.static(rootDir));

// Servir index.html en la raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

// Servir carpeta uploads para archivos subidos
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Conexión a MongoDB Atlas
const uri = "mongodb+srv://jh733325:12345@dbdrumm.zrqaas5.mongodb.net/dbDrumm?retryWrites=true&w=majority";

mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB conectado'))
.catch(err => console.error('❌ Error al conectar con MongoDB:', err));

// Esquemas
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

// Registro
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

        return res.json({ message: 'Login exitoso', usuario: user.usuario, rol: user.rol });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error del servidor' });
    }
});

// Obtener usuarios
app.get('/usuarios', async (req, res) => {
    try {
        const usuarios = await User.find({}, 'usuario correo rol').sort({ rol: -1 });
        return res.json(usuarios);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

// Actualizar roles
app.post('/usuarios/actualizar', async (req, res) => {
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

// Crear clase
app.post('/clases', async (req, res) => {
    try {
        const { titulo, descripcion, video, nivel } = req.body;
        const documento = req.files?.documento;

        if (!titulo || !descripcion || !video || !nivel) {
            return res.status(400).json({ error: 'Faltan datos obligatorios' });
        }

        let documentoPath = '';
        if (documento) {
            const nombreArchivo = Date.now() + '-' + Buffer.from(documento.name, 'latin1').toString('utf8').replace(/\s/g, '_');
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

// Obtener clase por ID
app.get('/clases/:id', async (req, res) => {
    try {
        const clase = await Clase.findById(req.params.id);
        if (!clase) return res.status(404).json({ error: 'Clase no encontrada' });
        return res.json(clase);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al obtener clase' });
    }
});

// Actualizar clase
app.put('/clases/:id', async (req, res) => {
    try {
        const claseExistente = await Clase.findById(req.params.id);
        if (!claseExistente) return res.status(404).json({ error: 'Clase no encontrada' });

        const { titulo, descripcion, video, nivel } = req.body;
        const updateData = { titulo, descripcion, video, nivel };

        if (req.files?.documento) {
            const documento = req.files.documento;
            if (claseExistente.documento) {
                const oldPath = path.join(uploadsDir, claseExistente.documento);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }

            const nombreArchivo = Date.now() + '-' + Buffer.from(documento.name, 'latin1').toString('utf8').replace(/\s/g, '_');
            const rutaDestino = path.join(uploadsDir, nombreArchivo);
            await documento.mv(rutaDestino);
            updateData.documento = nombreArchivo;
        }

        const claseActualizada = await Clase.findByIdAndUpdate(req.params.id, updateData, { new: true });
        return res.json(claseActualizada);

    } catch (error) {
        console.error('Error al actualizar clase:', error);
        return res.status(500).json({ error: 'Error del servidor' });
    }
});

// Eliminar clase
app.delete('/clases/:id', async (req, res) => {
    try {
        await Clase.findByIdAndDelete(req.params.id);
        return res.json({ message: 'Clase eliminada' });
    } catch (error) {
        console.error('Error al eliminar clase:', error);
        return res.status(500).json({ error: 'Error al eliminar clase' });
    }
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`🚀 Servidor escuchando en http://localhost:${port}`);
});
