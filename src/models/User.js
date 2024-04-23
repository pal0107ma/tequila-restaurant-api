import { Schema, model } from 'mongoose'

import tokenSchema from '../schemas/tokenSchema.js'

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
    username: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true
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
    role: {
      type: String,
      enum: ['SUPER-ADMIN', 'ADMIN'],
      default: 'ADMIN',
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
)

export default model('User', userSchema)
