const express = require('express');
const cors = require('cors');
const connect = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());


app.get('/users', async (req, res) => {
    let db;
    try {

        db = await connect();
        const [rows] = await db.query('SELECT username, first_name, last_name, email, password, activo FROM users');
        res.status(200).json(rows);
    } catch(err) {
        console.error('Ocurrió un error al obtener los usuarios');
        res.status(500).json({message: db ? err.sqlMessage : "DB connection issue"});
    } finally {
        if (db) await db.end();
    }
});


app.get('/user', checkToken, async (req, res) => { 
    let db;
    try{
        console.log(req.params)
        db = await connect();
        const query = `SELECT id, username, first_name, last_name, email, profile_image FROM users WHERE id=${req.idUser}`;
        const [userRow] = await db.execute(query);
        if(userRow.length === 0)
            throw new Error('No se encontró el usuario');
        res.status(200).json({userRow})
    } catch(err) {
        return res.status(500).json({message: db ? err.sqlMessage : "DB connection issue"}) 
    } finally {
        if(db) await db.end();
    }
});


app.post('/user', async (req, res) => {
    let db;
    const saltRounds = 10;
    try {
        db = await connect();
        const { username, nombre, apellido, email, password, image } = req.body;
        const hashPassword = bcrypt.hashSync(password, saltRounds);
        query = `CALL SP_CREATE_USER('${username}', '${nombre}', '${apellido}', '${email}', '${hashPassword}', ?)`;
        console.log(query)
        const [result] = await db.execute(query, [image]);
        res.status(200).json(result)
    } catch(err) {
        console.log(err)
        return res.status(500).json({message: db ? err.sqlMessage : "DB connection issue"}) 
    } finally {
        if (db) await db.end();
    }
});

app.post('/login', async (req, res) => { 
    let db;
    try{
        const { identifier, password } = req.body
        db = await connect();
        let idUser = 0;
        const query = `SELECT id, password FROM users WHERE username ='${identifier}' OR email='${identifier}'`;
        const [rows] = await db.execute(query);
        if(rows.length > 0) {
            if(bcrypt.compareSync(password, rows[0].password))
                idUser=rows[0].id
            else
                throw new Error('Contraseña incorrecta');
        }
        else
            throw new Error('El usuario no existe');
        const token = jwt.sign({idUser}, process.env.SECRET, {expiresIn: '1d'})
        res.status(200).json({token: token})
    } catch(err) {
        return res.status(500).json({message: err.message}) 
    } finally {
        if(db)
            db.end();
    }
});

function checkToken(req, res, next) {
    const token = req.headers['authorization'];
    if(typeof token === 'undefined')
        res.sendStatus(403)
    else{
        const tokenData = jwt.verify(token, process.env.SECRET, (err, data) =>{
            if(err)
                res.sendStatus(403);
            else
                req.idUser=data.idUser
        })
        next();
    }
}

module.exports = app;