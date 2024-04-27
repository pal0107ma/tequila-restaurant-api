import { Schema, model } from 'mongoose'

import tokenSchema from '../schemas/tokenSchema.js'
import branchAccessSchema from '../schemas/branchAccessSchema.js'
import userSubscriptionSchema from '../schemas/userSubscriptionSchema.js'

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true
    },
    password: {
      type: String,
      required: true,
      trim: true
    },
    accountConfirmed: {
      type: Boolean,
      default: false
    },
    tokens: {
      type: [tokenSchema]
    },
    lastName: {
      type: String,
      trim: true,
      required: true
    },
    firstName: {
      type: String,
      trim: true,
      required: true
    }, 
    userType: {
      type: String,
      enum: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYER'],
      default: 'ADMIN',
    },
    subscriptions: {
      type: [userSubscriptionSchema]
    },
    allowedBranches: {
      type: [branchAccessSchema]
    },
    phoneNr: {
      type: String,
      trim: true,
      default: null
    },
  },
  {
    timestamps: true,
    versionKey: false
  }
)

export default model('User', userSchema)
