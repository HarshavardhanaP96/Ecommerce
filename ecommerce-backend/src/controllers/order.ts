import { Request } from "express";
import { TryCatch } from "../middlewares/error.js";
import { NewOrderRequestBody } from "../types/types.js";
import { Order } from "../models/order.js";
import { cacheInvalidator, reduceStock } from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";
import { myCache } from "../app.js";

export const myOrders = TryCatch(async (req, res, next) => {
  const { id: user } = req.query;
  let orders = [];

  const key = `my-orders-${user}`;
  if (myCache.has(key)) orders = JSON.parse(myCache.get(key) as string);
  else {
    orders = await Order.find({ user });
    myCache.set(key, JSON.stringify(orders));
  }

  return res.status(200).json({ success: true, orders });
});

export const allOrders = TryCatch(async (req, res, next) => {
  let orders = [];

  const key = `all-orders`;
  if (myCache.has(key)) orders = JSON.parse(myCache.get(key) as string);
  else {
    orders = await Order.find().populate("user", "name"); //wants to get only user name ot the admin panel
    myCache.set(key, JSON.stringify(orders));
  }

  return res.status(200).json({ success: true, orders });
});

export const getOrderById = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  let order;

  const key = `order-${id}`;

  if (myCache.has(key)) order = JSON.parse(myCache.get(key) as string);
  else {
    order = await Order.findById(id).populate("user", "name");

    if (!order) return next(new ErrorHandler("Order Not Found", 404));

    myCache.set(key, JSON.stringify(order));
  }

  return res.status(200).json({ success: true, order });
});

export const newOrder = TryCatch(
  async (req: Request<{}, {}, NewOrderRequestBody>, res, next) => {
    const {
      shippingInfo,
      orderItems,
      user,
      subtotal,
      shippingCharges,
      tax,
      discount,
      total,
    } = req.body;

    if (!shippingInfo || !orderItems || !user || !subtotal || !total || !tax) {
      return next(new ErrorHandler("Please Enter All the fields", 400));
    }

    const order = await Order.create({
      shippingInfo,
      orderItems,
      user,
      subtotal,
      shippingCharges,
      tax,
      discount,
      total,
    });

    reduceStock(orderItems);

    cacheInvalidator({
      product: true,
      order: true,
      admin: true,
      userId: user,
      productId: String(order.orderItems.map((i) => i.productId)),
    });

    return res
      .status(200)
      .json({ success: true, message: "Order Placed Successfully" });
  }
);

export const processOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id);

  if (!order) return next(new ErrorHandler("Product Not Found", 404));

  switch (order.status) {
    case "Processing":
      order.status = "Shipped";
      break;
    case "Shipped":
      order.status = "Delivered";
      break;
    default:
      order.status = "Delivered";
      break;
  }

  await order.save();

  cacheInvalidator({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
    orderId: String(order._id),
  });

  return res
    .status(200)
    .json({ success: true, message: "Order Processed Successfully" });
});

export const deleteOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id);

  if (!order) return next(new ErrorHandler("Product Not Found", 404));

  await order.deleteOne();

  cacheInvalidator({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
    orderId: String(order._id),
  });

  return res
    .status(200)
    .json({ success: true, message: "Order Deleted Successfully" });
});
