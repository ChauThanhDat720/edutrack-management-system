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
        let currentUserId = null;

        // Client will send 'join' event with userId
        socket.on('join', (userId) => {
            if (userId) {
                currentUserId = userId.toString();
                if (!userSockets.has(currentUserId)) {
                    userSockets.set(currentUserId, new Set());
                }
                userSockets.get(currentUserId).add(socket.id);
                console.log(`User ${currentUserId} joined with socket ${socket.id}`);
            }

        });

        socket.on('disconnect', () => {
            if (currentUserId && userSockets.has(currentUserId)) {
                const sockets = userSockets.get(currentUserId);
                sockets.delete(socket.id);

                // Nếu không còn thiết bị nào online, xóa luôn userId khỏi Map
                if (sockets.size === 0) {
                    userSockets.delete(currentUserId);
                }
                console.log(`Socket ${socket.id} of User ${currentUserId} disconnected`);
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
    const sockets = userSockets.get(userId.toString());
    if (sockets && sockets.size > 0) {
        sockets.forEach(socketId => {
            io.to(socketId).emit(event, data);
        });
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
