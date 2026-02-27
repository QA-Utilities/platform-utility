export const JWT_DEFAULT_HEADER = {
  alg: "HS256",
  typ: "JWT"
};

export const JWT_DEFAULT_PAYLOAD_BASE = {
  sub: "qa-user-123",
  role: "tester"
};

export const JWT_DEFAULT_SECRET = "qa-secret";

export const JWT_TIME_OFFSETS = {
  iat: 0,
  exp: 3600
};
