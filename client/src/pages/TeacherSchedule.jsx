import React from 'react';
import WeeklySchedule from '../components/WeeklySchedule';

const TeacherSchedule = () => {
    return (
        <WeeklySchedule 
            fetchEndpoint="/sessions/my-schedule" 
            title="Lịch Giảng Dạy" 
        />
    );
};

export default TeacherSchedule;
