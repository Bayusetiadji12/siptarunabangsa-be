import Joi from "joi";

const getCategoryValidation = Joi.object({
  query: Joi.string().optional(),
  page: Joi.number().positive().min(1).default(1),
  limit: Joi.number().max(10).default(10),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().optional(),
});

const createCategoryValidation = Joi.object({
  name: Joi.string().max(100).required(),
});

const updateCategoryValidation = Joi.object({
  name: Joi.string().max(100).optional(),
});

export { 
    getCategoryValidation,
    createCategoryValidation,
    updateCategoryValidation
};
