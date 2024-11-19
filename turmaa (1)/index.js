const port = 3000;

var express = require('express');
const router = express.Router();
var mysql = require('mysql2');
const bodyParser = require("body-parser");
const cors = require('cors');

const corsOptions = {
    origin: 'http://localhost:3000', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    allowedHeaders: ['Content-Type', 'Authorization'],
  };

var app = express();
app.use(bodyParser.raw({ type: "audio/*", limit: "10mb" }));
app.use(express.json());
app.use(express.static('./pages'));
app.use(router);
app.use(cors(corsOptions));


const musicas = [];

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

router.get("/api/usuarios", (req, res) => {
    var sql = 'SELECT id, email, senha FROM usuario';
    con.query(sql, function (err, result) {
        if (err) throw err;
        res.status(200).json(result);
    });    
});

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

router.get("/musicas", (req,res) => {
    const q = "SELECT * FROM musicas"

    con.query(q,(err,data) => {
        if(err) return res.json(err);
        return res.json(data);
    })
});

router.post("/musicas", (req, res) => {
    const values = [
        req.body.NOME,
        req.body.ARTISTA,
        req.body.IMG_COVER,
        req.headers["content-type"], // Tipo do arquivo no header
        req.body.AUDIO]; // O arquivo binário];

    if (!req.headers || !req.body) {
        return res.status(400).json({ error: "Áudio inválido" });
    }

    const q = "INSERT INTO musicas (`NOME`, `ARTISTA`, `IMG_COVER`, `AUDIOTYPE`, `AUDIO`) VALUES (?)";
    con.query(q, [values], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Erro ao salvar o áudio" });
        }
        res.status(201).json({ message: "Áudio salvo com sucesso!", id: result.insertId });
    });
});

app.get('/hello', (req, res) => {
    res.send('Hello, World!');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});