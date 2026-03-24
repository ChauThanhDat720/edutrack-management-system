const moment = require('moment');
const Session = require('../models/Session');

exports.generateSemester = async (classDoc, startDate, endDate) => {
    const sessions = [];
    let currentDate = moment(startDate).startOf('day');
    const end = moment(endDate).endOf('day');

    const scheduleMap = {};
    classDoc.schedule.forEach(s => {
        scheduleMap[s.dayOfWeek] = s;
    });

    while (currentDate <= end) {
        const dayName = currentDate.format('dddd');

        if (scheduleMap[dayName]) {
            // Thêm buổi học vào danh sách tạm thời
            sessions.push({
                classId: classDoc._id,
                date: currentDate.toDate(),
                startTime: scheduleMap[dayName].startTime,
                endTime: scheduleMap[dayName].endTime,
                teacher: classDoc.teacher,
                status: 'scheduled'
            });
        }


        currentDate.add(1, 'days');
    }

    // Sau khi chạy xong vòng lặp, lưu tất cả vào DB một lần duy nhất
    if (sessions.length > 0) {
        return await Session.insertMany(sessions);
    }

    return [];
};