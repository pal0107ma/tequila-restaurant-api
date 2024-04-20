import {Schema} from 'mongoose'

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

},{
  timestamps:true,
  versionKey: false
})

export default branchOfficeSchema