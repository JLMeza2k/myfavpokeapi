const express = require('express');
const cors = require('cors');
const connect = require('./db');
const server = require('./socket')
const pokeRoutes = require('./routes/pokefav')
const gameRoutes = require('./routes/gameboard')
const dashBoardRoutes = require('./routes/dashboard')

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

app.use('/', pokeRoutes)
app.use('/', gameRoutes)
app.use('/', dashBoardRoutes)


app.get("/", (req, res) => res.send("MyAPI"));


app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'), () => {
    //console.log(bcrypt.hashSync('UabcsIDS25!', 10))
    console.log(`app escuchando en el puerto ${app.get('port')}`);
});

const SOCKET_PORT = process.env.SOCKET_PORT || 3001;
server.listen(SOCKET_PORT , () => {
  console.log(`Servidor Socket.IO escuchando en el puerto ${SOCKET_PORT}`);
});
