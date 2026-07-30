export { login, logout, me } from "./auth.controller.js";
export { getAll as getCustomers, getOne as getCustomer, create as createCustomer, update as updateCustomer, remove as deleteCustomer } from "./customer.controller.js";
export { getAll as getPets, getOne as getPet, create as createPet, update as updatePet, remove as deletePet, getByCustomer } from "./pet.controller.js";
export { getAll as getProducts, getServices, getPhysical, getOne as getProduct, create as createProduct, update as updateProduct, remove as deleteProduct, searchByCode } from "./product.controller.js";
export { getAll as getMedicalHistories, getOne as getMedicalHistory, create as createMedicalHistory, update as updateMedicalHistory, remove as deleteMedicalHistory, getByPet } from "./medical-history.controller.js";
export {
  createShop, createVet, createFromMedicalHistory,
  getAll as getTransactions, getOne as getTransaction, remove as deleteTransaction,
  dashboard, doctorDashboard,
} from "./transaction.controller.js";
