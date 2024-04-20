import { Schema, model } from 'mongoose'

import branchOfficeSchema from '../schemas/branchOfficeSchema.js'

const restaurantSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true
    },
    plan: {
      type: String,
      enum: ['SILVER','GOLD','DIAMOND','STARTER'],
      required: true
    },
    status: {
      type: String,
      enum: ['CANCELLED','ACTIVE','SUSPENDED'],
      required: true
    },
    branchOffices: {
      type: [branchOfficeSchema]
    },
    userId: {
      type: Schema.Types.ObjectId,
      required:true,
      ref: 'User'
    },
  },
  {
    timestamps: true,
    versionKey: false
  }
)

export default model('Restaurant', restaurantSchema)