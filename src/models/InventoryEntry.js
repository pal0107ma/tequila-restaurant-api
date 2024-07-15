import {Schema, model} from 'mongoose'

const inventoryInSchema = new Schema({
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
  totalUnits: {
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


const InventoryEntry = model('inventory_entry',inventoryInSchema,'inventory_entries')

export default InventoryEntry