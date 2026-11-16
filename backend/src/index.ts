import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import http from "node:http";
import crypto from "node:crypto";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { Server as SocketIOServer } from "socket.io";
import { PrismaClient, Role, OrderStatus } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);

const PORT = Number(process.env.PORT ?? 4000);
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-jwt-secret-change-in-prod";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret-change-in-prod";
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN ?? "http://localhost:3000,https://shell-frontend-steel.vercel.app")
  .split(",")
  .map((s) => s.trim());

const io = new SocketIOServer(server, {
  cors: { origin: ALLOWED_ORIGINS, credentials: true },
});

app.use(helmet());
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use("/api", apiLimiter);

interface AuthReq extends Request {
  user?: { id: string; role: Role; phone: string };
}

function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function authenticate(req: AuthReq, res: Response, next: NextFunction) {
  const token = req.cookies?.access_token || req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; role: Role; phone: string };
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireRole(...roles: Role[]) {
  return (req: AuthReq, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

// Health
app.get("/health", (_req, res) => res.json({ status: "ok", service: "shell-backend" }));

// ========================
// 1. AUTH (Phone OTP + JWT)
// ========================
app.post("/auth/send-otp", authLimiter, async (req, res, next) => {
  try {
    const { phone } = z.object({ phone: z.string().min(10).max(15) }).parse(req.body);
    const otp = process.env.NODE_ENV === "production" ? String(Math.floor(100000 + Math.random() * 900000)) : "123456";
    const otpHash = hashOtp(otp);
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.user.upsert({
      where: { phone },
      update: { otpHash, otpExpiresAt },
      create: { phone, otpHash, otpExpiresAt, role: Role.CUSTOMER },
    });

    console.log(`[DEV OTP] Phone: ${phone} | OTP: ${otp}`);
    res.json({ ok: true, message: "OTP sent" });
  } catch (err) {
    next(err);
  }
});

app.post("/auth/verify-otp", authLimiter, async (req, res, next) => {
  try {
    const { phone, otp } = z.object({ phone: z.string(), otp: z.string().length(6) }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user || !user.otpHash || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ error: "OTP expired or invalid" });
    }
    if (user.otpHash !== hashOtp(otp)) {
      return res.status(400).json({ error: "Incorrect OTP" });
    }

    await prisma.user.update({ where: { id: user.id }, data: { otpHash: null, otpExpiresAt: null } });

    const accessToken = jwt.sign({ id: user.id, role: user.role, phone: user.phone }, JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: "7d" });

    res.cookie("access_token", accessToken, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
    res.cookie("refresh_token", refreshToken, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
    res.json({ user: { id: user.id, phone: user.phone, name: user.name, role: user.role } });
  } catch (err) {
    next(err);
  }
});

app.get("/me", authenticate, async (req: AuthReq, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, phone: true, name: true, role: true, addresses: true },
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// ========================
// 2. CATALOG APIs
// ========================
app.get("/services", async (req, res, next) => {
  try {
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const services = await prisma.service.findMany({
      where: { active: true, ...(category && category !== "all" ? { category } : {}) },
      orderBy: { name: "asc" },
    });
    res.json({ services });
  } catch (err) {
    next(err);
  }
});

app.get("/groceries", async (_req, res, next) => {
  try {
    const groceries = await prisma.groceryItem.findMany({ where: { inStock: true } });
    res.json({ groceries });
  } catch (err) {
    next(err);
  }
});

app.get("/packs", async (_req, res, next) => {
  try {
    const packs = await prisma.pack.findMany();
    res.json({ packs });
  } catch (err) {
    next(err);
  }
});

app.post("/coupons/validate", async (req, res, next) => {
  try {
    const { code, subtotal } = z.object({ code: z.string(), subtotal: z.number().nonnegative() }).parse(req.body);
    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase(), active: true } });
    if (!coupon) return res.status(404).json({ error: "Invalid coupon code" });

    const discount =
      coupon.discountType === "PERCENT"
        ? Math.round((subtotal * coupon.discountValue) / 100)
        : Math.min(coupon.discountValue, subtotal);

    res.json({ valid: true, code: coupon.code, discount });
  } catch (err) {
    next(err);
  }
});

app.get("/service-area/check", async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return res.status(400).json({ error: "Valid lat and lng required" });

    const area = await prisma.serviceArea.findFirst({
      where: { active: true, minLat: { lte: lat }, maxLat: { gte: lat }, minLng: { lte: lng }, maxLng: { gte: lng } },
    });
    res.json({ available: Boolean(area), area });
  } catch (err) {
    next(err);
  }
});

// ========================
// 3. PLAN REQUESTS (Tell Shell)
// ========================
app.post("/plan-requests", async (req: AuthReq, res, next) => {
  try {
    const { rawText } = z.object({ rawText: z.string().min(5) }).parse(req.body);
    const planRequest = await prisma.planRequest.create({
      data: { rawText, userId: req.user?.id ?? null, status: "PENDING_REVIEW" },
    });
    res.status(201).json({ planRequest });
  } catch (err) {
    next(err);
  }
});

// ========================
// 4. ORDERS & PAYMENTS
// ========================
app.post("/orders", authenticate, async (req: AuthReq, res, next) => {
  try {
    const body = z
      .object({
        slot: z.string(),
        couponCode: z.string().optional(),
        items: z.array(z.object({ itemType: z.string(), itemId: z.string(), name: z.string(), price: z.number().int().positive(), qty: z.number().int().positive() })).min(1),
      })
      .parse(req.body);

    const subtotal = body.items.reduce((s, i) => s + i.price * i.qty, 0);
    const platformFee = Math.max(19, Math.round(subtotal * 0.04));
    let discount = 0;
    if (body.couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: body.couponCode.toUpperCase(), active: true } });
      if (coupon) {
        discount = coupon.discountType === "PERCENT" ? Math.round((subtotal * coupon.discountValue) / 100) : Math.min(coupon.discountValue, subtotal);
      }
    }
    const total = Math.max(0, subtotal - discount + platformFee);
    const doorOtp = String(Math.floor(1000 + Math.random() * 9000));

    const order = await prisma.order.create({
      data: {
        userId: req.user!.id,
        slot: body.slot,
        doorOtp,
        subtotal,
        discount,
        platformFee,
        total,
        couponCode: body.couponCode?.toUpperCase(),
        status: OrderStatus.PENDING_REVIEW,
        items: { create: body.items },
        history: { create: { status: OrderStatus.PENDING_REVIEW, note: "Order placed" } },
      },
      include: { items: true },
    });

    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
});

app.post("/orders/:id/verify-otp", authenticate, requireRole(Role.HELPER, Role.OPS, Role.ADMIN), async (req: AuthReq, res, next) => {
  try {
    const { otp } = z.object({ otp: z.string().length(4) }).parse(req.body);
    const order = await prisma.order.findUnique({ where: { id: String(req.params.id) } });
    if (!order || order.doorOtp !== otp) return res.status(400).json({ error: "Invalid Door OTP" });

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.OTP_VERIFIED, history: { create: { status: OrderStatus.OTP_VERIFIED, note: "Door OTP verified" } } },
    });
    io.to(`order:${order.id}`).emit("order:status", { orderId: order.id, status: updated.status });
    res.json({ order: updated });
  } catch (err) {
    next(err);
  }
});

// ========================
// 5. SUPPORT & DPDP
// ========================
app.post("/support", async (req: AuthReq, res, next) => {
  try {
    const { subject, message } = z.object({ subject: z.string().min(3), message: z.string().min(5) }).parse(req.body);
    const ticket = await prisma.supportTicket.create({ data: { subject, message, userId: req.user?.id ?? null } });
    res.status(201).json({ ticket });
  } catch (err) {
    next(err);
  }
});

app.delete("/me/data", authenticate, async (req: AuthReq, res, next) => {
  try {
    await prisma.user.delete({ where: { id: req.user!.id } });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// Error Middleware
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof z.ZodError) {
    return res.status(400).json({ error: "Validation error", details: err.errors });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// Socket.IO Realtime Tracking
io.on("connection", (socket) => {
  socket.on("join:order", (orderId: string) => {
    socket.join(`order:${orderId}`);
  });
  socket.on("helper:location", (data: { orderId: string; lat: number; lng: number }) => {
    io.to(`order:${data.orderId}`).emit("order:location", data);
  });
});

server.listen(PORT, () => {
  console.log(`Shell backend listening on port ${PORT}`);
});
