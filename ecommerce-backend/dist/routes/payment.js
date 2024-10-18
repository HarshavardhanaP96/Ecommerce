import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { applyDiscount, createPaymentIntent, deleteCoupon, getAllCoupon, newCoupon, } from "../controllers/payment.js";
const app = express();
//route-/api/v1/payment/create
app.post("/create", createPaymentIntent);
//route-/api/v1/payment/discount
app.get("/discount", applyDiscount);
app.get("/coupon/all", adminOnly, getAllCoupon);
//route-/api/v1/payment/coupon/new
app.post("/coupon/new", adminOnly, newCoupon);
app.delete("/coupon/:id", adminOnly, deleteCoupon);
export default app;
