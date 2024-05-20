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
import branchOfficeUsers from './resolvers/branch-offices/branchOfficeUsers.js'
import branchOfficeUser from './resolvers/branch-offices/branchOfficeUser.js'
import addProduct from './resolvers/products/addProduct.js'
import products from './resolvers/products/products.js'
import product from './resolvers/products/product.js'
import updateProduct from './resolvers/products/updateProduct.js'

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
    users: branchOfficeUsers,
    user: branchOfficeUser
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
  Query: {
    userProfile,
    restaurant,
    restaurants,
    branchOffices,
    branchOffice, 
    products, 
    product
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
    updateProduct
  }
}

export default resolvers
