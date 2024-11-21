const port = 3000;

var express = require('express');
const router = express.Router();
var mysql = require('mysql2');
const bodyParser = require("body-parser");
const cors = require('cors');
const multer = require('multer');

var app = express();
app.use(bodyParser.raw({ type: "audio/*", limit: "10mb" }));
app.use(express.json());
app.use(express.static('./pages'));
app.use(router);
app.use(cors());


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

var con = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "PUC@1234",
    database: "WEB"
});

con.connect((err) => {
    if (err) throw err;
    console.log("Connected!");
});

//endpoint para adicionar um usuário
router.post("/api/usuarios", (req,res) => {
    console.log(req.body);
    const usuario = req.body;

    var sql = `INSERT INTO usuario (EMAIL, SENHA) 
    VALUES
    ('${usuario.email}',
    '${usuario.senha}')`;

    con.query(sql, function (err, result) {
        if (err) throw err;
    });

    res.status(201).json(usuario);
});

//endpoint para selecionar os usuários
router.get("/api/usuarios", (req, res) => {
    var sql = 'SELECT id, email, senha FROM usuario';
    con.query(sql, function (err, result) {
        if (err) throw err;
        res.status(200).json(result);
    });    
});

//endpoint para capturar um usuário por id
router.get('/api/usuarios/:id', (req, res) => {
    const id = req.param("id");

    let sql = `SELECT u.id, u.email, u.senha FROM usuario u WHERE u.id = ${id}`;
    con.query(sql, function (err, result) {
        if (err) throw err;
        res.status(200).json(result[0]);
    });
});

//endpoint para excluir um usuário
router.delete('/api/usuarios/:id', (req, res) => {
    const id = req.param("id");

    var sql = `DELETE FROM usuario WHERE id = ${id} `;
    con.query(sql, function (err, result) {
        if (err) throw err;
    });

    res.status(200).send(`usuario com id ${id} excluído`);
});

// endpoint para editar um usuario
router.put("/api/usuarios/:id", (req, res) => {
    const { id } = req.params;
    const { email, senha } = req.body;

    // Make sure the ID exists and is valid
    if (!id || !email || !senha) {
        return res.status(400).json({ message: "ID, email e senha são necessários." });
    }

    const sql = `UPDATE usuario SET EMAIL = ?, SENHA = ? WHERE ID = ?`;

    con.query(sql, [email, senha, id], function (err, result) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Erro ao atualizar o usuário." });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }

        res.status(200).json({ id, email, senha });
    });
});

//endpoint para logar
router.post("/api/login", (req, res) => {
    const usuario = req.body;
    const email = usuario.email;
    const senha = usuario.senha;

    const sql = `SELECT ID, EMAIL FROM USUARIO WHERE EMAIL = '${email}' AND SENHA = '${senha}'`;

    con.query(sql, function (err, result) {
        if (err) throw err;
        //TODO caso não ache o usuário deve ser 401
        console.log(result);
        res.status(200).json(result);
    }); 
});

//endpoint para adicionar uma música
router.post("/musicas", upload.fields([{ name: 'IMG_COVER' }, { name: 'AUDIO' }]), (req, res) => {
    const nome = req.body.NOME;
    const artista = req.body.ARTISTA;
    const imgCover = req.files['IMG_COVER'] ? req.files['IMG_COVER'][0] : req.body.IMG_COVER;  // Use URL if no new file
    const audio = req.files['AUDIO'] ? req.files['AUDIO'][0] : req.body.AUDIO;  // Use URL if no new file

    // Log incoming data
    console.log("Nome:", nome);
    console.log("Artista:", artista);
    console.log("IMG_COVER:", imgCover);
    console.log("AUDIO:", audio);

    // Validate required fields
    if (!nome || !artista) {
        return res.status(400).json({ error: "Nome e Artista são obrigatórios" });
    }

    // If no new files, check if existing URLs are provided
    if (!imgCover && !audio) {
        return res.status(400).json({ error: "Pelo menos um arquivo (imagem ou áudio) deve ser enviado" });
    }


    let imgCoverBuffer = imgCover instanceof Object ? imgCover.buffer : imgCover;  // If it's a file, get the buffer
    let audioBuffer = audio instanceof Object ? audio.buffer : audio;  // If it's a file, get the buffer
    let audioType = audio instanceof Object ? audio.mimetype : 'audio/mpeg';  // Default audio type if not uploaded

    const values = [
        nome,
        artista,
        imgCoverBuffer,
        audioType,
        audioBuffer
    ];

    const q = "INSERT INTO musicas (`NOME`, `ARTISTA`, `IMG_COVER`, `AUDIOTYPE`, `AUDIO`) VALUES (?)";
    con.query(q, [values], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Erro ao salvar a música" });
        }
        res.status(201).json({ message: "Música salva com sucesso!", id: result.insertId });
    });
});

// endpoint para editar uma música
router.put("/musicas/:id", upload.fields([{ name: 'IMG_COVER' }, { name: 'AUDIO' }]), (req, res) => {
    const { id } = req.params;
    const nome = req.body.NOME;
    const artista = req.body.ARTISTA;
    const imgCover = req.files['IMG_COVER'] ? req.files['IMG_COVER'][0] : null;
    const audio = req.files['AUDIO'] ? req.files['AUDIO'][0] : null;

    if (!nome || !artista) {
        return res.status(400).json({ error: "Nome e Artista são obrigatórios" });
    }

    // If there's a new image or audio, handle that
    const updateValues = [
        nome,
        artista,
        imgCover ? imgCover.buffer : null,
        audio ? audio.mimetype : null,
        audio ? audio.buffer : null,
        id
    ];

    // Build SQL query based on which files (image/audio) are updated
    let sql = "UPDATE musicas SET NOME = ?, ARTISTA = ?";
    if (imgCover) sql += ", IMG_COVER = ?";
    if (audio) sql += ", AUDIOTYPE = ?, AUDIO = ?";
    sql += " WHERE ID = ?";

    con.query(sql, updateValues, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Erro ao atualizar a música" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Música não encontrada" });
        }

        res.status(200).json({ message: "Música atualizada com sucesso!" });
    });
});


//endpoint para selecionar todas as músicas
router.get("/musicas", (req,res) => {
    const q = "SELECT * FROM musicas"

    con.query(q,(err,data) => {
        if(err) return res.json(err);
        return res.json(data);
    })
});

//endpoint para capturar um áudio de música por id
router.get('/musicas/audio/:id', (req, res) => {
    const id = req.params.id;
    const range = req.headers.range;  // Get the range header
    if (!range) {
        return res.status(400).send('Requires Range header');
    }

    const q = "SELECT AUDIO, AUDIOTYPE FROM musicas WHERE ID = ?";
    con.query(q, [id], (err, result) => {
        if (err || result.length === 0) {
            return res.status(404).send('Áudio não encontrado');
        }
        const audioData = result[0];
        const audioBuffer = audioData.AUDIO;
        const audioType = audioData.AUDIOTYPE;
        
        const audioSize = audioBuffer.length;
        const chunkSize = 10 ** 6; // 1 MB per chunk
        const start = parseInt(range.replace(/\D/g, ''));
        const end = Math.min(start + chunkSize, audioSize - 1);

        res.setHeader('Content-Type', audioType);
        res.setHeader('Content-Length', end - start + 1);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${audioSize}`);
        res.status(206);
        
        res.send(audioBuffer.slice(start, end + 1));
        // res.set('Content-Type', audioData.AUDIOTYPE);
        // res.send(audioData.AUDIO);
    });
});

//endpoint para capturar a capa da música por id
router.get("/musicas/image/:id", (req, res) => {
    const musicId = req.params.id;

    const query = "SELECT `IMG_COVER` FROM musicas WHERE `ID` = ?";
    con.query(query, [musicId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Erro ao recuperar a imagem" });
        }

        if (results.length > 0) {
            const imgCover = results[0].IMG_COVER;
            // Set the correct MIME type for the image
            res.setHeader('Content-Type', 'image/*'); // or 'image/png' if your image is PNG
            res.send(imgCover);
        } else {
            res.status(404).json({ error: "Imagem não encontrada" });
        }
    });
});

//endpoint para capturar uma música por id
router.get('/musicas/:id', (req,res) => {
    const id = req.params.id;
    const q = "SELECT ID, NOME, ARTISTA, IMG_COVER FROM musicas WHERE ID = ?";
    con.query(q, [id], (err, result) => {
        if (err || result.length === 0) {
            return res.status(404).send('Não encontrado');
        }
        res.status(200).json(result[0]);
    });
});

//endpoint para excluir uma música
router.delete('/musicas/:id', (req, res) => {
    const id = req.param("id");

    var sql = `DELETE FROM musicas WHERE id = ${id} `;
    con.query(sql, function (err, result) {
        if (err) throw err;
    });

    res.status(200).send(`música com id ${id} excluído`);
});

app.get('/hello', (req, res) => {
    res.send('Hello, World!');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});