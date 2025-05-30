const express = require('express');
const cors = require('cors');
const connect = require('../db');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());



app.get('/favorites', async (req, res) => {
    let db;
    try {
        db = await connect();
        const [rows] = await db.query('SELECT name, url FROM fav_pokemon');
        res.json(rows);
    } catch(err) {
        console.error('Ocurrió un error al obtener los favoritos');
        res.json({ error: 'Ocurrió un error al obtener los favoritos' });
    } finally {
        if (db) await db.end();
    }
});

app.post('/favorites', async (req, res) => {
    let db;
    try {
        db = await connect();
        const { id, url, name, height, weight, hp, attack, defense, special_attack, special_defense, speed } = req.body;
        const query = `INSERT INTO fav_pokemon (id, url, name, height, weight, hp, attack, defense, special_attack, special_defense, speed) VALUES (${id}, '${url}', '${name}', ${height}, ${weight}, ${hp}, ${attack}, ${defense}, ${special_attack}, ${special_defense}, ${speed})`;    
            const [result] = await db.execute(query);
        res.json({ message: 'Pokemon favorito agregado' });
    } catch(err) {
        res.json({ message: 'Ocurrió un error al agregar el favorito' });
    } finally {
        if (db) await db.end();
    }
});

app.delete('/favorites', async (req, res) => {
    let db;
    try {
        db = await connect();
        const { id } = req.body;
        const query = `DELETE FROM fav_pokemon WHERE id=${id}`;
        const [result] = await db.execute(query);
        res.json({ message: 'Pokemon favorito eliminado' });
    } catch(err) {
        res.json({ message: 'Ocurrió un error al eliminar el favorito' });
    } finally {
        if (db) await db.end();
    }
});

module.exports = app;