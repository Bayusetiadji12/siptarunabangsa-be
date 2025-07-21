  import fs from "fs";
  import cloudinary from "../application/cloudinary.js";
  import { prismaClient } from "../application/db.js";
  import { ResponseError } from "../error/response-error.js";
  import { 
    createCategoryValidation,
    getCategoryValidation,
    updateCategoryValidation
  } from "../validation/category-validation.js";
  import { kmpSearch } from "../util/kmp.js";
  import { validate } from "../validation/validation.js";

  const getAllCategory = async (request) => {
    request = validate(getCategoryValidation, request);

    const pageNumber = request.page || 1;
    const limitNumber = request.limit || 10;
    const offset = (pageNumber - 1) * limitNumber;
    const query = request.query;
    const sortBy = request.sortBy || "name";
    const sortOrder = request.sortOrder || "asc";

    const filters = query
      ? { name: { contains: query, mode: "insensitive" } }
      : undefined;

    const categories = await prismaClient.category.findMany({
      where: filters,
      skip: offset,
      take: limitNumber,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        books: true,
      },
    });

    const totalCategories = await prismaClient.category.count({
      where: filters,
    });

    return {
      data: categories,
      pagination: {
        page: pageNumber,
        total_page: Math.ceil(totalCategories / limitNumber),
        total_categories: totalCategories,
      },
    };
  };

  const createCategory = async (request, image) => {
    request = validate(createCategoryValidation, request);

    let imageUrl = null;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image.path, {
        folder: "sip-category",
      });
      imageUrl = uploadResponse.secure_url;
      await fs.promises.unlink(image.path);
    }

    const newCategory = await prismaClient.category.create({
      data: {
        name: request.name,
        image: imageUrl
      },
    });
    return newCategory;
  }

  const updateCategory = async (categoryId, request, image, ) => {
    request = validate(updateCategoryValidation, request);

    const existingCategory = await prismaClient.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!existingCategory) {
      throw new ResponseError(404, "Kategori tidak ditemukan");
    }

    let imageUrl = existingCategory.image;
    if (image) {
      if (existingCategory.image) {
        const publicId = existingCategory.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`sip-category/${publicId}`);
      }

      const uploadResponse = await cloudinary.uploader.upload(image.path, {
        folder: "sip-category",
      });
      imageUrl = uploadResponse.secure_url;

      await fs.promises.unlink(image.path);
    }

    const updatedCategory = await prismaClient.category.update({
      where: {
        id: categoryId,
      },
      data: { image: imageUrl, ...request },
    });

    return updatedCategory;
  };

    const searchCategory = async (keyword) => {
      const categories = await prismaClient.category.findMany();
      const lowerKeyword = keyword.toLowerCase();

      const matchedCategories = categories.filter((category) =>
        kmpSearch(category.name.toLowerCase(), lowerKeyword)
      );

      if (matchedCategories.length === 0) {
        throw new Error("Kategori tidak ditemukan");
      }

      return matchedCategories;
    };

  const deleteCategory = async (categoryId) => {
    const category = await prismaClient.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      throw new ResponseError(404, "Kategori tidak ditemukan");
    }

    if (category.image) {
      const publicId = category.image.split("/").pop().split(".")[0]; 
      if (publicId) {
        await cloudinary.uploader.destroy(`sip-category/${publicId}`);
      }
    }

    return prismaClient.category.delete({
      where: {
        id: categoryId,
      },
    });
  };

  export default {
    getAllCategory,
    createCategory,
    updateCategory,
    searchCategory,
    deleteCategory,
  };
