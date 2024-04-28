import {Schema, model} from 'mongoose'

const branchOfficeSchema = new Schema({
  restaurantId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Restaurant'
  },
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
  city: {
    type: String,
    trim: true,
    required: true
  },
  country: {
    type: String,
    trim: true,
    required: true
  },
  principal: {
    type: Boolean,
    default: false
  }
},{
  timestamps:true,
  versionKey: false
})

export default model('branch_office',branchOfficeSchema)