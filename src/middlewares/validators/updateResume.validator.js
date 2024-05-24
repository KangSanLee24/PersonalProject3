import Joi from "joi";
// joi객체 유효성 검사
export const updateResumeValidator = async (req, res, next) => {
  try {
    const { title, introduction } = req.body;

    // 제목과 자기소개가 둘 다 없는 경우
    if (!title && !introduction) {
      return res.status(400).json({
        status: 400,
        message: "수정할 정보를 입력해 주세요.",
      });
    }

    const joiSchema = Joi.object({
      title: Joi.string().optional().messages({
        "string.base": "제목은 문자열이여야 합니다.",
      }),
      introduction: Joi.string().min(150).optional().messages({
        "string.base": "자기소개는 문자열이여야 합니다.",
        "string.min": "자기소개는 150자리 이상이어야 합니다.",
      }),
    });

    await joiSchema.validateAsync(req.body);
    next();
  } catch (error) {
    console.log(error);
    next(error);
  }
};
