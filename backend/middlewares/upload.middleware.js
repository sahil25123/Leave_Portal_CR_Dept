import fs from "fs";
import path from "path";
import multer from "multer";

const uploadDirectory = path.join(process.cwd(), "uploads");
const allowedExtensions = new Set([".pdf", ".doc", ".docx"]);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

function sanitizeFileBaseName(fileName) {
  return fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .slice(0, 60);
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const safeBaseName = sanitizeFileBaseName(file.originalname || "file");
    const fileName = Date.now() + "-" + safeBaseName + extension;

    callback(null, fileName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname || "").toLowerCase();

    if (!allowedExtensions.has(extension)) {
      return callback(new Error("Only PDF, DOC, and DOCX files are allowed"));
    }

    return callback(null, true);
  },
});

export function uploadLeaveAttachment(req, res, next) {
  upload.single("attachment")(req, res, (error) => {
    if (!error) {
      return next();
    }

    return res.status(400).json({
      message: error.message || "File upload failed",
    });
  });
}
