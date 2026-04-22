const Notification = require('../models/Notification')
const { sendToUser } = require('../config/socket');

exports.sendNotification = async (userId, senderId, title, message, type) => {
    try {
        const notification = await Notification.create({
            recipient: userId,
            sender: senderId,
            title,
            message,
            type
        });

        // Gửi thông báo qua Socket.io thời gian thực
        sendToUser(userId, 'new_notification', {
            _id: notification._id,
            title,
            message,
            type,
            createdAt: notification.createdAt
        });
    } catch (error) {


    }
}   