import { Schema, model } from "mongoose";

const providerSchema = new Schema({
  name: {
    type: String,
    trim: true,
    required: true
  },
  phoneNr: {
    default: null,
    type: String,
    trim: true
  },
  email: {
    default: null,
    type: String,
    trim: true
  },
  desc: {
    type: String,
    trim: true,
    default: null
  },
  restaurantId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Restaurant'
  }
}, {
  timestamps: true,
  versionKey: false
})

const Provider = model('Provider', providerSchema)

export default Provider