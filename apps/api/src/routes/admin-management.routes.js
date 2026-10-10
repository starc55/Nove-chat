import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import {
  createAdvertisement,
  createProduct,
  deleteAdvertisement,
  deleteProduct,
  listAdvertisements,
  listProducts,
  updateAdvertisement,
  updateProduct,
} from "../services/admin-catalog.service.js";
import {
  createOperator,
  deleteOperator,
  listOperators,
  updateOperator,
} from "../services/operator.service.js";
import {
  deleteLead,
  deleteOrder,
  deleteReview,
  listLeads,
  listOrders,
  listReviews,
  updateLead,
  updateOrder,
  updateReview,
} from "../services/admin-operations.service.js";
import {
  createContentPage,
  deleteContentPage,
  listContentPages,
  updateContentPage,
} from "../services/content-page.service.js";
import { saveImages } from "../services/media.service.js";
import { ApiError } from "../utils/api-error.js";
import bcrypt from "bcryptjs";
import { prisma } from "../config/database.js";
import rateLimit from "express-rate-limit";

export const adminManagementRouter = Router();

const idSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_-]{8,80}$/);
const nullableText = (max) =>
  z
    .union([z.string().trim().max(max), z.null()])
    .optional()
    .transform((value) => value || null);
const mediaUrl = z.union([
  z
    .string()
    .trim()
    .url()
    .max(1000)
    .refine(
      (value) => /^https?:\/\//i.test(value),
      "HTTP yoki HTTPS manzil kiriting.",
    ),
  z
    .string()
    .trim()
    .max(1000)
    .regex(/^\/(?!\/)[^\s\\]*$/),
]);
const nullableUrl = z
  .union([mediaUrl, z.literal(""), z.null()])
  .optional()
  .transform((value) => value || null);
const MAX_PRODUCT_PRICE = 9_999_999_999_999.99;
const nullablePrice = z.preprocess(
  (value) => (value === "" || value == null ? null : value),
  z.coerce.number().nonnegative().max(MAX_PRODUCT_PRICE).nullable(),
);
const nullableDate = z
  .union([z.string().datetime(), z.literal(""), z.null()])
  .optional()
  .transform((value) => (value ? new Date(value) : null));
const linkValue = z
  .union([
    z
      .string()
      .trim()
      .url()
      .max(1000)
      .refine(
        (value) => /^(https?:\/\/|mailto:|tel:)/i.test(value),
        "Havola turi qo‘llab-quvvatlanmaydi.",
      ),
    z
      .string()
      .trim()
      .regex(/^(#|\/(?!\/))[^\s\\]*$/)
      .max(1000),
    z.literal(""),
    z.null(),
  ])
  .optional()
  .transform((value) => value || null);
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  q: z.string().trim().max(100).default(""),
});

const productBaseSchema = z
  .object({
    title: z.string().trim().min(2).max(120),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(140),
    shortDescription: z.string().trim().min(10).max(500),
    longDescription: nullableText(5000),
    price: nullablePrice,
    oldPrice: nullablePrice,
    stock: z.preprocess(
      (value) => (value === "" || value == null ? null : value),
      z.coerce.number().int().min(0).max(1_000_000).nullable(),
    ),
    image: nullableUrl,
    sourceUrl: nullableUrl,
    documents: z
      .array(
        z
          .object({
            label: z.string().trim().min(2).max(180),
            url: z.string().trim().url().max(1000),
          })
          .strict(),
      )
      .max(20)
      .nullable()
      .optional(),
    specifications: z.record(z.string(), z.unknown()).nullable().optional(),
    translations: z.record(z.string(), z.unknown()).nullable().optional(),
    gallery: z.array(mediaUrl).max(20).optional(),
    category: nullableText(80),
    brand: nullableText(120),
    material: nullableText(160),
    form: nullableText(160),
    productType: nullableText(160),
    tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
    showTags: z.boolean().default(true),
    purchasable: z.boolean().default(true),
    variants: z
      .array(
        z
          .object({
            id: idSchema.optional(),
            label: z.string().trim().min(1).max(120),
            size: nullableText(80),
            type: nullableText(120),
            sku: nullableText(80),
            translations: z
              .record(z.string(), z.unknown())
              .nullable()
              .optional(),
            price: nullablePrice,
            stock: z.coerce.number().int().min(0).max(1_000_000),
            active: z.boolean().default(true),
            sortOrder: z.coerce
              .number()
              .int()
              .min(-10000)
              .max(10000)
              .default(0),
          })
          .strict(),
      )
      .max(100)
      .default([]),
    active: z.boolean().default(true),
    featured: z.boolean().default(false),
    sortOrder: z.coerce.number().int().min(-10000).max(10000).default(0),
  })
  .strict();

const contentPageSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(140),
    title: z.string().trim().min(2).max(180),
    content: z.record(z.string(), z.unknown()),
    active: z.boolean().default(true),
    sortOrder: z.coerce.number().int().min(-10000).max(10000).default(0),
  })
  .strict();
const productSchema = productBaseSchema.superRefine((value, ctx) => {
  if (
    value.price !== null &&
    value.oldPrice !== null &&
    value.oldPrice < value.price
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["oldPrice"],
      message: "Eski narx yangi narxdan kichik bo‘lmasligi kerak.",
    });
  }
});

const placementValues = [
  "HERO",
  "AFTER_HERO",
  "PRODUCTS_TOP",
  "PRODUCTS_BOTTOM",
  "FLOATING",
  "FOOTER",
];
const advertisementDisplaySchema = z
  .object({
    imageFit: z.enum(["contain", "cover"]).default("contain"),
    imagePosition: z
      .enum(["center", "top", "bottom", "left", "right"])
      .default("center"),
    contentAlign: z.enum(["left", "center", "right"]).default("left"),
    heightDesktop: z.coerce.number().int().min(320).max(760).default(365),
    heightMobile: z.coerce.number().int().min(480).max(920).default(680),
    overlayOpacity: z.coerce.number().int().min(0).max(90).default(20),
  })
  .strict();
const advertisementSchema = z
  .object({
    title: z.string().trim().min(2).max(160),
    description: nullableText(1000),
    image: nullableUrl,
    ctaLabel: nullableText(80),
    ctaUrl: linkValue,
    translations: z.record(z.string(), z.unknown()).nullable().optional(),
    display: advertisementDisplaySchema.nullable().optional(),
    placement: z.enum(placementValues),
    startAt: nullableDate,
    endAt: nullableDate,
    enabled: z.boolean().default(true),
    sortOrder: z.coerce.number().int().min(-10000).max(10000).default(0),
  })
  .strict();

const operatorSchema = z
  .object({
    email: z.string().trim().email().max(200),
    password: z.string().min(12).max(128),
    displayName: z.string().trim().min(2).max(100),
    avatarUrl: nullableUrl,
    status: z.enum(["ONLINE", "AWAY", "OFFLINE"]).default("OFFLINE"),
    active: z.boolean().default(true),
    telegramUserId: z
      .union([
        z
          .string()
          .trim()
          .regex(/^\d{5,20}$/),
        z.literal(""),
        z.null(),
      ])
      .transform((value) => value || null),
    telegramUsername: nullableText(64),
    telegramEnabled: z.boolean().default(true),
  })
  .strict();

function route(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res);
    } catch (error) {
      next(error);
    }
  };
}

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 12, fileSize: 5 * 1024 * 1024 },
}).array("images", 12);

adminManagementRouter.post("/uploads/images", (req, res, next) => {
  imageUpload(req, res, async (error) => {
    if (error)
      return next(
        new ApiError(
          422,
          "UPLOAD_FAILED",
          error.code === "LIMIT_FILE_SIZE"
            ? "Har bir rasm 5 MB dan kichik bo‘lishi kerak."
            : "Rasm yuklanmadi.",
        ),
      );
    try {
      res
        .status(201)
        .json({ success: true, data: await saveImages(req.files, req) });
    } catch (saveError) {
      next(saveError);
    }
  });
});

adminManagementRouter.get(
  "/products",
  route(async (req, res) => {
    res.json({
      success: true,
      data: await listProducts(paginationSchema.parse(req.query)),
    });
  }),
);
adminManagementRouter.post(
  "/products",
  route(async (req, res) => {
    res
      .status(201)
      .json({
        success: true,
        data: await createProduct(productSchema.parse(req.body)),
      });
  }),
);
adminManagementRouter.patch(
  "/products/:id",
  route(async (req, res) => {
    const input = productBaseSchema.partial().strict().parse(req.body);
    res.json({
      success: true,
      data: await updateProduct(idSchema.parse(req.params.id), input),
    });
  }),
);
adminManagementRouter.delete(
  "/products/:id",
  route(async (req, res) => {
    await deleteProduct(idSchema.parse(req.params.id));
    res.status(204).end();
  }),
);

const adminAccountSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(200),
    password: z.string().min(12).max(128),
  })
  .strict();
const accountLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

adminManagementRouter.get(
  "/admins",
  route(async (_req, res) => {
    const admins = await prisma.admin.findMany({
      include: {
        user: {
          select: { id: true, email: true, active: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    res.json({
      success: true,
      data: admins.map((admin) => ({
        id: admin.id,
        name: admin.name,
        userId: admin.userId,
        email: admin.user.email,
        active: admin.user.active,
        createdAt: admin.createdAt,
      })),
    });
  }),
);

adminManagementRouter.post(
  "/admins",
  accountLimiter,
  route(async (req, res) => {
    const input = adminAccountSchema.parse(req.body);
    const email = input.email.toLowerCase();
    const exists = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (exists)
      throw new ApiError(
        409,
        "ADMIN_EMAIL_EXISTS",
        "Bu email bilan foydalanuvchi allaqachon mavjud.",
      );
    const passwordHash = await bcrypt.hash(input.password, 12);
    const admin = await prisma.admin.create({
      data: {
        name: input.name,
        user: { create: { email, passwordHash, role: "ADMIN", active: true } },
      },
      include: { user: { select: { id: true, email: true, active: true } } },
    });
    res
      .status(201)
      .json({
        success: true,
        data: {
          id: admin.id,
          name: admin.name,
          userId: admin.userId,
          email: admin.user.email,
          active: admin.user.active,
          createdAt: admin.createdAt,
        },
      });
  }),
);

adminManagementRouter.patch(
  "/admins/me/password",
  accountLimiter,
  route(async (req, res) => {
    const input = z
      .object({
        currentPassword: z.string().min(8).max(128),
        password: z.string().min(12).max(128),
        email: z.string().trim().email().max(254).optional(),
      })
      .strict()
      .parse(req.body);
    const user = await prisma.user.findUnique({
      where: { id: req.auth.sub },
      select: { id: true, passwordHash: true },
    });
    if (
      !user ||
      !(await bcrypt.compare(input.currentPassword, user.passwordHash))
    )
      throw new ApiError(
        422,
        "CURRENT_PASSWORD_INVALID",
        "Joriy parol noto‘g‘ri.",
      );
    const email = input.email?.toLowerCase();
    if (
      email &&
      (await prisma.user.findFirst({
        where: { email, id: { not: user.id } },
        select: { id: true },
      }))
    )
      throw new ApiError(
        409,
        "EMAIL_EXISTS",
        "Bu email boshqa hisobda ishlatilmoqda.",
      );
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: await bcrypt.hash(input.password, 12),
          ...(email ? { email } : {}),
        },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    res.json({ success: true, data: { changed: true } });
  }),
);

adminManagementRouter.get(
  "/advertisements",
  route(async (req, res) => {
    res.json({
      success: true,
      data: await listAdvertisements(paginationSchema.parse(req.query)),
    });
  }),
);
adminManagementRouter.post(
  "/advertisements",
  route(async (req, res) => {
    res
      .status(201)
      .json({
        success: true,
        data: await createAdvertisement(advertisementSchema.parse(req.body)),
      });
  }),
);
adminManagementRouter.patch(
  "/advertisements/:id",
  route(async (req, res) => {
    res.json({
      success: true,
      data: await updateAdvertisement(
        idSchema.parse(req.params.id),
        advertisementSchema.partial().strict().parse(req.body),
      ),
    });
  }),
);
adminManagementRouter.delete(
  "/advertisements/:id",
  route(async (req, res) => {
    await deleteAdvertisement(idSchema.parse(req.params.id));
    res.status(204).end();
  }),
);

adminManagementRouter.get(
  "/content-pages",
  route(async (req, res) => {
    res.json({
      success: true,
      data: await listContentPages(paginationSchema.parse(req.query)),
    });
  }),
);
adminManagementRouter.post(
  "/content-pages",
  route(async (req, res) => {
    res
      .status(201)
      .json({
        success: true,
        data: await createContentPage(contentPageSchema.parse(req.body)),
      });
  }),
);
adminManagementRouter.patch(
  "/content-pages/:id",
  route(async (req, res) => {
    res.json({
      success: true,
      data: await updateContentPage(
        idSchema.parse(req.params.id),
        contentPageSchema.partial().strict().parse(req.body),
      ),
    });
  }),
);
adminManagementRouter.delete(
  "/content-pages/:id",
  route(async (req, res) => {
    await deleteContentPage(idSchema.parse(req.params.id));
    res.status(204).end();
  }),
);

adminManagementRouter.get(
  "/operators",
  route(async (_req, res) => {
    res.json({ success: true, data: await listOperators() });
  }),
);
adminManagementRouter.post(
  "/operators",
  route(async (req, res) => {
    res
      .status(201)
      .json({
        success: true,
        data: await createOperator(operatorSchema.parse(req.body)),
      });
  }),
);
adminManagementRouter.patch(
  "/operators/:id",
  route(async (req, res) => {
    const schema = operatorSchema
      .partial()
      .extend({
        password: z
          .union([z.string().min(12).max(128), z.literal("")])
          .optional(),
      })
      .strict();
    const input = schema.parse(req.body);
    if (!input.password) delete input.password;
    res.json({
      success: true,
      data: await updateOperator(idSchema.parse(req.params.id), input),
    });
  }),
);
adminManagementRouter.delete(
  "/operators/:id",
  route(async (req, res) => {
    await deleteOperator(idSchema.parse(req.params.id));
    res.status(204).end();
  }),
);

adminManagementRouter.get(
  "/leads",
  route(async (req, res) => {
    res.json({
      success: true,
      data: await listLeads(paginationSchema.parse(req.query)),
    });
  }),
);
adminManagementRouter.patch(
  "/leads/:id",
  route(async (req, res) => {
    const { status } = z
      .object({ status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "CLOSED"]) })
      .parse(req.body);
    res.json({
      success: true,
      data: await updateLead(idSchema.parse(req.params.id), status),
    });
  }),
);
adminManagementRouter.delete(
  "/leads/:id",
  route(async (req, res) => {
    await deleteLead(idSchema.parse(req.params.id));
    res.status(204).end();
  }),
);

adminManagementRouter.get(
  "/orders",
  route(async (req, res) => {
    res.json({
      success: true,
      data: await listOrders(paginationSchema.parse(req.query)),
    });
  }),
);
adminManagementRouter.patch(
  "/orders/:id",
  route(async (req, res) => {
    const { status } = z
      .object({
        status: z.enum([
          "NEW",
          "PROCESSING",
          "CONFIRMED",
          "COMPLETED",
          "CANCELLED",
        ]),
      })
      .parse(req.body);
    res.json({
      success: true,
      data: await updateOrder(idSchema.parse(req.params.id), status),
    });
  }),
);
adminManagementRouter.delete(
  "/orders/:id",
  route(async (req, res) => {
    await deleteOrder(idSchema.parse(req.params.id));
    res.status(204).end();
  }),
);

adminManagementRouter.get(
  "/reviews",
  route(async (req, res) => {
    res.json({
      success: true,
      data: await listReviews(paginationSchema.parse(req.query)),
    });
  }),
);
adminManagementRouter.patch(
  "/reviews/:id",
  route(async (req, res) => {
    const { status } = z
      .object({ status: z.enum(["PENDING", "APPROVED", "REJECTED"]) })
      .parse(req.body);
    res.json({
      success: true,
      data: await updateReview(idSchema.parse(req.params.id), status),
    });
  }),
);
adminManagementRouter.delete(
  "/reviews/:id",
  route(async (req, res) => {
    await deleteReview(idSchema.parse(req.params.id));
    res.status(204).end();
  }),
);
