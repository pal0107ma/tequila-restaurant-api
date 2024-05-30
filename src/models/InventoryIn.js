import {Schema, model} from 'mongoose'

const merchandiseReceiptSchema = new Schema({
  quantity: {
    type: Number,
    required: true
  },
  purchasePrice: {
    type: Number,
    required: true
  },
  productId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'product'
  },
  unitCost: {
    type: Number,
    required: true
  },
  outs: {
    type: [Number]
  },
  total: {
    type: Number,
    required: true
  },
  branchId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'branch_office'
  }
}, {
  timestamps: true,
  versionKey: false
})

const InventoryIn = model('inventory_in',merchandiseReceiptSchema,'inventory')

export default InventoryIn