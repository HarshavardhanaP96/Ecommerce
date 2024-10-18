import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { deleteProduct, getAdminProducts, getAllCategories, getAllProducts, getlatestProducts, getProductById, newProduct, updateProduct, } from "../controllers/product.js";
import { singleUpload } from "../middlewares/multer.js";
const app = express();
app.post("/new", adminOnly, singleUpload, newProduct);
app.get("/all", getAllProducts); //with fillter or search
app.get("/latest", getlatestProducts);
app.get("/categories", getAllCategories);
app.get("/get-Admin-products", adminOnly, getAdminProducts);
app
    .route("/:id")
    .get(getProductById)
    .put(adminOnly, singleUpload, updateProduct)
    .delete(adminOnly, deleteProduct);
export default app;
