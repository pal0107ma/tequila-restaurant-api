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
import addInventoryEntry from './resolvers/inventory-entries/addInventoryEntry.js'
import addProductCategory from './resolvers/product-categories/addProductCategory.js'
import deleteProductCategory from './resolvers/product-categories/deleteProductCategory.js'
import productCategories from './resolvers/product-categories/productCategories.js'
import deleteProduct from './resolvers/products/deleteProduct.js'
import inventoryEntries from './resolvers/inventory-entries/inventoryEntries.js'
import inventoryEntry from './resolvers/inventory-entries/inventoryEntry.js'
import deleteInventoryEntry from './resolvers/inventory-entries/deleteInventoryEntry.js'
import addProvider from './resolvers/providers/addProvider.js'
import provider from './resolvers/providers/provider.js'
import updateProvider from './resolvers/providers/updateProvider.js'
import deleteProvider from './resolvers/providers/deleteProvider.js'
import providers from './resolvers/providers/providers.js'
import addRecipeCategory from './resolvers/recipes-categories /addRecipeCategory.js'
import recipeCategories from './resolvers/recipes-categories /recipeCategories.js'
import deleteRecipeCategory from './resolvers/recipes-categories /deleteRecipeCategory.js'
import addRecipe from './resolvers/recipes/addRecipe.js'
import recipes from './resolvers/recipes/recipes.js'
import recipe from './resolvers/recipes/recipe.js'
import updateRecipe from './resolvers/recipes/updateRecipe.js'
import deleteRecipe from './resolvers/recipes/deleteRecipe.js'
import addRecipeItem from './resolvers/recipe-items/addRecipeItem.js'
import deleteRecipeItem from './resolvers/recipe-items/deleteRecipeItem.js'
import updateRecipeItem from './resolvers/recipe-items/updateRecipeItem.js'
import addOrderItem from './resolvers/orders/addOrderItem.js'
import addOrder from './resolvers/orders/addOrder.js'
import deleteOrder from './resolvers/orders/deleteOrder.js'
import orders from './resolvers/orders/orders.js'
import order from './resolvers/orders/order.js'
import deleteOrderItem from './resolvers/orders/deleteOrderItem.js'
import updateOrderItem from './resolvers/orders/updateOrderItem.js'

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
  InventoryEntry: {
    id: (parent) => parent.id ?? parent._id,
    productId:(parent) => parent.productId?._id??parent.productId,
    available: ({totalUnits, outs}) => totalUnits - outs.reduce((acc, n) =>  acc + n, 0)
  },
  ProductCategory: {
    id: (parent) => parent.id ?? parent._id
  },
  RecipeCategory: {
    id: (parent) => parent.id ?? parent._id
  },
  Recipe: {
    id: (parent) => parent.id ?? parent._id
  },
  RecipeItem: {
    id: (parent) => parent.id ?? parent._id
  },
  Order: {
    id: (parent) => parent.id ?? parent._id,
    totalPrice: (parent) => parent.items.reduce((acc,{totalPrice })=> totalPrice + acc,0),
  },
  OrderItem: {
    id: (parent) => parent.id ?? parent._id,
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
    inventoryEntries, 
    inventoryEntry, 
    provider, 
    providers,
    recipeCategories,
    recipes,
    recipe,
    order,
    orders
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
    addInventoryEntry,
    addProductCategory,
    deleteProductCategory, 
    deleteProduct,
    deleteInventoryEntry,
    addProvider,
    deleteProvider,
    updateProvider,
    addRecipeCategory,
    deleteRecipeCategory,
    addRecipe,
    updateRecipe, 
    deleteRecipe,
    addRecipeItem,
    deleteRecipeItem,
    updateRecipeItem,
    addOrderItem,
    addOrder,
    deleteOrder,
    deleteOrderItem,
    updateOrderItem,
  }
}

export default resolvers
