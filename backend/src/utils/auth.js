import jwt from "jsonwebtoken";

export function createToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

export function publicUser(user) {
  return {
    id: user._id,
    username: user.username,
  };
}
