const XLSX = require('xlsx');
const User = require('../models/User');
const Class = require('../models/Class');
const { broadcast } = require('../config/socket');

// @desc    Import students from Excel file
// @route   POST /api/users/import-excel
// @access  Admin
// Expected Excel columns: Name, Email, ClassName, BirthDate, Gender, PhoneNumber
exports.importFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            console.error('[Excel Import] No file uploaded');
            return res.status(400).json({ success: false, message: 'Vui lòng tải lên file Excel' });
        }

        console.log(`[Excel Import] Starting import. File size: ${req.file.size} bytes`);

        // Parse workbook from buffer (in-memory)
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert sheet to JSON rows
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        console.log(`[Excel Import] Parsed ${rows?.length || 0} rows from sheet: ${sheetName}`);

        if (!rows || rows.length === 0) {
            return res.status(400).json({ success: false, message: 'File Excel không có dữ liệu' });
        }

        const DEFAULT_PASSWORD = 'Student@123';
        const results = {
            created: [],
            skipped: [],
            errors: []
        };

        // Pre-load all classes
        const allClasses = await Class.find({});
        const classMap = {};
        allClasses.forEach(c => {
            classMap[c.className.toLowerCase().trim()] = c._id;
        });

        // Helper to find value by multiple possible keys (case-insensitive)
        const getValue = (row, possibleKeys) => {
            const rowKeys = Object.keys(row);
            for (const key of possibleKeys) {
                const foundKey = rowKeys.find(rk => 
                    rk.toLowerCase().trim().replace(/\s/g, '') === key.toLowerCase().trim().replace(/\s/g, '')
                );
                if (foundKey) return row[foundKey];
            }
            return '';
        };

        for (const [index, row] of rows.entries()) {
            const name = String(getValue(row, ['Name', 'HoTen', 'HọTên', 'FullName', 'Tên']) || '').trim();
            const email = String(getValue(row, ['Email', 'Thưđiệntử', 'DiaChiEmail']) || '').trim().toLowerCase();
            const classNameSource = String(getValue(row, ['ClassName', 'Lop', 'Lớp', 'Class']) || '').trim();
            const teacherSource = String(getValue(row, ['Teacher', 'GiaoVien', 'GiáoViên', 'GVCN', 'EmailGV', 'Giáo viên chủ nhiệm']) || '').trim();
            const gender = String(getValue(row, ['Gender', 'GioiTinh', 'GiớiTính', 'Phái']) || '').trim();
            const phoneNumber = String(getValue(row, ['PhoneNumber', 'SDT', 'SốĐiệnThoại', 'Phone']) || '').trim();

            console.log(`[Excel Import] Processing row ${index + 1}: ${name} (${email}) - Class: ${classNameSource}`);

            // Basic validation
            if (!name || !email) {
                results.errors.push({ row: name || email || `Hàng ${index + 1}`, reason: 'Thiếu Họ Tên hoặc Email' });
                continue;
            }

            // Check for duplicate email
            const existing = await User.findOne({ email });
            if (existing) {
                results.skipped.push({ name, email, reason: 'Email đã tồn tại' });
                continue;
            }

            // Resolve or Create Class
            let classId = null;
            if (classNameSource) {
                const normalizedClassName = classNameSource.toLowerCase().trim();
                
                // 1. Check in cache/existing map
                if (classMap[normalizedClassName]) {
                    classId = classMap[normalizedClassName];
                } else {
                    // 2. Class doesn't exist yet, try to create it
                    console.log(`[Excel Import] Class ${classNameSource} not found. Attempting auto-create...`);
                    
                    try {
                        if (!teacherSource) {
                            throw new Error(`Cần thông tin Giáo viên chủ nhiệm để tạo lớp mới: ${classNameSource}`);
                        }

                        // Find teacher by email or name
                        let teacher = await User.findOne({
                            $or: [{ email: teacherSource.toLowerCase() }, { name: teacherSource }],
                            role: 'teacher'
                        });

                        if (!teacher) {
                            console.log(`[Excel Import] Teacher ${teacherSource} not found. Creating new teacher account...`);
                            
                            // Generate a simple email for the teacher if teacherSource is just a name
                            const teacherEmail = teacherSource.includes('@') 
                                ? teacherSource.toLowerCase() 
                                : `${teacherSource.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').replace(/\s+/g, '.')}@school.com`;

                            // Double check if generated email exists
                            const existingTeacher = await User.findOne({ email: teacherEmail });
                            if (existingTeacher) {
                                teacher = existingTeacher;
                            } else {
                                teacher = await User.create({
                                    name: teacherSource,
                                    email: teacherEmail,
                                    password: 'Teacher@123',
                                    role: 'teacher'
                                });
                            }
                        }

                        // Create new class
                        const newClass = await Class.create({
                            className: classNameSource,
                            teacher: teacher._id,
                            room: classNameSource, // Phòng học = Tên lớp
                            schedule: [] // Lịch học trống, cập nhật sau
                        });

                        // Sync: Add class to teacher's assignedClasses
                        await User.findByIdAndUpdate(teacher._id, {
                            $addToSet: { 'teacherDetails.assignedClasses': newClass._id }
                        });

                        console.log(`[Excel Import] Created new class: ${classNameSource} with teacher ${teacher.name}`);
                        
                        // Update cache
                        classMap[normalizedClassName] = newClass._id;
                        classId = newClass._id;
                    } catch (classErr) {
                        console.error(`[Excel Import] Class/Teacher creation failed:`, classErr.message);
                        results.errors.push({ row: name, reason: classErr.message });
                        continue; 
                    }
                }
            }

            try {
                const newUser = await User.create({
                    name,
                    email,
                    password: DEFAULT_PASSWORD,
                    role: 'student',
                    profile: {
                        gender: ['Male', 'Female', 'Other', 'Nam', 'Nữ'].includes(gender) 
                            ? (gender === 'Nam' ? 'Male' : (gender === 'Nữ' ? 'Female' : gender)) 
                            : undefined,
                        phoneNumber: phoneNumber || undefined
                    },
                    studentDetails: {
                        studentId: `HS${Date.now()}${Math.floor(Math.random() * 1000)}`,
                        class: classId || undefined,
                        className: classNameSource || undefined
                    }
                });

                if (classId) {
                    await Class.findByIdAndUpdate(classId, {
                        $addToSet: { students: newUser._id }
                    });
                }

                results.created.push({ name, email, class: classNameSource || 'Không xếp lớp' });
            } catch (createErr) {
                console.error(`[Excel Import] Error creating user at row ${index + 1}:`, createErr.message);
                results.errors.push({ row: name, reason: createErr.message });
            }
        }

        console.log(`[Excel Import] Completed. Created: ${results.created.length}, Skipped: ${results.skipped.length}, Errors: ${results.errors.length}`);

        // Phát tín hiệu Socket để đồng bộ dữ liệu cho tất cả Admin đang online
        if (results.created.length > 0 || results.errors.length > 0) {
            broadcast('users_updated', {
                message: `Đã xử lý file Excel. Thành công: ${results.created.length}, Lỗi: ${results.errors.length}`,
                type: 'IMPORT',
                count: results.created.length
            });
        }

        res.status(200).json({
            success: true,
            message: `Xử lý thành công ${results.created.length} học sinh`,
            data: results
        });


    } catch (error) {
        console.error('Import Excel error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Generate and return a sample Excel template
// @route   GET /api/users/excel-template
// @access  Admin
exports.downloadTemplate = (req, res) => {
    const templateData = [
        {
            'Họ Tên': 'Nguyễn Văn A',
            Email: 'nguyenvana@school.com',
            'Lớp': '10A1',
            'Giáo viên chủ nhiệm': 'gv01@school.com',
            'Giới Tính': 'Nam',
            'Số Điện Thoại': '0901234567'
        },
        {
            'Họ Tên': 'Trần Thị B',
            Email: 'tranthib@school.com',
            'Lớp': '10A2',
            'Giáo viên chủ nhiệm': 'gv02@school.com',
            'Giới Tính': 'Nữ',
            'Số Điện Thoại': '0912345678'
        }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    ws['!cols'] = [
        { wch: 25 }, { wch: 30 }, { wch: 12 },
        { wch: 10 }, { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Students');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=student_import_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
};
