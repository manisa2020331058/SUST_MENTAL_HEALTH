const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid'); // Make sure to install uuid package

const createBase64ImageUpload = (uploadType) => {
  const uploadPath = path.join(process.cwd(), 'uploads', 'profile-pictures', uploadType);
  const upload = multer({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  });

  // Function to save base64 image
  const saveBase64Image = (base64Data, uploadPath) => {
    // Ensure directory exists
    fs.mkdirSync(uploadPath, { recursive: true });

    // Remove data URL prefix if exists
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
    
    // Determine file extension
    const imageType = base64Data.split(';')[0].split('/')[1];
    const filename = `${uuidv4()}.${imageType}`;
    const filepath = path.join(uploadPath, filename);

    // Validate file type
    const allowedTypes = ['jpeg', 'png', 'gif', 'webp'];
    if (!allowedTypes.includes(imageType)) {
      throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
    }

    // Write file
    fs.writeFileSync(filepath, base64Image, 'base64');

    return path.join('uploads', 'profile-pictures', uploadType, filename).replace(/\\/g, '/');
  };

  return {
    uploadBase64Image: (base64Data) => {
      if (!base64Data) return null;
      return saveBase64Image(base64Data, uploadPath);
    }
  };
};

const psychologistProfilePicUpload = createBase64ImageUpload('psychologists');
const studentProfilePicUpload = createBase64ImageUpload('students');

module.exports = {
  psychologistProfilePicUpload,
  studentProfilePicUpload
};