const Notification = require('../models/Notification')
exports.sendNotification = async (userId, senderId, title, message, type) => {
    try {
        await Notification.create({
            recipient: userId,
            sender: senderId,
            title,
            message,
            type
        });
    } catch (error) {

    }
}   