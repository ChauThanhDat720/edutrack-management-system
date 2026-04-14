const { Server } = require('socket.io');

let io;
const userSockets = new Map();
const init = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        // Client will send 'join' event with userId
        socket.on('join', (userId) => {
            if (userId) {
                userSockets.set(userId, socket.id);
                console.log(`User ${userId} joined with socket ${socket.id}`);
            }
        });

        socket.on('disconnect', () => {
            // Remove user from mapping
            for (let [userId, socketId] of userSockets.entries()) {
                if (socketId === socket.id) {
                    userSockets.delete(userId);
                    console.log(`User ${userId} disconnected`);
                    break;
                }
            }
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

const sendToUser = (userId, event, data) => {
    const socketId = userSockets.get(userId.toString());
    if (socketId) {
        io.to(socketId).emit(event, data);
        return true;
    }
    return false;
};

const broadcast = (event, data) => {
    if (io) {
        io.emit(event, data);
    }
};

module.exports = { init, getIO, sendToUser, broadcast };
