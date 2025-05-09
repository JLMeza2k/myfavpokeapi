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

app.get("/", (req, res) => res.send("MyPokefavs"));

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


app.get('/users', async (req, res) => {
    let db;
    try {
        db = await connect();
        const [rows] = await db.query('SELECT * FROM users');
        res.json(rows);
    } catch(err) {
        console.error('Ocurrió un error al obtener los usuarios');
        res.json({ error: 'Ocurrió un error al obtener los usuarios' });
    } finally {
        if (db) await db.end();
    }
});

app.post('/users', async (req, res) => {
    let db;
    try {
        db = await connect();
        const { username, nombre, apellido, email, password, activo } = req.body;
        const query = `INSERT INTO users (username, nombre, apellido, email, password, activo) VALUES ('${username}', '${nombre}', '${apellido}', '${email}', '${password}', ${activo})`;    
        const [result] = await db.execute(query);
        res.json({ message: `Usuario ${username} agregado` });
    } catch(err) {
        res.json({ message: 'Ocurrió un error al agregar el usuario' });
    } finally {
        if (db) await db.end();
    }
});





