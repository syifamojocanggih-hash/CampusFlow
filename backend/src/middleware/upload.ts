import multer from "multer";
import { AppError } from "../lib/response.ts";

const storage = multer.memoryStorage();

export const uploadKrs = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Maksimal 10 MB
  },
  fileFilter: (_req, file, cb) => {
    const original = file.originalname.toLowerCase();
    const isPdf =
      file.mimetype === "application/pdf" ||
      original.endsWith(".pdf");
    const isText =
      file.mimetype.startsWith("text/") ||
      original.endsWith(".txt") ||
      original.endsWith(".csv");
    const isOctetStream = file.mimetype === "application/octet-stream";

    if (isPdf || isText || isOctetStream) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          400,
          "VALIDATION_ERROR",
          "Format file tidak didukung. Unggah dokumen PDF (.pdf) atau file teks (.txt, .csv)."
        )
      );
    }
  },
});
