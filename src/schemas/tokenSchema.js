import { Schema } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

const tokenSchema = new Schema(
  {
    t: {
      type: String,
      default: uuidv4(),
      trim: true
    },
    exp: {
      type: Number,
      default: null
    },
    iat: {
      type: Number,
      default: null
    },
    type: {
      type: String,
      enum: ['JWT', 'FORGOT-PASS', 'CONFIRM-ACCOUNT'],
      default: 'CONFIRM-ACCOUNT'
    }
  },
  {
    versionKey: false
  }
)

export default tokenSchema
