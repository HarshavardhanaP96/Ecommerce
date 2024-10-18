import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../middlewares/error.js";
import {
  BaseQuery,
  NewProductRequestBody,
  SearchRequestQuery,
} from "../types/types.js";
import { Product } from "../models/product.js";
import ErrorHandler from "../utils/utility-class.js";
import { rm } from "fs";
import { myCache } from "../app.js";
import { cacheInvalidator } from "../utils/features.js";

//revalidate caceh on new product create, update or delete  an on new orders
export const getlatestProducts = TryCatch(async (req, res, next) => {
  let products;

  if (myCache.has("latest-products")) {
    products = JSON.parse(myCache.get("latest-products") as string);
  } else {
    products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
    myCache.set("latest-products", JSON.stringify(products));
  }

  return res.status(202).json({ success: true, products });
});

//revalidate caceh on new product create, update or delete  an on new orders

export const getAllCategories = TryCatch(async (req, res, next) => {
  let categories;

  if (myCache.has("categories")) {
    categories = JSON.parse(myCache.get("categories") as string);
  } else {
    categories = await Product.distinct("category");
    myCache.set("categories", JSON.stringify(categories));
  }
  return res.status(202).json({ success: true, categories });
});

//revalidate caceh on new product create, update or delete  an on new orders
export const getAdminProducts = TryCatch(async (req, res, next) => {
  let products;

  if (myCache.has("all-products")) {
    products = JSON.parse(myCache.get("all-products") as string);
  } else {
    products = await Product.find({});
    myCache.set("all-products", JSON.stringify(products));
  }

  return res.status(202).json({ products });
});

//revalidate caceh on new product create, update or delete  an on new orders
export const getProductById = TryCatch(async (req, res, next) => {
  const id = req.params.id;
  let product;

  if (myCache.has(`product-${id}`)) {
    product = JSON.parse(myCache.get(`product-${id}`) as string);
  } else {
    product = await Product.findById(id);

    if (!product) {
      return next(new ErrorHandler("No product found", 404));
    }

    myCache.set(`product-${id}`, JSON.stringify(product));
  }

  return res.status(202).json({ success: true, product });
});

export const newProduct = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    const { name, price, stock, category } = req.body;
    const photo = req.file;

    if (!photo) {
      return next(new ErrorHandler("Please Add Photo", 400));
    }

    if (!name || !price || !stock || !category) {
      rm(photo.path, () => {
        console.log("photo deleted");
      });

      return next(new ErrorHandler("Please Enter All Fields", 400));
    }

    await Product.create({
      name,
      price,
      stock,
      category: category.toLowerCase(),
      photo: photo?.path,
    });

    cacheInvalidator({ product: true, admin: true });

    return res
      .status(202)
      .json({ success: true, message: "Product Created Successfully" });
  }
);

export const updateProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const { name, price, stock, category } = req.body;
  const photo = req.file;
  const product = await Product.findById(id);

  if (!product) {
    return next(new ErrorHandler("No product found", 404));
  }

  if (photo) {
    rm(product.photo, () => {
      console.log("Old Photo Deleted");
    });

    product.photo = photo.path;
  }

  if (name) {
    product.name = name;
  }
  if (stock) {
    product.stock = stock;
  }
  if (category) {
    product.category = category;
  }
  if (price) {
    product.price = price;
  }

  await product.save();

  cacheInvalidator({
    product: true,
    productId: String(product._id),
    admin: true,
  });

  return res
    .status(200)
    .json({ success: true, message: "Product Updated Successfully" });
});

export const deleteProduct = TryCatch(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("No product found", 404));
  }

  rm(product.photo, () => {
    console.log("Product Photo Deleted");
  });

  await Product.deleteOne();

  cacheInvalidator({
    product: true,
    productId: String(product._id),
    admin: true,
  });

  return res
    .status(202)
    .json({ success: true, message: "Product deleted Successfully" });
});

export const getAllProducts = TryCatch(
  async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {
    const { search, price, category, sort } = req.query;

    const page = Number(req.query.page) || 1;
    const limit = Number(process.env.PRODUCT_PER_PAGE) || 10;
    const skip = limit * (page - 1);

    const baseQuery: BaseQuery = {};

    if (search)
      baseQuery.name = {
        $regex: search,
        $options: "i",
      };

    if (price)
      baseQuery.price = {
        $lte: Number(price),
      };

    if (category) baseQuery.category = category;

    const productPromise = Product.find(baseQuery)
      .sort(sort && { price: sort === "ASC" ? 1 : -1 })
      .limit(limit)
      .skip(skip);

    //Just to avoid 2 await request >reduce delay
    const [products, filteredProducts] = await Promise.all([
      productPromise,
      Product.find(baseQuery),
    ]);

    const totalpage = Math.ceil(filteredProducts.length / limit);

    return res.status(202).json({ products, totalpage });
  }
);
