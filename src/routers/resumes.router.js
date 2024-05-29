import express from "express";
import { prisma } from "../utils/prisma/index.js";
import { authenticationMiddleware } from "../middlewares/authentication.middleware.js";
import { requireRoles } from "../middlewares/authorization.middleware.js";
import { postResumeValidator } from "../middlewares/validators/postResume.validator.js";
import { updateResumeValidator } from "../middlewares/validators/updateResume.validator.js";
import { listResumesValidator } from "../middlewares/validators/listResumes.validator.js";
import { RUSUME_STATUS } from "../constants/resume.constant.js";

const router = express.Router();

/** 이력서 제출 API**/
router.post(
  "/resumes",
  authenticationMiddleware,
  postResumeValidator,
  async (req, res, next) => {
    const { userId } = req.user;
    const { title, introduction } = req.body;

    const resume = await prisma.resumes.create({
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
  authenticationMiddleware,
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
        resumes = await prisma.resumes.findMany({
          where: statusFilter,
          orderBy: { createdAt: sortOrder },
          select: {
            resumeId: true,
            title: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            users: {
              select: {
                name: true,
              },
            },
          },
        });
      } else {
        resumes = await prisma.resumes.findMany({
          where: { UserId: +userId, ...statusFilter }, // 이건 뺄까 고민중
          orderBy: { createdAt: sortOrder },
          select: {
            resumeId: true,
            title: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            users: {
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
router.get(
  "/resumes/:resumeId",
  authenticationMiddleware,
  async (req, res, next) => {
    try {
      const { userId, role } = req.user;
      const { resumeId } = req.params;

      const resume = await prisma.resumes.findFirst({
        where: { resumeId: +resumeId },
        select: {
          resumeId: true,
          UserId: true,
          title: true,
          introduction: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          users: {
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
  }
);

/** 이력서 수정 API **/
router.patch(
  "/resumes/:resumeId",
  authenticationMiddleware,
  updateResumeValidator,
  async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { resumeId } = req.params;
      const { title, introduction } = req.body;

      let isExistResume = await prisma.resumes.findFirst({
        where: { UserId: +userId, resumeId: +resumeId },
      });
      if (!isExistResume)
        return res
          .status(400)
          .json({ status: 400, message: "이력서가 존재하지 않습니다." });

      let resume = await prisma.resumes.update({
        where: { UserId: +userId, resumeId: +resumeId },
        data: { title: title, introduction: introduction },
      });

      return res.status(200).json({
        status: 201,
        message: "이력서 수정에 성공했습니다.",
        data: resume,
      });
    } catch (error) {
      next(error);
    }
  }
);

/** 이력서 삭제 API **/
router.delete(
  "/resumes/:resumeId",
  authenticationMiddleware,
  async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { resumeId } = req.params;

      const isExistResume = await prisma.resumes.findFirst({
        where: { UserId: +userId, resumeId: +resumeId },
      });
      if (!isExistResume) {
        return res
          .status(400)
          .json({ status: 400, message: "이력서가 존재하지 않습니다." });
      }

      await prisma.resumes.delete({
        where: { UserId: +userId, resumeId: +resumeId },
      });
      return res.status(200).json({
        status: 201,
        message: "이력서 삭제에 성공했습니다.",
        data: resumeId,
      });
    } catch (error) {
      next(error);
    }
  }
);

/** 이력서 상태 변경 API*/
router.patch(
  "/resumes/:resumeId/status",
  authenticationMiddleware,
  requireRoles(["RECRUITER"]),
  async (req, res, next) => {
    const { resumeId } = req.params;
    const { status, reason } = req.body;
    const userId = req.user.userId; // 접속한 RECRUITER의 ID

    //status없다 or RUSUME_STATUS에 key값이 문자열 status와 같은게 없다.
    if (!status || !RUSUME_STATUS[status]) {
      return res.status(400).json({
        status: 400,
        message: "변경하고자 하는 지원 상태를 입력해 주세요.",
      });
    }
    if (!reason) {
      return res
        .status(400)
        .json({ status: 400, message: "지원 상태 변경 사유를 입력해 주세요." });
    }

    try {
      const resume = await prisma.resumes.findFirst({
        where: { resumeId: +resumeId },
      });

      if (!resume)
        return res.status(400).json({ message: "이력서가 존재하지 않습니다." });

      // 이력서 상태 업데이트
      const updatedResume = await prisma.resumes.update({
        where: { resumeId: +resumeId },
        data: { status },
      });

      //이력서 상태 수정 로그 생성 - connect로 연결하기. 대소문자구분 똑바로
      const resumeLog = await prisma.resumeLogs.create({
        data: {
          oldStatus: resume.status,
          newStatus: status,
          reason,
          resumes: {
            connect: { resumeId: resume.resumeId },
          },
          users: {
            connect: { userId: +userId },
          },
        },
      });

      // 응답 반환
      return res.status(200).json({
        status: 201,
        message: "이력서 상태 변경에 성공하였습니다.",
        logId: resumeLog.logId,
        recruiterId: +userId,
        resumeId: resumeLog.ResumeId,
        oldStatus: resumeLog.oldStatus,
        newStatus: resumeLog.newStatus,
        reason: resumeLog.reason,
        createdAt: resumeLog.createdAt,
      });
    } catch (error) {
      next(error);
    }
  }
);

/** 이력서 로그 목록 조회 API */
router.get(
  "/resumes/:resumeId/logs",
  authenticationMiddleware,
  requireRoles(["RECRUITER"]),
  async (req, res, next) => {
    const { resumeId } = req.params;

    try {
      // 이력서 로그 조회
      const logs = await prisma.resumeLogs.findMany({
        where: { ResumeId: +resumeId },
        include: {
          users: true,
        },
        orderBy: { createdAt: "desc" },
      });

      if (!logs || logs.length === 0) {
        return res.status(200).json([]);
      }
      console.log("\n\n" + JSON.stringify(logs) + "\n\n");
      // 이력서 로그 정보 반환
      const formattedLogs = logs.map((log) => {
        return {
          logId: log.logId,
          recruiterName: log.users.name, // 채용 담당자 이름
          resumeId: log.ResumeId,
          oldStatus: log.oldStatus,
          newStatus: log.newStatus,
          reason: log.reason,
          createdAt: log.createdAt,
        };
      });

      // 응답 반환
      return res.status(200).json(formattedLogs);
    } catch (error) {
      next(error);
    }
  }
);
export default router;
