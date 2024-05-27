import express from "express";
import { prisma } from "../utils/prisma/index.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { postResumeValidator } from "../middlewares/validators/postResume.validator.js";
import { updateResumeValidator } from "../middlewares/validators/updateResume.validator.js";
import { listResumesValidator } from "../middlewares/validators/listResumes.validator.js";

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
router.get(
  "/resumes",
  authMiddleware,
  listResumesValidator,
  async (req, res, next) => {
    try {
      const { userId, role } = req.user;
      const sortOrder =
        req.query.sort?.toLowerCase() === "asc" ? "asc" : "desc";
      //객체형태로 오니까 객체로 해줘야됨
      const statusFilter = req.query.status ? { status: req.query.status } : {};

      let resumes = {};
      if (role === "RECRUITER") {
        resumes = await prisma.Resumes.findMany({
          where: statusFilter,
          orderBy: { createdAt: sortOrder },
          select: {
            resumeId: true,
            title: true,
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
      } else {
        resumes = await prisma.Resumes.findMany({
          where: { UserId: +userId, ...statusFilter }, // 이건 뺄까 고민중
          orderBy: { createdAt: sortOrder },
          select: {
            resumeId: true,
            title: true,
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
      }

      return res.status(200).json({ data: resumes });
    } catch (error) {
      next(error);
    }
  }
);

/** 이력서 상세 조회 API**/
router.get("/resumes/:resumeId", authMiddleware, async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    const { resumeId } = req.params;

    const resume = await prisma.Resumes.findFirst({
      where: { resumeId: +resumeId },
      select: {
        resumeId: true,
        UserId: true,
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

    if (!resume)
      return res
        .status(400)
        .json({ status: 400, message: "이력서가 존재하지 않습니다." });

    if (role !== "RECRUITER" && resume.UserId !== userId) {
      return res
        .status(403)
        .json({ status: 403, message: "접근 권한이 없습니다." });
    }
    const { UserId, ...resumeWithoutUserId } = resume; // UserId는 내보내기 싫음

    return res.status(200).json({ data: resumeWithoutUserId });
  } catch (error) {
    next(error);
  }
});

/** 이력서 수정 API 아직 APPLICANT버전 밖에 없다.**/
router.patch(
  "/resumes/:resumeId",
  authMiddleware,
  updateResumeValidator,
  async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { resumeId } = req.params;
      const { title, introduction } = req.body;

      let isExistResume = await prisma.Resumes.findFirst({
        where: { UserId: +userId, resumeId: +resumeId },
      });
      if (!isExistResume)
        return res
          .status(400)
          .json({ status: 400, message: "이력서가 존재하지 않습니다." });

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
  }
);

/** 이력서 삭제 API **/
router.delete("/resumes/:resumeId", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { resumeId } = req.params;

    const isExistResume = await prisma.Resumes.findFirst({
      where: { UserId: +userId, resumeId: +resumeId },
    });
    if (!isExistResume) {
      return res
        .status(400)
        .json({ status: 400, message: "이력서가 존재하지 않습니다." });
    }

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
