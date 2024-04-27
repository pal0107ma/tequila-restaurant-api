import { Schema } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

const tokenSchema = new Schema(
  {
    t: {
      type: String,
      default: null,
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

tokenSchema.pre('save', function () {
  if (this.t === null) {
   this.t = uuidv4()
  }
})

export default tokenSchema
