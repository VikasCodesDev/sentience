// Extend Express Request so that req.file exists after multer middleware
/// <reference types="multer" />
declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
    }
  }
}

export {};
