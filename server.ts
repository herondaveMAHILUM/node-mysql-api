import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "./_helpers/db";
import accountsController from "./accounts/accounts.controller";
import swaggerRouter from "./_helpers/swagger";
import errorHandler from "./_middleware/error-handler";

const app = express();
const port = 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: true,
    credentials: true
  })
);

app.use("/api-docs", swaggerRouter);
app.use("/accounts", accountsController);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api-docs`);
});
