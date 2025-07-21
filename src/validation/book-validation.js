import Joi from "joi";

const getBookValidation = Joi.object({
  page: Joi.number().positive().min(1).default(1),
  limit: Joi.number().max(12).default(12),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().optional(),
});

const createBookValidation = Joi.object({
  code: Joi.string().max(50).optional(),
  title: Joi.string().max(200).required(),
  author: Joi.string().max(100).required(),
  publisher: Joi.string().max(100).allow("").optional(),
  year: Joi.number().integer().min(1000).max(9999).optional(),
  location: Joi.string().max(20).optional(),
  description: Joi.string().allow("").optional(),
  isbn: Joi.string().max(100).allow("").optional(),
  status: Joi.string().valid("TERSEDIA", "DIPINJAM").allow("").optional(),
  stock: Joi.number().integer().min(0).optional(),  
  source: Joi.string().valid("PEMBELIAN", "SUMBANGAN").allow("").optional(),
});

const updateBookValidation = Joi.object({
  code: Joi.string().max(50).optional(),
  title: Joi.string().max(200).required(),
  author: Joi.string().max(100).required(),
  publisher: Joi.string().max(100).allow("").optional(),
  year: Joi.number().integer().min(1000).max(9999).optional(),
  location: Joi.string().max(20).optional(),
  description: Joi.string().allow("").optional(),
  isbn: Joi.string().max(100).allow("").optional(),
  status: Joi.string().valid("TERSEDIA", "DIPINJAM").allow("").optional(),
  stock: Joi.number().integer().min(0).optional(),  
  source: Joi.string().valid("PEMBELIAN", "SUMBANGAN").allow("").optional(),
});

export { getBookValidation, createBookValidation, updateBookValidation };
