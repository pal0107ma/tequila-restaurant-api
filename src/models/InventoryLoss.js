import { model, Schema } from "mongoose";

const inventoryLossSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'inventory_entry'
  },
  quantity: {
    type: Number,
    required: true
  },
  branchId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'branch_office'
  },
  cost: {
    type: Number,
    required: true
  }
},{
  versionKey: false,
  timestamps: true
})

const InventoryLoss = model('inventory_loss', inventoryLossSchema,'inventory_losses')

export default InventoryLoss