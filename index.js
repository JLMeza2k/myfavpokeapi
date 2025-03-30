const express = require('express');
const cors = require('cors');
const connect = require('./db');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.set('port', process.env.PORT || 3000);

app.listen(app.get('port'), () => {
    console.log(`app escuchando en el puerto ${app.get('port')}`);
});

app.get('/favorites', async (req, res) => {
    let db;
    try {
        db = await connect();
        const [rows] = await db.query('SELECT * FROM fav_pokemon');
        res.json(rows);
    } catch(err) {
        console.error('Ocurrió un error al obtener los favoritos');
        res.json({ error: 'Ocurrió un error al obtener los favoritos' });
    } finally {
        if (db) await db.end();
    }
});

app.post('/favorites', async (req, res) => {
    console.log(req.body);
    let db;
    try {
        db = await connect();
        const { id, url, poke_name, height, weight, hp, attack, defense, special_attack, special_defense, speed } = req.body;
        const query = `INSERT INTO fav_pokemon (id, url, poke_name, height, weight, hp, attack, defense, special_attack, special_defense, speed) VALUES (${id}, '${url}', '${poke_name}', ${height}, ${weight}, ${hp}, ${attack}, ${defense}, ${special_attack}, ${special_defense}, ${speed})`;    
        console.log(query);
            const [result] = await db.execute(query);
        res.json({ message: 'Pokemon favorito agregado' });
    } catch(err) {
        console.error('Ocurrió un error al agregar el favorito');
        res.json({ message: 'Ocurrió un error al agregar el favorito' });
    } finally {
        if (db) await db.end();
    }
});