const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createStorage = (uploadPath) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      // Ensure the directory exists
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Use user ID and timestamp to create unique filename
      const uniqueSuffix = `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`;
      cb(null, uniqueSuffix);
    }
  });
};

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
  }
};

const createUploadMiddleware = (uploadType) => {
  // Determine upload path based on type
  const uploadPath = path.join(process.cwd(), 'uploads', 'profile-pictures', uploadType);

  return multer({
    storage: createStorage(uploadPath),
    fileFilter: fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB file size limit
    }
  });
};

// Create specific upload middlewares
const studentProfilePicUpload = createUploadMiddleware('students');
const psychologistProfilePicUpload = createUploadMiddleware('psychologists');

module.exports = {
  studentProfilePicUpload,
  psychologistProfilePicUpload
};