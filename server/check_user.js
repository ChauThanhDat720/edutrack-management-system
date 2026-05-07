const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const user = await User.findOne({ role: 'admin' });
        if (user) {
            console.log('ADMIN USER FOUND:');
            console.log(JSON.stringify({
                id: user._id,
                email: user.email,
                role: user.role,
                name: user.name
            }, null, 2));
        } else {
            console.log('NO ADMIN USER FOUND');
            const anyUser = await User.findOne({});
            if (anyUser) {
                console.log('RANDOM USER FOUND:');
                console.log(JSON.stringify({
                    id: anyUser._id,
                    email: anyUser.email,
                    role: anyUser.role,
                    name: anyUser.name
                }, null, 2));
            }
        }
        
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

checkUser();
