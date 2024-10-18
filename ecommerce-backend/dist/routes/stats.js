import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { getBarCharts, getDashboardStats, getLineCharts, getPieCharts, } from "../controllers/stats.js";
const app = express();
//route-/api/v1/dashboard/stats
app.get("/stats", adminOnly, getDashboardStats);
app.get("/bar", getBarCharts);
app.get("/pie", adminOnly, getPieCharts);
app.get("/line", adminOnly, getLineCharts);
export default app;
