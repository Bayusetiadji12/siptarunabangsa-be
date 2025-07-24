import fs from "fs";
import cloudinary from "../application/cloudinary.js";
import { prismaClient } from "../application/db.js";
import { ResponseError } from "../error/response-error.js";
import {
  getAllUserValidation,
  loginUserValidation,
  registerUserValidation, 
  updateUserValidation,
} from "../validation/user-validation.js";
import { kmpSearch } from "../util/kmp.js";
import { validate } from "../validation/validation.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "myapp_super_secret";

const register = async (request) => {
  const user = validate(registerUserValidation, request);

  const isUserExist = await prismaClient.user.count({
    where: {
      OR: [
        { email: user.email },
        { nis: user.nis },
      ],
    },
  });

  if (isUserExist === 1) {
    throw new ResponseError(400, "Pengguna ini sudah terdaftar");
  }

  user.password = await bcrypt.hash(user.password, 10);

  user.is_admin = false;

  return prismaClient.user.create({
    data: user,
    select: {
      name: true,
      email: true,
      nis: true,
      phone: true,
      gender: true,
      address: true,
    },
  });
};

const login = async (request) => {
  const loginRequest = validate(loginUserValidation, request);

  const user = await prismaClient.user.findUnique({
    where: {
      email: loginRequest.email,
    },
    select: {
      id: true,
      email: true,
      password: true,
      is_admin: true,
    },
  });

  if (!user) {
    throw new ResponseError(401, "Email atau Password salah");
  }

  const isPasswordValid = await bcrypt.compare(
    loginRequest.password,
    user.password
  );

  if (!isPasswordValid) {
    throw new ResponseError(401, "Email atau password salah");
  }

  const token = jwt.sign(
    {
      email: user.email,
      id: user.id,
      is_admin: user.is_admin,
    },
    JWT_SECRET,
    { expiresIn: "1d" }
  );
  return {
    token,
    message: "Login berhasil",
  };
};

const getUserProfile = async (userId) => {
  const user = await prismaClient.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true, 
      name: true,
      email: true,
      nis: true,
      phone: true,
      gender: true,
      address: true,
      image: true,
      memberSince: true,
      is_admin: true,
    },
  });

  if (!user) {
    throw new ResponseError(404, "Pengguna tidak ditemukan");
  }

  return user;
};

const logoutUser = async (userId) => {
  const user = await prismaClient.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ResponseError(404, "Pengguna tidak ditemukan");
  }

  return {
    message: "Logout berhasil",
  };
};


const getAllUser = async (request) => {
  request = validate(getAllUserValidation, request);

  const pageNumber = request.page || 1;
  const limitNumber = request.limit || 10;
  const offset = (pageNumber - 1) * limitNumber;
  const query = request.query;
  const sortBy = request.sortBy || "name";
  const sortOrder = request.sortOrder || "asc";

  const filters = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
        ],
      }
    : undefined;

  const users = await prismaClient.user.findMany({
    where: filters,
    skip: offset,
    take: limitNumber,
    orderBy: {
      [sortBy]: sortOrder,
    },
    // include: {
    //   borrows: {
    //     where: {
    //       isDeleted: false,
    //     },
    //   },
    // },
  });

  const totalUsers = await prismaClient.user.count();
  // const totalUsers = await prismaClient.user.count({
  //   where: filters,
  // });

  return {
    data: users,
    pagination: {
      page: pageNumber,
      total_page: Math.ceil(totalUsers / limitNumber),
      total_users: totalUsers,
    },
  };
};

const updateUser = async (userId, request, image) => {
  request = validate(updateUserValidation, request);

  const existingUser = await prismaClient.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new ResponseError(404, "Pengguna tidak ditemukan");
  }

  // Cek jika email atau NIS berubah dan sudah digunakan oleh user lain
  if (
    (request.email && request.email !== existingUser.email) ||
    (request.nis && request.nis !== existingUser.nis)
  ) {
    const duplicate = await prismaClient.user.findFirst({
      where: {
        OR: [
          { email: request.email },
          { nis: request.nis },
        ],
        NOT: { id: userId },
      },
    });

    if (duplicate) {
      throw new ResponseError(400, "Email atau NIS sudah digunakan oleh pengguna lain");
    }
  }

  if (request.password && request.password.trim() !== "") {
    request.password = await bcrypt.hash(request.password, 10);
  } else {
    delete request.password; // jika kosong, hapus agar tidak diupdate menjadi null
  }

  let imageUrl = existingUser.image;
  if (image) {
    // Hapus image lama dari cloudinary jika ada
    if (existingUser.image) {
      const publicId = existingUser.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`sip-user/${publicId}`);
    }

    const uploadResponse = await cloudinary.uploader.upload(image.path, {
      folder: "sip-user",
    });

    imageUrl = uploadResponse.secure_url;

    await fs.promises.unlink(image.path);
  }
  
  const updatedUser = await prismaClient.user.update({
    where: {
      id: userId,
    },
    data: {
      ...request,
      image: imageUrl,
    },
    select: {
      name: true,
      email: true,
      nis: true,
      phone: true,
      gender: true,
      address: true,
      image: true,
    },
  });

  return {
    message: "Pengguna berhasil diperbarui",
    data: updatedUser,
  };
};

const searchUser = async (keyword) => {
  const users = await prismaClient.user.findMany();
  const lowerKeyword = keyword.toLowerCase();

  const matchedUsers = users.filter((user) =>
    kmpSearch(user.name.toLowerCase(), lowerKeyword) ||
    kmpSearch(user.email.toLowerCase(), lowerKeyword) ||
    kmpSearch(user.nis.toLowerCase(), lowerKeyword) ||
    kmpSearch(user.phone.toLowerCase(), lowerKeyword)
  );

  if (matchedUsers.length === 0) {
    throw new Error("Pengguna tidak ditemukan");
  }

  return matchedUsers;
};

const deleteUser = async (userId) => {
  const user = await prismaClient.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new ResponseError(404, "Pengguna tidak ditemukan");
  }

  if (user.image) {
    const publicId = book.cover.split("/").pop().split(".")[0]; 
    if (publicId) {
      await cloudinary.uploader.destroy(`sip-user/${publicId}`);
    }
  }

  return prismaClient.user.delete({
    where: {
      id: userId,
    },
  });
};

export default {
  register,
  login,
  getUserProfile,
  logoutUser,
  getAllUser,
  updateUser,
  searchUser,
  deleteUser,
};
