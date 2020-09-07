const http =require('http'); //built in node module
const express = require('express');
const socketio = require('socket.io');
const cors = require('cors');

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users.js');

const PORT = process.env.PORT || 5000;

const router = require('./router');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (socket) => {
    console.log('We have a new connection!!!');
    socket.on('join', ({ name, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, name, room });

        if(error) return callback(error);
        
        socket.emit('message', { user: 'admin', text: `${user.name}, welcome to the room ${user.room}` }); //payload of the event comes after ,
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name}, has joined!`})
        
        socket.join(user.room);

        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) })

        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);

        io.to(user.room).emit('message', { user: user.name, text: message });

        callback();

    })

    socket.on('disconnect', () => {
        // console.log('User had left!!!');
        const user = removeUser(socket.id);

        if(user) {
            io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left.` })
            io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
        }
    })
});

app.use(router); //use it as a m/w
app.use(cors());

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));

