import React from 'react';
import WeeklySchedule from '../components/WeeklySchedule';

const StudentSchedule = () => {
    return (
        <WeeklySchedule 
            fetchEndpoint="/sessions/student/schedule" 
            title="Lịch Học Công Nghệ" 
        />
    );
};

export default StudentSchedule;
