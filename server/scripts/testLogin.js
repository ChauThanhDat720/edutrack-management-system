const axios = require('axios');

const testLogin = async () => {
    try {
        console.log('Sending login request to http://localhost:5000/api/auth/login...');
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@test.com',
            password: 'admin123'
        });

        console.log('✅ Login Successful!');
        console.log('User Data:', response.data);
        console.log('🔑 JWT Token:\n', response.data.token);
    } catch (error) {
        console.error('❌ Login Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
};

testLogin();
