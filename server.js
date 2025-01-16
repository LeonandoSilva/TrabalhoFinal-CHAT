const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let users = {};

app.use(express.static('public'));

io.on('connection', (socket) => {
    socket.on('newUser', (username, color) => {
        users[socket.id] = { username, color, blocked: [] };
        io.emit('updateUserList', users);
    });

    socket.on('sendMessage', (message, recipientId) => {
        if (recipientId) {
            const recipient = users[recipientId];
            if (!recipient.blocked.includes(socket.id)) {
                io.to(recipientId).emit('receiveMessage', { message, username: users[socket.id].username, color: users[socket.id].color });
            }
        } else {
            socket.broadcast.emit('receiveMessage', { message, username: users[socket.id].username, color: users[socket.id].color });
        }
    });

    socket.on('blockUser', (userId) => {
        if (users[socket.id]) {
            users[socket.id].blocked.push(userId);
        }
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('updateUserList', users);
    });
});

server.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});