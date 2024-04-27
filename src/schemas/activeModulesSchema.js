
import { Schema } from "mongoose";

const activeModulesSchema = new Schema({
  providers: {
    type: Boolean,
    default: false
  },
  buy: {
    type: Boolean,
    default: false
  },
  expenses: {
    type: Boolean,
    default: false
  },
  payroll: {
    type: Boolean,
    default: false
  },
  recipes: {
    type: Boolean,
    default: false
  },
  reports: {
    type: Boolean,
    default: false
  },
})

export default activeModulesSchema