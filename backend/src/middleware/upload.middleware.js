const multer = require('multer');
const path = require('path');
const ApiError = require('../utils/ApiError');

// Memory storage keeps file in memory buffer for immediate processing and direct upload to Cloudinary/parsers
const storage = multer.memoryStorage();

// Allowed MIME types and extensions
const ALLOWED_MIME_TYPES = {
  resume: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  pdf: ['application/pdf'],
  image: ['image/jpeg', 'image/png', 'image/webp'],
  avatar: ['image/jpeg', 'image/png', 'image/webp'],
};

const ALLOWED_EXTENSIONS = {
  resume: ['.pdf', '.doc', '.docx'],
  pdf: ['.pdf'],
  image: ['.jpg', '.jpeg', '.png', '.webp'],
  avatar: ['.jpg', '.jpeg', '.png', '.webp'],
};

// Size limits in bytes
const SIZE_LIMITS = {
  resume: 10 * 1024 * 1024, // 10MB
  pdf: 15 * 1024 * 1024,    // 15MB
  image: 5 * 1024 * 1024,   // 5MB
  avatar: 2 * 1024 * 1024,  // 2MB
};

const createFileFilter = (type) => {
  return (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ALLOWED_EXTENSIONS[type] || [];
    const allowedMimes = ALLOWED_MIME_TYPES[type] || [];

    if (!allowedExts.includes(ext) || !allowedMimes.includes(file.mimetype)) {
      return cb(
        ApiError.badRequest(
          `Invalid file format for ${type}. Allowed extensions: ${allowedExts.join(', ')}`,
          'INVALID_FILE_TYPE'
        ),
        false
      );
    }

    cb(null, true);
  };
};

const uploadResume = multer({
  storage,
  limits: { fileSize: SIZE_LIMITS.resume },
  fileFilter: createFileFilter('resume'),
}).single('resume');

const uploadPdf = multer({
  storage,
  limits: { fileSize: SIZE_LIMITS.pdf },
  fileFilter: createFileFilter('pdf'),
}).single('file');

const uploadImage = multer({
  storage,
  limits: { fileSize: SIZE_LIMITS.image },
  fileFilter: createFileFilter('image'),
}).single('image');

const uploadAvatar = multer({
  storage,
  limits: { fileSize: SIZE_LIMITS.avatar },
  fileFilter: createFileFilter('avatar'),
}).single('avatar');

const uploadChatAttachment = multer({
  storage,
  limits: { fileSize: SIZE_LIMITS.pdf },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const validExts = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    const validMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!validExts.includes(ext) || !validMimes.includes(file.mimetype)) {
      return cb(ApiError.badRequest('Only PDF and Image files are permitted', 'INVALID_ATTACHMENT'), false);
    }
    cb(null, true);
  },
}).single('attachment');

module.exports = {
  uploadResume,
  uploadPdf,
  uploadImage,
  uploadAvatar,
  uploadChatAttachment,
};
