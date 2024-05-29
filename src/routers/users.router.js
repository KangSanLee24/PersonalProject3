import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma/index.js";
import { signupValidator } from "../middlewares/validators/signup.validator.js";
import { signinValidator } from "../middlewares/validators/singin.validator.js";
import { authenticationMiddleware } from "../middlewares/authentication.middleware.js";
import { SECRET_KEY } from "../constants/auth.constant.js";

const router = express.Router();

/** 사용자 회원가입 API **/
router.post("/sign-up", signupValidator, async (req, res, next) => {
  try {
    const { email, password, passwordConfirm, name } = req.body;

    // 비밀번호 확인
    if (password !== passwordConfirm) {
      return res.status(400).json({
        status: 400,
        message: "입력한 두 비밀번호가 일치하지 않습니다.",
      });
    }

    // 이미 가입된 사용자 확인
    const isExistUser = await prisma.users.findFirst({
      where: { email },
    });
    if (isExistUser) {
      return res
        .status(400)
        .json({ status: 400, message: "이미 가입된 사용자입니다." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });
    // Prisma 객체는 그냥 JS객체 아니다.
    const userWithoutPassword = { ...user, password: undefined };

    return res.status(201).json({
      status: 201,
      message: "회원가입에 성공했습니다.",
      data: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
});

/** 로그인 API **/
router.post("/sign-in", signinValidator, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.users.findFirst({ where: { email } });
    if (!user)
      return res
        .status(401)
        .json({ status: 401, message: "인증 정보가 유효하지 않습니다." });
    else if (!(await bcrypt.compare(password, user.password)))
      return res
        .status(401)
        .json({ status: 401, message: "인증 정보가 유효하지 않습니다." });

    const token = jwt.sign(
      {
        userId: user.userId,
      },
      SECRET_KEY,
      { expiresIn: "12h" } // 토큰 유효기간 12시간
    );

    // authorization 헤더에 Bearer 토큰 형식으로 JWT를 저장합니다.
    res.setHeader("authorization", `Bearer ${token}`);

    return res
      .status(200)
      .json({ status: 200, message: "로그인에 성공하였습니다." });
  } catch (error) {
    next(error);
  }
});

/** 사용자 조회 API **/
router.get("/users", authenticationMiddleware, async (req, res, next) => {
  try {
    // 사용자 인증하고 req.user에 담긴 정보 중 userId만 가져옴.
    const { userId } = req.user;

    //
    const user = await prisma.users.findFirst({
      where: { userId: +userId },
      select: {
        userId: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({ data: user });
  } catch (error) {
    next(error);
  }
});

export default router;
