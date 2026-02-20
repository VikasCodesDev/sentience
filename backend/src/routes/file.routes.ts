import { Router } from "express";
import multer from "multer";
import path from "path";
import { analyzeFile } from "../services/file.analyzer";
import { addFileContent, loadFiles, clearFiles, FileRecord } from "../utils/file.memory";
import { trackFile } from "../utils/analytics";

const router = Router();

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, path.join(process.cwd(), "uploads")),
  filename: (_, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_, file, cb) => {
    // Allow all reasonable file types
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain", "text/html", "text/css", "text/csv",
      "application/json", "application/javascript",
      "image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif",
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = [
      ".pdf", ".docx", ".doc", ".txt", ".md", ".js", ".ts", ".tsx", ".jsx",
      ".py", ".java", ".cpp", ".c", ".cs", ".go", ".rs", ".php", ".rb",
      ".sh", ".yaml", ".yml", ".json", ".xml", ".csv", ".toml", ".env",
      ".html", ".css", ".png", ".jpg", ".jpeg", ".webp", ".gif",
    ];
    if (allowed.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(null, true); // Accept anyway, handle gracefully
    }
  },
});

/* UPLOAD & ANALYZE */
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("📂 File received:", req.file.originalname, req.file.mimetype);

    const text = await analyzeFile(
      req.file.path,
      req.file.mimetype,
      req.file.originalname
    );

    const record: FileRecord = {
      name: req.file.originalname,
      type: req.file.mimetype,
      content: text,
      uploadedAt: new Date().toISOString(),
      size: req.file.size,
    };

    addFileContent(record);
    trackFile();

    console.log("✅ File analyzed:", req.file.originalname, "chars:", text.length);

    res.json({
      success: true,
      message: "File analyzed and stored in memory.",
      preview: text.slice(0, 500),
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      contentLength: text.length,
      fileContext: text.slice(0, 8000), // Return full context for inline use
    });
  } catch (err: any) {
    console.error("File upload error:", err);
    res.status(500).json({ error: "File processing failed: " + err?.message });
  }
});

/* LIST FILES IN MEMORY */
router.get("/list", (_, res) => {
  const files = loadFiles();
  res.json({
    files: files.map((f) => ({
      name: f.name,
      type: f.type,
      uploadedAt: f.uploadedAt,
      size: f.size,
      preview: f.content.slice(0, 100),
    })),
  });
});

/* CLEAR FILE MEMORY */
router.delete("/clear", (_, res) => {
  clearFiles();
  res.json({ success: true, message: "File memory cleared." });
});

export default router;
