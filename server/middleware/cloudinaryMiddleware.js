const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        let folder = 'school_management_uploads';
        let resource_type = 'auto'; // automatically detect if it's image, video, or raw file (pdf, etc)
        
        return {
            folder: folder,
            resource_type: resource_type,
            allowed_formats: ['jpg', 'png', 'pdf', 'docx', 'zip', 'mp4', 'mov']
        };
    },
});

const uploadCloud = multer({ storage });

module.exports = uploadCloud;
