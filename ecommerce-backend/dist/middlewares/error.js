export const errorMiddleware = (err, req, res, next) => {
    err.message || (err.message = "Internal Server Error");
    err.statusCode || (err.statusCode = 500);
    if (err.name == "CastError")
        err.message = "Invalid ID"; //Handles invalid length of id necessary because this error will not reach the if block to handle in controllers
    return res.status(err.statusCode).json({
        success: false,
        message: err.message,
    });
};
// Wraper to avoid repetition
export const TryCatch = (func) => (req, res, next) => {
    return Promise.resolve(func(req, res, next).catch(next));
};
