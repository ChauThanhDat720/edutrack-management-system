const XLSX = require('xlsx');
const User = require('../models/User');
const Class = require('../models/Class');

// @desc    Import students from Excel file
// @route   POST /api/users/import-excel
// @access  Admin
// Expected Excel columns: Name, Email, ClassName, BirthDate, Gender, PhoneNumber
exports.importFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Vui lòng tải lên file Excel' });
        }

        // Parse workbook from buffer (in-memory)
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert sheet to JSON rows
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!rows || rows.length === 0) {
            return res.status(400).json({ success: false, message: 'File Excel không có dữ liệu' });
        }

        const DEFAULT_PASSWORD = 'Student@123';
        const results = {
            created: [],
            skipped: [],
            errors: []
        };

        // Pre-load all classes into a map so we can resolve className → ObjectId
        const allClasses = await Class.find({});
        const classMap = {};
        allClasses.forEach(c => {
            classMap[c.className.toLowerCase().trim()] = c._id;
        });

        for (const row of rows) {
            const name = String(row['Name'] || row['Ho Ten'] || row['Họ Tên'] || '').trim();
            const email = String(row['Email'] || '').trim().toLowerCase();
            const className = String(row['ClassName'] || row['Lop'] || row['Lớp'] || '').trim();
            const birthDate = row['BirthDate'] || row['Ngay Sinh'] || row['Ngày Sinh'] || '';
            const gender = String(row['Gender'] || row['Gioi Tinh'] || row['Giới Tính'] || '').trim();
            const phoneNumber = String(row['PhoneNumber'] || row['SDT'] || row['Số Điện Thoại'] || '').trim();

            // Basic validation
            if (!name || !email) {
                results.errors.push({ row: name || email || '?', reason: 'Thiếu Họ Tên hoặc Email' });
                continue;
            }

            // Check for duplicate email
            const existing = await User.findOne({ email });
            if (existing) {
                results.skipped.push({ name, email, reason: 'Email đã tồn tại' });
                continue;
            }

            // Resolve className → Class ObjectId (optional)
            let classId = null;
            if (className && classMap[className.toLowerCase()]) {
                classId = classMap[className.toLowerCase()];
            }

            try {
                const newUser = await User.create({
                    name,
                    email,
                    password: DEFAULT_PASSWORD,
                    role: 'student',
                    profile: {
                        gender: ['Male', 'Female', 'Other'].includes(gender) ? gender : undefined,
                        phoneNumber: phoneNumber || undefined
                    },
                    studentDetails: {
                        studentId: `HS${Date.now()}${Math.floor(Math.random() * 100)}`,
                        class: classId || undefined
                    }
                });

                // If class exists, also push the student ID into Class.students[]
                if (classId) {
                    await Class.findByIdAndUpdate(classId, {
                        $addToSet: { students: newUser._id }
                    });
                }

                results.created.push({ name, email, class: className || 'Không xếp lớp' });
            } catch (createErr) {
                results.errors.push({ row: name, reason: createErr.message });
            }
        }

        res.status(200).json({
            success: true,
            message: `Nhập thành công ${results.created.length} học sinh`,
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
            Name: 'Nguyen Van A',
            Email: 'nguyenvana@school.com',
            ClassName: '10A1',
            BirthDate: '2008-01-15',
            Gender: 'Male',
            PhoneNumber: '0901234567'
        },
        {
            Name: 'Tran Thi B',
            Email: 'tranthib@school.com',
            ClassName: '10A2',
            BirthDate: '2008-05-20',
            Gender: 'Female',
            PhoneNumber: '0912345678'
        }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    ws['!cols'] = [
        { wch: 25 }, { wch: 30 }, { wch: 12 },
        { wch: 15 }, { wch: 10 }, { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Students');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=student_import_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
};
