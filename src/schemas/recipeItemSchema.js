import {Schema} from 'mongoose'

const recipeItemSchema = new Schema({
    quantity:{
        type: Number,
        required: true,
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'products'
    }

})


export default recipeItemSchema