const axios = require('axios');

const testAnnouncement = async () => {
    try {
        console.log('1. Đăng nhập để lấy Token...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@test.com',
            password: 'admin123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Đăng nhập thành công, đã lấy được Token.');

        console.log('\n2. Đăng một thông báo mới...');

        const newAnnouncement = {
            title: 'Thông báo nghỉ học ngày 10/10',
            content: 'Cả trường sẽ được nghỉ học ngày 10/10 nhân kỷ niệm ngày thành lập trường.',
            targetRole: 'all'
        };

        const postResponse = await axios.post(
            'http://localhost:5000/api/announcements',
            newAnnouncement,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        console.log('✅ Đăng thông báo thành công!');
        console.log('Dữ liệu trả về:', postResponse.data);

        console.log('\n3. Lấy danh sách thông báo để kiểm tra...');
        const getResponse = await axios.get('http://localhost:5000/api/announcements');
        console.log(`✅ Lấy bài thành công (${getResponse.data.count} bài đăng):`);
        console.log(getResponse.data.data);

    } catch (error) {
        console.error('❌ Thử nghiệm thất bại!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
};

testAnnouncement();
