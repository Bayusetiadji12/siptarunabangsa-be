import Joi from "joi";

const getBorrowValidation = Joi.object({
  query: Joi.string().optional(),
  page: Joi.number().positive().min(1).default(1),
  limit: Joi.number().max(10).default(10),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().optional(),
});

const createBorrowValidation = Joi.object({
  user_id: Joi.string().required(),
  book_id: Joi.string().required(),
  dueDate: Joi.date()
    .greater("now")
    .required()
    .messages({
      "date.greater": `"dueDate" harus lebih dari tanggal hari ini`,
  }),
});

const returnBorrowValidation = Joi.object({
  returnDate: Joi.date()
    .less("now")
    .required()
    .messages({
      "date.less": `"returnDate" tidak boleh lebih dari hari ini (masa depan)`,
  }),
  status: Joi.string()
    .valid("DIKEMBALIKAN", "TERLAMBAT", "HILANG")
    .optional()
    .messages({
      "any.only": `"status" hanya boleh DIKEMBALIKAN, TERLAMBAT, atau HILANG`,
  }),
});

export { getBorrowValidation, createBorrowValidation, returnBorrowValidation };