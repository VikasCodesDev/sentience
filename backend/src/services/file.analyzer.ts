import fs from "fs";
import path from "path";

export async function analyzeFile(filePath: string, mimeType: string, originalName: string): Promise<string> {
  try {
    // PDF
    if (mimeType === "application/pdf") {
      const pdfParse = require("pdf-parse");
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      return data.text || "No readable text found in PDF.";
    }

    // DOCX
    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || originalName.endsWith(".docx")) {
      const mammoth = require("mammoth");
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || "No text in DOCX.";
    }

    // Text/code files
    const textExts = [".txt",".md",".js",".ts",".tsx",".jsx",".py",".java",".cpp",".c",".cs",".go",".rs",".php",".rb",".sh",".yaml",".yml",".json",".xml",".csv",".toml",".env",".html",".css",".sql"];
    const ext = path.extname(originalName).toLowerCase();
    if (mimeType.startsWith("text/") || textExts.includes(ext)) {
      return fs.readFileSync(filePath, "utf-8").slice(0, 50000);
    }

    // Images
    if (mimeType.startsWith("image/")) {
      const stats = fs.statSync(filePath);
      return `[IMAGE FILE]\nName: ${originalName}\nSize: ${(stats.size/1024).toFixed(1)} KB\n\nThis is an image file. Please describe what you need analyzed.`;
    }

    return `[Binary File: ${originalName}]\nType: ${mimeType}\nSize: ${(fs.statSync(filePath).size/1024).toFixed(1)} KB`;
  } catch (err: any) {
    return `Failed to analyze ${originalName}: ${err?.message}`;
  }
}
