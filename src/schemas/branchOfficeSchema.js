import {Schema} from 'mongoose'
import affiliateSchema from './affiliateSchema.js'

const branchOfficeSchema = new Schema({
  name: {
    type: String,
    trim: true,
    required: true
  },
  state: {
    type: String,
    trim: true,
    required: true
  },
  zip: {
    type: Number,
    required: true
  },
  address: {
    type: String,
    trim: true,
    required: true
  },
  state: {
    type: String,
    trim: true,
    required: true
  },
  zone: {
    type: String,
    trim: true,
    required: true
  },
  country: {
    type: String,
    trim: true,
    required: true
  },
  affiliates: {
    type: [affiliateSchema]
  }
},{
  timestamps:true,
  versionKey: false
})

export default branchOfficeSchema