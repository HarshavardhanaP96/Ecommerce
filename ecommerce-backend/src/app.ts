import express, { NextFunction, Request, Response } from "express";
import { connectDB } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/error.js";
import NodeCache from "node-cache";
import { config } from "dotenv";
import morgan from "morgan";
import Stripe from "stripe";

import userRoute from "./routes/user.js";
import productRoute from "./routes/products.js";
import orderRoute from "./routes/order.js";
import paymentRoute from "./routes/payment.js";
import dashboardRoute from "./routes/stats.js";

config({ path: "./.env" });

const app = express();
const port = process.env.PORT || 3000;

const mongoURI = process.env.MONGO_URI || "";
const striprKey = process.env.STRIPE_KEY || "";

connectDB(mongoURI);

export const stripe = new Stripe(striprKey);

export const myCache = new NodeCache();

app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("API working with /api/v1");
});

//using routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/dashboard", dashboardRoute);

app.use("/uploads", express.static("uploads")); //to access the pics uploaded
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`express is running on http://localhost:${port}`);
});
