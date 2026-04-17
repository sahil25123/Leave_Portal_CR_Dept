import fs from "fs";
import path from "path";
import multer from "multer";

const uploadDirectory = path.join(process.cwd(), "uploads");
const MAX_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024;
const allowedMimeTypesByExtension = new Map([
  [".pdf", new Set(["application/pdf"])],
  [
    ".doc",
    new Set([
      "application/msword",
      "application/vnd.ms-word",
      "application/vnd.msword",
    ]),
  ],
  [
    ".docx",
    new Set([
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]),
  ],
]);

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
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileName = uniqueSuffix + "-" + safeBaseName + extension;

    callback(null, fileName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_SIZE_BYTES,
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const normalizedMimeType = String(file.mimetype || "").toLowerCase();
    const allowedMimeTypes = allowedMimeTypesByExtension.get(extension);

    if (!allowedMimeTypes) {
      return callback(new Error("Only PDF, DOC, and DOCX files are allowed"));
    }

    if (!allowedMimeTypes.has(normalizedMimeType)) {
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

    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File size must be 2MB or less",
      });
    }

    return res.status(400).json({
      message: error.message || "File upload failed",
    });
  });
}
