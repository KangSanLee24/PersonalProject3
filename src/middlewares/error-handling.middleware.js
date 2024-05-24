export const errorHandingMiddleware = function (error, req, res, next) {
  console.error(error);
  //Joi 에러 유효성검사
  if (error.name === "ValidationError") {
    return res
      .status(400)
      .json({ status: 400, errorMessageessage: error.message });
  } else if (error.name === "CastError") {
    // /products/:productsId에서 Id부분이 틀리면 나옴.
    return res.status(404).json({
      errorMessage: "존재하지 않는 정보입니다.",
    });
  }
  // 클라이언트에게 에러 메시지를 전달합니다.
  res.status(500).json({ errorMessage: "서버 내부 에러가 발생했습니다." });
};
