import Joi from 'joi'
import mongoose from 'mongoose'

export default Joi.string().custom((value, helper) => {
  const isValid = mongoose.isValidObjectId(value)

  if (!isValid) return helper.message('"id" argument must be a valid MongoId')

  return value
}).messages({
  'string.base': '"id" argument must be a valid MongoId',
  'string.empty': '"id" argument must be a valid MongoId',
  'string.min': '"id" argument must be a valid MongoId',
  'any.required': '"id" argument must be a valid MongoId'
})
