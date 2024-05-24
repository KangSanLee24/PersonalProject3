import express from "express";
import { prisma } from "../utils/prisma/index.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { postResumeValidator } from "../middlewares/validators/postResume.validator.js";

const router = express.Router();

/** 이력서 제출 API**/
router.post(
  "/resumes",
  authMiddleware,
  postResumeValidator,
  async (req, res, next) => {
    const { userId } = req.user;
    const { title, introduction } = req.body;

    const resume = await prisma.Resumes.create({
      data: {
        UserId: +userId,
        title,
        introduction,
      },
    });

    return res.status(201).json({
      status: 201,
      message: "이력서 등록에 성공했습니다.",
      data: resume,
    });
  }
);
/** 이력서 목록 조회 API**/
router.get("/resumes", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const sortOrder = req.query.sort?.toLowerCase() === "asc" ? "asc" : "desc";

    const resumes = await prisma.Resumes.findMany({
      where: { UserId: +userId },
      orderBy: { createdAt: sortOrder },
      select: {
        resumeId: true,
        title: true,
        introduction: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        Users: {
          select: {
            name: true,
          },
        },
      },
    });
    return res.status(200).json({ data: resumes });
  } catch (error) {
    next(error);
  }
});

/** 이력서 상세 조회 API**/
router.get("/resumes/:resumeId", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { resumeId } = req.params;

    const resume = await prisma.Resumes.findFirst({
      where: { UserId: +userId, resumeId: +resumeId },
      select: {
        resumeId: true,
        Users: {
          select: {
            name: true,
          },
        },
        title: true,
        introduction: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return res.status(200).json({ data: resume });
  } catch (error) {
    next(error);
  }
});

/** 이력서 수정 API**/
router.patch("/resumes/:resumeId", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { resumeId } = req.params;
    const { title, introduction } = req.body;

    let resume = await prisma.Resumes.update({
      where: { UserId: +userId, resumeId: +resumeId },
      data: { title: title, introduction: introduction },
    });

    return res.status(200).json({
      status: 200,
      message: "이력서 수정에 성공했습니다.",
      data: resume,
    });
  } catch (error) {
    next(error);
  }
});

/** 이력서 삭제 API **/
router.delete("/resumes/:resumeId", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { resumeId } = req.params;

    await prisma.Resumes.delete({
      where: { UserId: +userId, resumeId: +resumeId },
    });
    return res.status(200).json({
      status: 200,
      message: "이력서 삭제에 성공했습니다.",
      data: resumeId,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
