import { env } from "../config/env.js";
import { prisma } from "../config/database.js";
import { ApiError } from "../utils/api-error.js";

const signatures = {
  "image/jpeg": (buffer) => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  "image/png": (buffer) => buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "image/webp": (buffer) => buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP"
};

function publicOrigin(req) {
  if (env.PUBLIC_API_URL) return env.PUBLIC_API_URL.replace(/\/$/, "");
  return `${req.protocol}://${req.get("host")}`;
}

export async function saveImages(files, req) {
  if (!files?.length) throw new ApiError(422, "IMAGE_REQUIRED", "Kamida bitta rasm tanlang.");
  for (const file of files) {
    if (!signatures[file.mimetype]?.(file.buffer)) {
      throw new ApiError(422, "INVALID_IMAGE", "Faqat haqiqiy JPG, PNG yoki WEBP rasm yuklash mumkin.");
    }
  }
  const assets = await prisma.$transaction(files.map((file) => prisma.mediaAsset.create({
    data: { fileName: file.originalname.slice(0, 240), mimeType: file.mimetype, size: file.size, data: file.buffer },
    select: { id: true, fileName: true, mimeType: true, size: true }
  })));
  const origin = publicOrigin(req);
  return assets.map((asset) => ({ ...asset, url: `${origin}/api/v1/public/media/${asset.id}` }));
}

export async function getMedia(id) {
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset) throw new ApiError(404, "MEDIA_NOT_FOUND", "Rasm topilmadi.");
  return asset;
}
