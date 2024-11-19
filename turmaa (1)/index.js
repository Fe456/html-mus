const port = 3000;

var express = require('express');
const router = express.Router();
var mysql = require('mysql2');
var cors = require('cors');

var app = express();
app.use(express.json());
app.use(express.static('./pages'));
app.use(router);
app.use(cors);


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
        response.status(200).json(result);
    });    
});

router.post("api/login", (req, res) => {
    const usuario = req.body;
    const email = usuario.email;
    const senha = usuario.senha;

    const sql = `SELECT ID FROM USUARIO WHERE EMAIL = '${email}' AND SENHA = '${senha}'`;

    con.query(sql, function (err, result) {
        if (err) throw err;
        //TODO caso não ache o usuário deve ser 401
        console.log(result);
        res.status(200).json(result);
    }); 
});

router.get("/musicas", (req,res) => {
    const q = "SELECT * FROM musicas"

    con.query(q,(err,data) => {
        if(err) return res.json(err);
        return res.json(data);
    })
});

router.post("/musicas", (req, res) => {
    const q = "INSERT INTO musicas (`NOME`, `ARTISTA`, `IMG_COVER`, `AUDIO`) VALUES (?)"
    const values = [
        req.body.NOME,
        req.body.ARTISTA,
        req.body.IMG_COVER,
        req.body.AUDIO];

    con.query(q, [values], (err,data) => {
        if(err) return res.json(err);
        return res.json("musica criada");
    })
});

app.get('/hello', (req, res) => {
    res.send('Hello, World!');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});