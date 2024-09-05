const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Configuração do body-parser para tratar os dados enviados via POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Adicionei para suportar JSON no corpo da requisição

// Configuração da conexão com o banco de dados
const con = mysql.createConnection({
    host: process.env.DB_HOST || "sql12.freemysqlhosting.net",
    user: process.env.DB_USER || "sql12729549",
    password: process.env.DB_PASSWORD || "yGNhkW6zAD",
    database: process.env.DB_NAME || "sql12729549",
    connectTimeout: 9000000 // 10 segundos de timeout
});

con.connect(function (err) {
    if (err) {
        console.error('Erro de conexão:', err);
        throw err;
    }
    console.log("Conectado ao MySQL!");
});

// Configuração do multer para upload de arquivos
const storage = multer.memoryStorage(); // Armazenamento em memória
const upload = multer({ storage: storage });

// Rotas
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/menu.html');
});

app.get('/formulario', (req, res) => {
    res.sendFile(__dirname + '/form.html');
});

app.get('/delete', (req, res) => {
    res.sendFile(__dirname + '/delete.html');
});

app.get('/search', (req, res) => {
    res.sendFile(__dirname + '/search.html');
});

app.get('/consulta', (req, res) => {
    res.sendFile(__dirname + '/consulta.html');
});

app.get('/update', (req, res) => {
    res.sendFile(__dirname + '/update.html');
});

app.get('/listar', (req, res) => {
    res.sendFile(__dirname + '/listar.html');
});

// Rota para listar todos os usuários
app.get('/usuarios', (req, res) => {
    const sql = "SELECT * FROM usuario";
    con.query(sql, function (err, result) {
        if (err) {
            console.error('Erro ao buscar usuários:', err);
            res.status(500).send("Erro ao buscar os dados.");
            return;
        }
        res.json(result);
    });
});

// Rota para adicionar um novo usuário
app.post('/submit', upload.single('image'), (req, res) => {
    const { name, password, phone } = req.body;
    const image = req.file ? req.file.buffer : null; // Armazena a imagem como buffer

    const sql = "INSERT INTO usuario (nome, senha, telefone, imagem) VALUES (?, ?, ?, ?)";
    con.query(sql, [name, password, phone, image], function (err, result) {
        if (err) {
            console.error('Erro ao inserir no banco de dados:', err);
            res.status(500).send("Erro ao salvar os dados. Por favor, tente novamente.");
            return;
        }
        res.send("Cadastro realizado com sucesso!");
    });
});

// Rota para excluir um usuário
app.post('/delete', (req, res) => {
    const { id } = req.body;
    const sql = "DELETE FROM usuario WHERE id = ?";
    con.query(sql, [id], function (err, result) {
        if (err) {
            console.error('Erro ao excluir do banco de dados:', err);
            res.status(500).send("Erro ao excluir o usuário. Por favor, tente novamente.");
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).send("Usuário não encontrado.");
            return;
        }
        res.send("Usuário excluído com sucesso!");
    });
});

// Rota para buscar um usuário pelo nome
app.get('/search-results', (req, res) => {
    const { query } = req.query;
    const sql = "SELECT * FROM usuario WHERE nome LIKE ? OR telefone LIKE ? OR senha LIKE ? OR id = ?";
    con.query(sql, [`%${query}%`, `%${query}%`, `%${query}%`, query], function (err, result) {
        if (err) {
            console.error('Erro ao buscar no banco de dados:', err);
            res.status(500).send("Erro ao buscar os dados. Por favor, tente novamente.");
            return;
        }
        if (result.length === 0) {
            res.status(404).send("Usuário não encontrado.");
            return;
        }
        res.json(result);
    });
});

// Rota para atualizar as informações de um usuário
app.post('/update', (req, res) => {
    const { id, name, password, phone } = req.body;
    const sql = "UPDATE usuario SET nome = ?, senha = ?, telefone = ? WHERE id = ?";
    con.query(sql, [name, password, phone, id], function (err, result) {
        if (err) {
            console.error('Erro ao atualizar no banco de dados:', err);
            res.status(500).send("Erro ao atualizar os dados. Por favor, tente novamente.");
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).send("Usuário não encontrado.");
            return;
        }
        res.send("Informações atualizadas com sucesso!");
    });
});

// Rota para servir as imagens
app.get('/image/:id', (req, res) => {
    const { id } = req.params;
    const sql = "SELECT imagem FROM usuario WHERE id = ?";
    con.query(sql, [id], function (err, result) {
        if (err) {
            console.error('Erro ao buscar a imagem:', err);
            res.status(500).send("Erro ao buscar a imagem.");
            return;
        }
        if (result.length === 0 || !result[0].imagem) {
            res.status(404).send("Imagem não encontrada.");
            return;
        }
        const image = result[0].imagem;
        res.setHeader('Content-Type', 'image/jpeg'); // Ajuste o tipo de imagem conforme necessário
        res.send(image);
    });
});

// Iniciar o servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
