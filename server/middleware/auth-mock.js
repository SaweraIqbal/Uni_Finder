export const authMock = (req, res, next) => {
  // TODO: replace with real auth
  req.user = { id: "user_demo_123", email: "jareer1234@gmail.com" };
  next();
};
