//인증 미들웨어
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma/index.js";
import { SECRET_KEY } from "../constants/auth.constant.js";

export const authenticationMiddleware = async function (req, res, next) {
  try {
    const authorization = req.headers["authorization"];

    if (!authorization) throw new Error("인증 정보가 없습니다.");

    const [tokenType, token] = authorization.split(" ");

    if (tokenType !== "Bearer")
      throw new Error("지원하지 않는 인증 방식입니다.");

    const decodedToken = jwt.verify(token, SECRET_KEY);
    const userId = decodedToken.userId;

    const user = await prisma.users.findFirst({
      where: { userId: +userId },
      select: { userId: true, role: true }, //엑세스토큰에 역할넣기
    });

    if (!user) {
      res.setHeader("Authorization", ""); // Authorization 비우기
      throw new Error("인증 정보와 일치하는 사용자가 없습니다.");
    }

    // req.user에 사용자 정보를 저장합니다.
    req.user = user;

    next();
  } catch (error) {
    res.setHeader("Authorization", ""); // Authorization 비우기

    // 토큰이 만료되었거나, 조작되었을 때, 에러 메시지를 다르게 출력합니다.
    switch (error.name) {
      case "TokenExpiredError":
        return res.status(401).json({ message: "인증 정보가 만료되었습니다." });
      case "JsonWebTokenError":
        return res
          .status(401)
          .json({ message: "인증 정보가 유효하지 않습니다." });
      default:
        return res
          .status(401)
          .json({ message: error.message ?? "인증 정보가 유효하지 않습니다." });
    }
  }
};
