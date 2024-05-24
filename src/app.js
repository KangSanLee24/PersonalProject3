import express from "express";
import cookieParser from "cookie-parser";
import { SEVER_PORT } from "./constants/env.constant.js";
import { logMiddleware } from "./middlewares/log.middleware.js";
import { errorHandingMiddleware } from "./middlewares/error-handling.middleware.js";
import UsersRouter from "./routers/users.router.js";
import ResumeRouter from "./routers/resumes.router.js";

const app = express();

app.use(logMiddleware); // winston으로 로그 찍음
app.use(express.json()); //body에 있는거 json으로 바꾸는 기능
app.use(express.urlencoded({ extended: true })); //form으로 들어오는 데이터를 body로 넘겨주는 기능
app.use(cookieParser());
app.use("/api", [UsersRouter, ResumeRouter]);
app.use(errorHandingMiddleware);

app.listen(SEVER_PORT, () => {
  console.log(SEVER_PORT, "포트로 서버가 열렸어요!");
});
