import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { createToken, publicUser } from "../utils/auth.js";

function cleanUsername(value = "") {
  return value.trim().toLowerCase();
}

function validate(username, password) {
  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    return "Username must be 3-24 lowercase letters, numbers, or underscores.";
  }

  if (password.length < 6) {
    return "Password must be at least 6 characters.";
  }

  return "";
}

function sendAuth(res, user, status = 200) {
  return res.status(status).json({
    token: createToken(user._id),
    user: publicUser(user),
  });
}

export async function register(req, res, next) {
  try {
    const username = cleanUsername(req.body.username);
    const password = String(req.body.password || "");
    const validationError = validate(username, password);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    if (await User.exists({ username })) {
      return res.status(409).json({ message: "That username is already taken." });
    }

    const user = await User.create({
      username,
      passwordHash: await bcrypt.hash(password, 10),
    });

    return sendAuth(res, user, 201);
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const username = cleanUsername(req.body.username);
    const password = String(req.body.password || "");
    const user = await User.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Username or password is incorrect." });
    }

    return sendAuth(res, user);
  } catch (error) {
    return next(error);
  }
}

export function getMe(req, res) {
  return res.json({ user: publicUser(req.user) });
}
