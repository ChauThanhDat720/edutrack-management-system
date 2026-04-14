import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import toast from 'react-hot-toast';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { user, isAuthenticated } = useContext(AuthContext);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (isAuthenticated && user) {
            // Initialize socket connection
            const newSocket = io('http://localhost:5000'); // Ensure this matches your server URL
            setSocket(newSocket);

            // Emit join event with userId
            newSocket.emit('join', user.id || user._id);

            // Global listeners
            newSocket.on('new_notification', (data) => {
                toast.success(data.title, {
                    description: data.message,
                    icon: '🔔',
                    duration: 5000,
                });
            });

            return () => {
                newSocket.disconnect();
            };
        } else {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
        }
    }, [isAuthenticated, user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
