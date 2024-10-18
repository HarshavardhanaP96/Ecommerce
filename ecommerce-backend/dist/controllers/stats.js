import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";
import { calculatePercentage, getChartData, getInventories, } from "../utils/features.js";
export const getDashboardStats = TryCatch(async (req, res, next) => {
    let stats;
    const key = "admin-stats";
    if (myCache.has(key))
        stats = JSON.parse(myCache.get(key));
    else {
        const today = new Date();
        //For another 6 month revenue data
        const sixMonthAgo = new Date();
        sixMonthAgo.setDate(sixMonthAgo.getMonth() - 6);
        const thisMonth = {
            start: new Date(today.getFullYear(), today.getMonth(), 1),
            end: today,
        };
        const lastMonth = {
            start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
            end: new Date(today.getFullYear(), today.getMonth(), 0),
        };
        const thisMonthProductsPromise = Product.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end,
            },
        });
        const lastMonthProductsPromise = Product.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end,
            },
        });
        const thisMonthUsersPromise = User.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end,
            },
        });
        const lastMonthUsersPromise = User.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end,
            },
        });
        const thisMonthOrdersPromise = Order.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end,
            },
        });
        const lastMonthOrdersPromise = Order.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end,
            },
        });
        const lastSixMonthOrdersPromise = Order.find({
            createdAt: {
                $gte: sixMonthAgo,
                $lte: today,
            },
        });
        //latest transaction table
        const latestTransactionPromise = Order.find({})
            .select(["orderItems", "discount", "total", "status"])
            .limit(4);
        //latest transaction table end
        const [thisMonthProducts, lastMonthProducts, thisMonthUsers, lastMonthUsers, thisMonthOrders, lastMonthOrders, productsCount, usersCount, allOrders, lastSixMonthOrders, //sixmonth chart
        categories, //category percent calculation
        femaleUsersCount, latestTransaction,] = await Promise.all([
            thisMonthProductsPromise,
            lastMonthProductsPromise,
            thisMonthUsersPromise,
            lastMonthUsersPromise,
            thisMonthOrdersPromise,
            lastMonthOrdersPromise,
            Product.countDocuments(),
            User.countDocuments(),
            Order.find({}).select("total"), //      Order.countDocuments(),
            lastSixMonthOrdersPromise,
            Product.distinct("category"),
            User.countDocuments({ gender: "female" }),
            latestTransactionPromise,
        ]);
        const thisMonthRevenue = thisMonthOrders.reduce((total, order) => total + (order.total || 0), 0);
        const lastMonthRevenue = lastMonthOrders.reduce((total, order) => total + (order.total || 0), 0);
        const changePercent = {
            revenue: calculatePercentage(thisMonthRevenue, lastMonthRevenue),
            user: calculatePercentage(thisMonthUsers.length, lastMonthUsers.length),
            product: calculatePercentage(thisMonthProducts.length, lastMonthProducts.length),
            order: calculatePercentage(thisMonthOrders.length, lastMonthOrders.length),
        };
        const revenue = allOrders.reduce((total, order) => total + (order.total || 0), 0);
        const count = {
            revenue,
            user: usersCount,
            product: productsCount,
            order: allOrders.length,
        };
        //6 month chart data
        const orderMonthlyCounts = getChartData({
            length: 12,
            today,
            docArr: lastSixMonthOrders,
        });
        const orderMonthlyRevenue = getChartData({
            length: 12,
            today,
            docArr: lastSixMonthOrders,
            property: "total",
        });
        //category percent chart
        const categoryCount = await getInventories({
            categories,
            productsCount,
        });
        //gender ratio
        const genderRatio = {
            male: usersCount - femaleUsersCount,
            female: femaleUsersCount,
        };
        const modifiedLatestTransaction = latestTransaction.map((i) => ({
            _id: i._id,
            discount: i.discount,
            amount: i.total,
            status: i.status,
            quantity: i.orderItems.length,
        }));
        stats = {
            genderRatio,
            categoryCount,
            count,
            changePercent,
            chart: {
                order: orderMonthlyCounts,
                revenue: orderMonthlyRevenue,
            },
            latestTransaction: modifiedLatestTransaction,
        };
        myCache.set(key, JSON.stringify(stats));
    }
    res.status(200).json({ success: true, stats });
});
export const getPieCharts = TryCatch(async (req, res, next) => {
    let charts;
    const key = "admin-pie-charts";
    if (myCache.has(key))
        charts = JSON.parse(myCache.get(key));
    else {
        const allOrderPromise = Order.find({}).select([
            "total",
            "discount",
            "subtotal",
            "tax",
            "shippingCharges",
        ]);
        const [processingOrder, shippedOrder, deliveredOrder, categories, //for category chart
        productsCount, //for category chart
        productsOutOfStock, //stock check
        allOrders, //for different revenue
        usersWithDob, adminUsersCount, customersCount,] = await Promise.all([
            Order.countDocuments({ status: "Processing" }),
            Order.countDocuments({ status: "Shipped" }),
            Order.countDocuments({ status: "Delivered" }),
            Product.distinct("category"),
            Product.countDocuments(),
            Product.countDocuments({ stock: 0 }),
            allOrderPromise,
            User.find({}).select(["dob"]),
            User.countDocuments({ role: "admin" }),
            User.countDocuments({ role: "user" }),
        ]);
        const orderFulfillment = {
            processing: processingOrder,
            shipped: shippedOrder,
            delivered: deliveredOrder,
        };
        const productCategories = await getInventories({
            categories,
            productsCount,
        });
        const stockAvailability = {
            inStock: productsCount - productsOutOfStock,
            outOfStock: productsOutOfStock,
        };
        const totalTax = allOrders.reduce((total, order) => total + (order.tax || 0), 0);
        const totalShippingCarges = allOrders.reduce((total, order) => total + (order.shippingCharges || 0), 0);
        const totalDiscount = allOrders.reduce((total, order) => total + (order.discount || 0), 0);
        const totalIncome = allOrders.reduce((total, order) => total + (order.total || 0), 0);
        const revenueDistribution = {
            totalTax,
            totalShippingCarges,
            totalDiscount,
            totalIncome,
        };
        const ageGroup = {
            teen: usersWithDob.filter((i) => i.age < 20).length,
            adult: usersWithDob.filter((i) => i.age >= 20 && i.age <= 40).length,
            old: usersWithDob.filter((i) => i.age > 40).length,
        };
        const userCategory = {
            admin: adminUsersCount,
            customer: customersCount,
        };
        charts = {
            orderFulfillment,
            productCategories,
            stockAvailability,
            revenueDistribution,
            ageGroup,
            userCategory,
        };
        myCache.set(key, JSON.stringify(charts));
    }
    res.status(200).json({ success: true, charts });
});
export const getBarCharts = TryCatch(async (req, res, next) => {
    let charts;
    const key = "admin-bar-charts";
    if (myCache.has(key))
        charts = JSON.parse(myCache.get(key));
    else {
        const today = new Date();
        //For another 6 month revenue data
        const sixMonthAgo = new Date();
        sixMonthAgo.setDate(sixMonthAgo.getMonth() - 6);
        const twelveMonthAgo = new Date();
        twelveMonthAgo.setDate(twelveMonthAgo.getMonth() - 12);
        const lastSixMonthProductsPromise = Product.find({
            createdAt: {
                $gte: sixMonthAgo,
                $lte: today,
            },
        }).select("createdAt");
        const lastSixMonthUsersPromise = User.find({
            createdAt: {
                $gte: sixMonthAgo,
                $lte: today,
            },
        }).select("createdAt");
        const lasttwelveMonthOrdersPromise = Order.find({
            createdAt: {
                $gte: twelveMonthAgo,
                $lte: today,
            },
        }).select("createdAt");
        const [twelveMonthOrders, sixMonthUsers, sixMonthProducts] = await Promise.all([
            lasttwelveMonthOrdersPromise,
            lastSixMonthUsersPromise,
            lastSixMonthProductsPromise,
        ]);
        const productsCounts = getChartData({
            length: 6,
            today,
            docArr: sixMonthProducts,
        });
        const usersCounts = getChartData({
            length: 6,
            today,
            docArr: sixMonthUsers,
        });
        const ordersCounts = getChartData({
            length: 12,
            today,
            docArr: twelveMonthOrders,
        });
        charts = {
            product: productsCounts,
            user: usersCounts,
            order: ordersCounts,
        };
        myCache.set(key, JSON.stringify(charts));
    }
    res.status(200).json({ success: true, charts });
});
export const getLineCharts = TryCatch(async (req, res, next) => {
    let charts;
    const key = "admin-line-charts";
    if (myCache.has(key))
        charts = JSON.parse(myCache.get(key));
    else {
        const today = new Date();
        //For another 12 month revenue data
        const twelveMonthAgo = new Date();
        twelveMonthAgo.setDate(twelveMonthAgo.getMonth() - 12);
        const baseQuery = {
            createdAt: {
                $gte: twelveMonthAgo,
                $lte: today,
            },
        };
        const [twelveMonthProducts, twelveMonthUsers, twelveMonthOrders] = await Promise.all([
            Product.find(baseQuery).select("createdAt"),
            User.find(baseQuery).select("createdAt"),
            Order.find(baseQuery).select(["createdAt", "discount", "total"]),
        ]);
        const productsCounts = getChartData({
            length: 12,
            today,
            docArr: twelveMonthProducts,
        });
        const usersCounts = getChartData({
            length: 12,
            today,
            docArr: twelveMonthUsers,
        });
        const totalDiscount = getChartData({
            length: 12,
            today,
            docArr: twelveMonthOrders,
            property: "discount",
        });
        const totalRevenue = getChartData({
            length: 12,
            today,
            docArr: twelveMonthOrders,
            property: "total",
        });
        charts = {
            product: productsCounts,
            users: usersCounts,
            discount: totalDiscount,
            revenue: totalRevenue,
        };
        myCache.set(key, JSON.stringify(charts));
    }
    res.status(200).json({ success: true, charts });
});
