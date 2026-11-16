"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const node_http_1 = __importDefault(require("node:http"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const socket_io_1 = require("socket.io");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
const server = node_http_1.default.createServer(app);
const PORT = Number(process.env.PORT ?? 4000);
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-jwt-secret-change-in-prod";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret-change-in-prod";
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN ?? "http://localhost:3000,https://shell-frontend-steel.vercel.app")
    .split(",")
    .map((s) => s.trim());
const io = new socket_io_1.Server(server, {
    cors: { origin: ALLOWED_ORIGINS, credentials: true },
});
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: "1mb" }));
const authLimiter = (0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, max: 30 });
const apiLimiter = (0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, max: 300 });
app.use("/api", apiLimiter);
function hashOtp(otp) {
    return node_crypto_1.default.createHash("sha256").update(otp).digest("hex");
}
function authenticate(req, res, next) {
    const token = req.cookies?.access_token || req.headers.authorization?.replace("Bearer ", "");
    if (!token)
        return res.status(401).json({ error: "Authentication required" });
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    }
    catch {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}
function requireRole(...roles) {
    return (req, res, next) => {
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
        const { phone } = zod_1.z.object({ phone: zod_1.z.string().min(10).max(15) }).parse(req.body);
        const otp = process.env.NODE_ENV === "production" ? String(Math.floor(100000 + Math.random() * 900000)) : "123456";
        const otpHash = hashOtp(otp);
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await prisma.user.upsert({
            where: { phone },
            update: { otpHash, otpExpiresAt },
            create: { phone, otpHash, otpExpiresAt, role: client_1.Role.CUSTOMER },
        });
        console.log(`[DEV OTP] Phone: ${phone} | OTP: ${otp}`);
        res.json({ ok: true, message: "OTP sent" });
    }
    catch (err) {
        next(err);
    }
});
app.post("/auth/verify-otp", authLimiter, async (req, res, next) => {
    try {
        const { phone, otp } = zod_1.z.object({ phone: zod_1.z.string(), otp: zod_1.z.string().length(6) }).parse(req.body);
        const user = await prisma.user.findUnique({ where: { phone } });
        if (!user || !user.otpHash || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
            return res.status(400).json({ error: "OTP expired or invalid" });
        }
        if (user.otpHash !== hashOtp(otp)) {
            return res.status(400).json({ error: "Incorrect OTP" });
        }
        await prisma.user.update({ where: { id: user.id }, data: { otpHash: null, otpExpiresAt: null } });
        const accessToken = jsonwebtoken_1.default.sign({ id: user.id, role: user.role, phone: user.phone }, JWT_SECRET, { expiresIn: "15m" });
        const refreshToken = jsonwebtoken_1.default.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
        res.cookie("access_token", accessToken, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
        res.cookie("refresh_token", refreshToken, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
        res.json({ user: { id: user.id, phone: user.phone, name: user.name, role: user.role } });
    }
    catch (err) {
        next(err);
    }
});
app.get("/me", authenticate, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, phone: true, name: true, role: true, addresses: true },
        });
        res.json({ user });
    }
    catch (err) {
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
    }
    catch (err) {
        next(err);
    }
});
app.get("/groceries", async (_req, res, next) => {
    try {
        const groceries = await prisma.groceryItem.findMany({ where: { inStock: true } });
        res.json({ groceries });
    }
    catch (err) {
        next(err);
    }
});
app.get("/packs", async (_req, res, next) => {
    try {
        const packs = await prisma.pack.findMany();
        res.json({ packs });
    }
    catch (err) {
        next(err);
    }
});
app.post("/coupons/validate", async (req, res, next) => {
    try {
        const { code, subtotal } = zod_1.z.object({ code: zod_1.z.string(), subtotal: zod_1.z.number().nonnegative() }).parse(req.body);
        const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase(), active: true } });
        if (!coupon)
            return res.status(404).json({ error: "Invalid coupon code" });
        const discount = coupon.discountType === "PERCENT"
            ? Math.round((subtotal * coupon.discountValue) / 100)
            : Math.min(coupon.discountValue, subtotal);
        res.json({ valid: true, code: coupon.code, discount });
    }
    catch (err) {
        next(err);
    }
});
app.get("/service-area/check", async (req, res, next) => {
    try {
        const lat = Number(req.query.lat);
        const lng = Number(req.query.lng);
        if (Number.isNaN(lat) || Number.isNaN(lng))
            return res.status(400).json({ error: "Valid lat and lng required" });
        const area = await prisma.serviceArea.findFirst({
            where: { active: true, minLat: { lte: lat }, maxLat: { gte: lat }, minLng: { lte: lng }, maxLng: { gte: lng } },
        });
        res.json({ available: Boolean(area), area });
    }
    catch (err) {
        next(err);
    }
});
// ========================
// 3. PLAN REQUESTS (Tell Shell)
// ========================
app.post("/plan-requests", async (req, res, next) => {
    try {
        const { rawText } = zod_1.z.object({ rawText: zod_1.z.string().min(5) }).parse(req.body);
        const planRequest = await prisma.planRequest.create({
            data: { rawText, userId: req.user?.id ?? null, status: "PENDING_REVIEW" },
        });
        res.status(201).json({ planRequest });
    }
    catch (err) {
        next(err);
    }
});
// ========================
// 4. ORDERS & PAYMENTS
// ========================
app.post("/orders", authenticate, async (req, res, next) => {
    try {
        const body = zod_1.z
            .object({
            slot: zod_1.z.string(),
            couponCode: zod_1.z.string().optional(),
            items: zod_1.z.array(zod_1.z.object({ itemType: zod_1.z.string(), itemId: zod_1.z.string(), name: zod_1.z.string(), price: zod_1.z.number().int().positive(), qty: zod_1.z.number().int().positive() })).min(1),
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
                userId: req.user.id,
                slot: body.slot,
                doorOtp,
                subtotal,
                discount,
                platformFee,
                total,
                couponCode: body.couponCode?.toUpperCase(),
                status: client_1.OrderStatus.PENDING_REVIEW,
                items: { create: body.items },
                history: { create: { status: client_1.OrderStatus.PENDING_REVIEW, note: "Order placed" } },
            },
            include: { items: true },
        });
        res.status(201).json({ order });
    }
    catch (err) {
        next(err);
    }
});
app.post("/orders/:id/verify-otp", authenticate, requireRole(client_1.Role.HELPER, client_1.Role.OPS, client_1.Role.ADMIN), async (req, res, next) => {
    try {
        const { otp } = zod_1.z.object({ otp: zod_1.z.string().length(4) }).parse(req.body);
        const order = await prisma.order.findUnique({ where: { id: String(req.params.id) } });
        if (!order || order.doorOtp !== otp)
            return res.status(400).json({ error: "Invalid Door OTP" });
        const updated = await prisma.order.update({
            where: { id: order.id },
            data: { status: client_1.OrderStatus.OTP_VERIFIED, history: { create: { status: client_1.OrderStatus.OTP_VERIFIED, note: "Door OTP verified" } } },
        });
        io.to(`order:${order.id}`).emit("order:status", { orderId: order.id, status: updated.status });
        res.json({ order: updated });
    }
    catch (err) {
        next(err);
    }
});
// ========================
// 5. SUPPORT & DPDP
// ========================
app.post("/support", async (req, res, next) => {
    try {
        const { subject, message } = zod_1.z.object({ subject: zod_1.z.string().min(3), message: zod_1.z.string().min(5) }).parse(req.body);
        const ticket = await prisma.supportTicket.create({ data: { subject, message, userId: req.user?.id ?? null } });
        res.status(201).json({ ticket });
    }
    catch (err) {
        next(err);
    }
});
app.delete("/me/data", authenticate, async (req, res, next) => {
    try {
        await prisma.user.delete({ where: { id: req.user.id } });
        res.json({ deleted: true });
    }
    catch (err) {
        next(err);
    }
});
// Error Middleware
app.use((err, _req, res, _next) => {
    if (err instanceof zod_1.z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: err.errors });
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
});
// Socket.IO Realtime Tracking
io.on("connection", (socket) => {
    socket.on("join:order", (orderId) => {
        socket.join(`order:${orderId}`);
    });
    socket.on("helper:location", (data) => {
        io.to(`order:${data.orderId}`).emit("order:location", data);
    });
});
server.listen(PORT, () => {
    console.log(`Shell backend listening on port ${PORT}`);
});
