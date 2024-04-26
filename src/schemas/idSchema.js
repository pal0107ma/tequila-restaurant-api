import Joi from 'joi'
import mongoose from 'mongoose'

export default Joi.string().custom((value, helper) => {
  const isValid = mongoose.isValidObjectId(value)

  if (!isValid) return helper.message(`"${helper.state.path.reduce((acc,value)=> {

    if(isNaN(value)) {
      if(!acc) return value

      return `${acc}.${value}`
    }

    return `${acc}[${value}]`
    
  }, '') ?? 'id'}" argument must be a valid MongoId`)

  return value
})