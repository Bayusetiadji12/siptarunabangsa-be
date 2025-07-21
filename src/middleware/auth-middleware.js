import jwt from "jsonwebtoken";
import { prismaClient } from "../application/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "myapp_super_secret";

export const isAuthorized = async (req, res, next) => {
  const authHeader = req.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ errors: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Cek apakah user masih ada di database
    const user = await prismaClient.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json({ errors: "Unauthorized: User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ errors: "Unauthorized: Invalid token" });
  }
};

export const isAdmin = async (req, res, next) => {
  if (!req.user?.is_admin) {
    return res.status(403).json({ errors: "Anda tidak memiliki akses" });
  }

  next();
};
