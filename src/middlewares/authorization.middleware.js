// 인가 미들웨어

export const requireRoles = (arrayRoles) => {
  // roles 배열을 받아서 return으로 반환한다? 고차함수?
  return (req, res, next) => {
    try {
      const { user } = req;

      if (!user || !arrayRoles.includes(user.role)) {
        // 사용자가 없거나, 사용자의 역할이 arrayRoles 포함되어 있지 않으면
        return res.status(403).json({ message: "접근 권한이 없습니다." });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
