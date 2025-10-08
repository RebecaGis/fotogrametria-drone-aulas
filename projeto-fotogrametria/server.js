const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuração do PostgreSQL - AJUSTE COM SUAS CREDENCIAIS
const pool = new Pool({
    user: 'postgres',           // Seu usuário PostgreSQL
    host: 'localhost',              // Seu host
    database: 'fotogrametria_drone', // Nome do banco
    password: 'postgres',          // Sua senha
    port: 5432,                     // Porta do PostgreSQL
});

// Testar conexão com o banco
pool.connect((err, client, release) => {
    if (err) {
        console.error('Erro ao conectar com o PostgreSQL:', err);
    } else {
        console.log('Conectado ao PostgreSQL com sucesso!');
        release();
    }
});

// ROTAS DA API

// Buscar todos os recursos
app.get('/api/resources', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM resources 
            ORDER BY created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar recursos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Adicionar novo recurso
app.post('/api/resources', async (req, res) => {
    try {
        const { type, title, url, description } = req.body;
        
        if (!type || !title || !url) {
            return res.status(400).json({ error: 'Tipo, título e URL são obrigatórios' });
        }

        const result = await pool.query(`
            INSERT INTO resources (type, title, url, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [type, title, url, description || '']);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao adicionar recurso:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Deletar recurso
app.delete('/api/resources/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await pool.query('DELETE FROM resources WHERE id = $1', [id]);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao deletar recurso:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Servir o arquivo HTML principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});