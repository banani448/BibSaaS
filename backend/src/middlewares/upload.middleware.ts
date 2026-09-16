import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, uploadDir);
  },

  filename: (_, file, cb) => {
    const unique =
      Date.now() +
      '-' +
      Math.round(Math.random() * 1e9);

    cb(
      null,
      `${unique}${path.extname(file.originalname)}`
    );
  },
});

const fileFilter: multer.Options['fileFilter'] = (
  _req,
  file,
  cb,
) => {
  const allowed = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Only jpg, png and webp images are allowed'
      )
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export const uploadSingle =
  upload.single('image');

export const uploadMultiple =
  upload.array('images', 10);