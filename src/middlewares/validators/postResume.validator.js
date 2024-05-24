import Joi from "joi";
// joi객체 유효성 검사
export const postResumeValidator = async (req, res, next) => {
  try {
    const joiSchema = Joi.object({
      title: Joi.string().required().messages({
        "string.base": "제목은 문자열이여야 합니다.",
        "string.empty": "제목을 입력해 주세요.",
      }),
      introduction: Joi.string().min(150).required().messages({
        "string.base": "자기소개는 문자열이여야 합니다.",
        "string.empty": "자기소개를 입력해 주세요.",
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
