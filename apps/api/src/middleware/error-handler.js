import { ZodError } from "zod";

export function notFound(req, res) {
  res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Endpoint topilmadi." } });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof ZodError) {
    return res.status(422).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Ma’lumotlarni tekshiring.", details: error.flatten() } });
  }
  if (error?.code === "P2002") {
    return res.status(409).json({ success: false, error: { code: "DUPLICATE_VALUE", message: "Bu qiymat avval ro‘yxatdan o‘tgan." } });
  }
  if (error?.code === "P2025") {
    return res.status(404).json({ success: false, error: { code: "RECORD_NOT_FOUND", message: "Yozuv topilmadi." } });
  }
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  return res.status(status).json({ success: false, error: { code: error.code || "INTERNAL_ERROR", message: status >= 500 ? "Kutilmagan xatolik yuz berdi." : error.message } });
}
