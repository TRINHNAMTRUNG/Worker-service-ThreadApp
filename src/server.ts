import "reflect-metadata";
import express, { NextFunction } from "express";
import dotenv from "dotenv";
// import routes from "./routes/index";
import { Request, Response } from "express";
import { AppError } from "./utils/AppError";
import httpStatus from "http-status";
import { errorConverter, errorHandler } from "./middlewares/handleErorr.middleware";
import cors from "cors";

dotenv.config();

const app = express();

// enable cors
app.use(cors());


// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

//API routes
// app.use("/api", routes);

// send back a 404 error for any unknow api request
app.use((req: Request, res: Response, next: NextFunction) => {
    next(AppError.logic("api not found", httpStatus.NOT_FOUND, httpStatus["404_NAME"]));
})

// convert error
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;