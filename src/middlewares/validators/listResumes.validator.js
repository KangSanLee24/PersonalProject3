import Joi from "joi";
import { RUSUME_STATUS } from "../../constants/resume.constant.js";

export const listResumesValidator = async (req, res, next) => {
  try {
    const joiSchema = Joi.object({
      sort: Joi.string().optional().valid("asc", "desc").messages({
        "any.only": "정렬 방식은 'asc' 또는 'desc'여야 합니다.",
      }),
      status: Joi.string()
        .optional()
        .valid(...Object.values(RUSUME_STATUS))
        .messages({
          "any.only": "이력서의 상태를 정확히 입력해 주세요.",
        }),
    });

    await joiSchema.validateAsync(req.query);
    next();
  } catch (error) {
    next(error);
  }
};
