import userProfile from './resolvers/users/userProfile.js'
import updateUser from './resolvers/users/updateUser.js'
import addRestaurant from './resolvers/restaurants/addRestaurant.js'
import restaurant from './resolvers/restaurants/restaurant.js'
import restaurants from './resolvers/restaurants/restaurants.js'
import updateRestaurant from './resolvers/restaurants/updateRestaurant.js'
import deleteRestaurant from './resolvers/restaurants/deleteRestaurant.js'
import addBranchOffice from './resolvers/branch-offices/addBranchOffice.js'
import deleteBranchOffice from './resolvers/branch-offices/deleteBranchOffice.js'
import userAssociated from './resolvers/users/userAssociated.js'
import branchOffice from './resolvers/branch-offices/branchOffice.js'
import branchOffices from './resolvers/branch-offices/branchOffices.js'
import updateBranchOffice from './resolvers/branch-offices/updateBranchOffice.js'
import addBranchInvite from './resolvers/branch-invite/addBranchInvite.js'
import deleteBranchAccess from './resolvers/branch-accesses/deleteBranchAccess.js'
import updateBranchAccess from './resolvers/branch-accesses/updateBranchAccess.js'
import addProduct from './resolvers/products/addProduct.js'
import products from './resolvers/products/products.js'
import product from './resolvers/products/product.js'
import updateProduct from './resolvers/products/updateProduct.js'
import addInventoryIn from './resolvers/inventory-in/addInventoryIn.js'
import addProductCategory from './resolvers/product-categories/addProductCategory.js'
import deleteProductCategory from './resolvers/product-categories/deleteProductCategory.js'
import productCategories from './resolvers/product-categories/productCategories.js'
import deleteProduct from './resolvers/products/deleteProduct.js'
import inventory from './resolvers/inventory-in/inventory.js'
import inventoryIn from './resolvers/inventory-in/inventoryIn.js'
import deleteInventoryIn from './resolvers/inventory-in/deleteInventoryIn.js'
import addProvider from './resolvers/providers/addProvider.js'
import provider from './resolvers/providers/provider.js'
import updateProvider from './resolvers/providers/updateProvider.js'
import deleteProvider from './resolvers/providers/deleteProvider.js'
import providers from './resolvers/providers/providers.js'

const resolvers = {
  User: {
    id: (parent) => parent.id ?? parent._id,
    associated: userAssociated
  },
  Restaurant: {
    id: (parent) => parent.id ?? parent._id,
  },
  BranchOffice: {
    id: (parent) => parent.id ?? parent._id,
    user: (parent, {id}) => parent.users.find((obj) => obj.id === id)
  },
  Affiliate: {
    id: (parent) => parent.id ?? parent._id,
    user: (parent) => parent.userId
  },
  AffiliateUser: {
    id: (parent) => parent.id ?? parent._id
  },
  BrachAccess: {
    id: (parent) => parent.id ?? parent._id
  },
  UserSubscription: {
    id: (parent) => parent.id ?? parent._id
  },
  Subscription: {
    id: (parent) => parent.id ?? parent._id
  },
  Product: {
    id: (parent) => parent.id ?? parent._id
  },
  Provider: {
    id: (parent) => parent.id ?? parent._id
  },
  InventoryIn: {
    id: (parent) => parent.id ?? parent._id,
    productId: (parent)=> parent.productId._id ?? parent.productId,
    measureUnit: (parent)=> parent.productId.measureUnit ,
    available: ({total, outs}) => total - outs.reduce((acc, n) =>  acc + n, 0)
  },
  ProductCategory: {
    id: (parent) => parent.id ?? parent._id
  },
  Query: {
    userProfile,
    restaurant,
    restaurants,
    branchOffices,
    branchOffice, 
    products, 
    product,
    productCategories, 
    inventory, 
    inventoryIn, 
    provider, 
    providers,
  },
  Mutation: {
    updateUser,
    addRestaurant,
    updateRestaurant,
    deleteRestaurant,
    addBranchOffice,
    deleteBranchOffice,
    updateBranchOffice,
    addBranchInvite,
    deleteBranchAccess,
    updateBranchAccess,
    addProduct,
    updateProduct, 
    addInventoryIn,
    addProductCategory,
    deleteProductCategory, 
    deleteProduct,
    deleteInventoryIn,
    addProvider,
    deleteProvider,
    updateProvider
  }
}

export default resolvers
