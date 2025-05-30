const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);



const io = new Server(server, {
  cors: {
    origin: "*", // En producción, especifica los orígenes permitidos. Ej: "http://localhost:8081" o tu URL de Expo Go
    methods: ["GET", "POST"]
  },
  transports: ['websocket'],
});

const rooms = {}; // Almacenará la información de las salas: { roomCode: { users: [], creatorSocketId: '', maxUsers: 6 } }
const MAX_USERS_PER_ROOM = 6;

io.on('connection', (socket) => {
  const { dbUserId, username, token } = socket.handshake.query; // Obtener info del usuario
  console.log(`Usuario conectado: ${username} (dbID: ${dbUserId}, socketID: ${socket.id})`);

  // (Opcional) Aquí podrías validar el token si es necesario para la conexión al socket

  socket.on('createRoom', ({ roomCode, user }) => {
    if (!roomCode || !user || !user.id || !user.username) {
        socket.emit('createRoomError', { message: 'Datos incompletos para crear la sala.' });
        return;
    }
    if (rooms[roomCode]) {
      socket.emit('createRoomError', { message: 'Este código de sala ya está en uso. Intenta con otro.' });
      return;
    }

    rooms[roomCode] = {
      users: [{ socketId: socket.id, dbUserId: user.id, username: user.username }],
      creatorSocketId: socket.id,
      maxUsers: MAX_USERS_PER_ROOM,
    };
    socket.join(roomCode);
    console.log(`Usuario ${user.username} creó la sala: ${roomCode}`);
    socket.emit('roomCreated', { roomCode, users: rooms[roomCode].users, isCreator: true });
    // No es necesario emitir groupUpdate aquí ya que roomCreated ya envía la lista de usuarios al creador.
  });

  socket.on('joinRoom', ({ roomCode, user }) => {
    if (!roomCode || !user || !user.id || !user.username) {
        socket.emit('joinError', { message: 'Datos incompletos para unirse a la sala.' });
        return;
    }
    const room = rooms[roomCode];
    if (!room) {
      socket.emit('joinError', { message: 'La sala no existe.' });
      return;
    }
    if (room.users.length >= room.maxUsers) {
      socket.emit('roomFull', { message: 'La sala está llena.' });
      return;
    }
    // Evitar que un usuario se una dos veces con el mismo dbUserId (si es una restricción deseada)
    if (room.users.some(u => u.dbUserId === user.id)) {
        socket.emit('joinError', { message: 'Ya estás en esta sala.' });
        // Podrías manejar la reconexión aquí si el socketId es diferente.
        return;
    }

    room.users.push({ socketId: socket.id, dbUserId: user.id, username: user.username });
    socket.join(roomCode);
    console.log(`Usuario ${user.username} se unió a la sala: ${roomCode}`);
    
    // Notificar al usuario que se unió
    socket.emit('joinedRoom', { roomCode, users: room.users });
    // Notificar a todos en la sala (incluido el nuevo) sobre la actualización del grupo
    io.to(roomCode).emit('groupUpdate', { users: room.users });
  });

  socket.on('startGame', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (room && room.creatorSocketId === socket.id) {
      if (room.users.length < 2) { // O tu mínimo de jugadores
        socket.emit('startGameError', { message: 'No hay suficientes jugadores para iniciar.' }); // Podrías manejar esto en el cliente también
        return;
      }
      console.log(`Iniciando juego en la sala: ${roomCode}`);
      const gameId = `game_${roomCode}_${Date.now()}`; // Un ID de juego simple
      room.gameId = gameId; // Podrías almacenar el ID del juego en la sala
      io.to(roomCode).emit('gameStarting', { gameId });
      // Aquí podrías tener lógica adicional, como guardar el estado del juego en una BD.
    } else {
        socket.emit('startGameError', { message: 'No autorizado o la sala no existe.' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Usuario desconectado: ${username} (dbID: ${dbUserId}, socketID: ${socket.id})`);
    // Encontrar la sala en la que estaba el usuario y eliminarlo
    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      const userIndex = room.users.findIndex(u => u.socketId === socket.id);

      if (userIndex !== -1) {
        room.users.splice(userIndex, 1);
        console.log(`Usuario ${username} salió de la sala: ${roomCode}`);

        if (room.creatorSocketId === socket.id) {
          // El creador se fue, notificar a los demás y eliminar la sala
          console.log(`El creador de la sala ${roomCode} se desconectó. Disolviendo sala.`);
          socket.to(roomCode).emit('creatorLeft', { message: 'El creador ha abandonado la sala. La sala se cerrará.' });
          // Asegurarse de que todos los sockets abandonen la sala antes de eliminarla
          const clientsInRoom = io.sockets.adapter.rooms.get(roomCode);
          if (clientsInRoom) {
            clientsInRoom.forEach(clientId => {
              io.sockets.sockets.get(clientId).leave(roomCode);
            });
          }
          delete rooms[roomCode];
        } else if (room.users.length === 0) {
          // La sala está vacía, eliminarla
          console.log(`La sala ${roomCode} está vacía. Eliminando sala.`);
          delete rooms[roomCode];
        } else {
          // Notificar a los demás usuarios en la sala sobre la actualización
          io.to(roomCode).emit('groupUpdate', { users: room.users });
        }
        break; // Salir del bucle una vez que se encuentra y procesa la sala
      }
    }
  });
});



module.exports = server;