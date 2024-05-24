import Joi from "joi";
// joi객체 유효성 검사
export const signinValidator = async (req, res, next) => {
  try {
    const joiSchema = Joi.object({
      email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
        .required()
        .messages({
          "string.base": "이메일은 문자열이여야 합니다.",
          "string.empty": "이메일을 입력해 주세요.",
          "string.email": "이메일 형식이 올바르지 않습니다.",
        }),
      password: Joi.string().min(6).required().messages({
        "string.base": "비밀번호는 문자열이여야 합니다.",
        "string.empty": "비밀번호를 입력해 주세요.",
        "string.min": "비밀번호는 6자리 이상이어야 합니다.",
      }),
    });
    await joiSchema.validateAsync(req.body);
    next();
  } catch (error) {
    next(error);
  }
};
