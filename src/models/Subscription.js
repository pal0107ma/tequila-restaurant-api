

import { Schema, model } from 'mongoose'
import modulesLimitSchema from '../schemas/modulesLimitSchema.js'

const subscriptionSchema = new Schema({
  subscriptionPrice: {
    type: Number,
    required: true
  },
  subscriptionDescription: {
    type: String,
    required: true
  },
  subscriptionName: {
    type: String,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  modulesLimit: {
    type: modulesLimitSchema
  }
})

const Subscription = model('subscription',subscriptionSchema)

export default Subscription