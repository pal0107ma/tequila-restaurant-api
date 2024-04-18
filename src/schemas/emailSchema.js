import Joi from 'joi'

const schema = Joi.string().email({
  minDomainSegments: 2,
  tlds: { allow: ['com', 'net'] }
}).message({
  'string.base': '"email" argument must be a valid email',
  'string.empty': '"email" argument is not allowed to be empty',
  'any.required': '"email" argument is not allowed to be empty',
  'string.email': '"email" argument must be a valid email',
})
export default schema
