import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File as FormidableFile } from "formidable";
import fs from "fs";

export const config = {
  api: { bodyParser: false },
};

type ParsedUpload = {
  baseline: FormidableFile;
  compares: FormidableFile[];
};

function asSingle(file: FormidableFile | FormidableFile[] | undefined) {
  if (!file) return undefined;
  return Array.isArray(file) ? file[0] : file;
}

function asArray(file: FormidableFile | FormidableFile[] | undefined) {
  if (!file) return [];
  return Array.isArray(file) ? file : [file];
}

async function parseForm(req: NextApiRequest): Promise<ParsedUpload> {
  const form = formidable({
    multiples: true,
    keepExtensions: true,
    // Adjust if you expect big PDFs
    maxFileSize: 50 * 1024 * 1024, // 50MB
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, _fields, files) => {
      if (err) return reject(err);

      // ✅ EXPECTED CLIENT KEYS:
      // baselineFile: single
      // compareFiles: multi (1..2)
      const baseline = asSingle(files.baselineFile as any);
      const compares = asArray(files.compareFiles as any);

      if (!baseline?.filepath) {
        return reject(new Error("Missing baselineFile upload"));
      }
      if (!compares.length || !compares[0]?.filepath) {
        return reject(new Error("Missing compareFiles upload"));
      }

      resolve({ baseline, compares });
    });
  });
}

function fileToWebFile(f: FormidableFile) {
  // Formidable writes uploads to disk; we read into a Buffer
  const buf = fs.readFileSync(f.filepath);
  const name = f.originalFilename || "upload";
  const type = f.mimetype || "application/octet-stream";

  // In Next API routes (Node 18+), File/Blob/FormData are provided by undici
  return new File([buf], name, { type });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { baseline, compares } = await parseForm(req);

    // ✅ Point this at your backend
    // Example: http://localhost:5000
    const backendBase = process.env.BACKEND_URL || "http://localhost:5000";
    const backendUrl = `${backendBase}/api/ai/compareDocuments`;

    const fd = new FormData();

    // 🔁 IMPORTANT: field names MUST match your backend multer/controller keys.
    // If backend expects originalFile/updatedFile instead, swap these:
    // fd.append("originalFile", fileToWebFile(baseline));
    // fd.append("updatedFile", fileToWebFile(compares[0]));
    fd.append("baselineFile", fileToWebFile(baseline));
    for (const c of compares.slice(0, 2)) fd.append("compareFiles", fileToWebFile(c));

    const upstream = await fetch(backendUrl, {
      method: "POST",
      body: fd,
      // DO NOT set Content-Type manually; fetch will set the multipart boundary.
    });

    const text = await upstream.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return res.status(upstream.status).json(data);
  } catch (err: any) {
    console.error("compareDocuments proxy error:", err);
    return res.status(400).json({
      error: err?.message || "Failed to compare documents",
    });
  }
}
