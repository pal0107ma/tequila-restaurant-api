import Joi from 'joi'

export default Joi.string().trim().pattern(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{7,15}$/).messages({
  'string.empty': '"password" argument is not allowed to be empty',
  'string.min': '"password" argument must have at least 8 characters',
  'object.regex': '"password" argument must have at least 8 characters, a special character, a number and an uppercase character',
  'string.pattern.base': '"password" argument must have at least 8 characters, a special character, a number and an uppercase character'
})
