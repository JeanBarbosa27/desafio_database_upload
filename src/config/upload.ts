import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const directoryPath = path.resolve(__dirname, '..', '..', 'tmp');

export default {
  directory: directoryPath,
  storage: multer.diskStorage({
    destination: directoryPath,
    filename(request, file, callback) {
      const hash = crypto.randomBytes(10).toString('HEX');
      const uniqueFilename = `${hash}-${file.originalname}`;

      return callback(null, uniqueFilename);
    },
  }),
};
