const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const app = express();
app.use(cors());
app.use(express.static(__dirname));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'throwback.html'));
});
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const players = {};
io.on('connection', (socket) => {
    players[socket.id] = {
        id: socket.id,
        x: 0,
        y: 0,
        z: 0,
        ry: 0,
        colors: { head: '#e0e0e0', torso: '#e0e0e0', leftArm: '#e0e0e0', rightArm: '#e0e0e0', leftLeg: '#e0e0e0', rightLeg: '#e0e0e0' }
    };
    socket.emit('currentPlayers', players);
    socket.broadcast.emit('newPlayer', players[socket.id]);
    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            players[socket.id].z = movementData.z;
            players[socket.id].ry = movementData.ry;
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });
    socket.on('playerColorUpdate', (colors) => {
        if (players[socket.id]) {
            players[socket.id].colors = colors;
            socket.broadcast.emit('playerColorsChanged', { id: socket.id, colors });
        }
    });
    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Multiplayer server running on port ${PORT}`);
});
