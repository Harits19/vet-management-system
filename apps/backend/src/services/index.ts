export { loginUser, seedDefaultUsers } from "./auth.service.js";
export { listCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from "./customer.service.js";
export { listPets, getPet, createPet, updatePet, deletePet, searchCustomerPets } from "./pet.service.js";
export { listProducts, getProduct, createProduct, updateProduct, deleteProduct, searchProductsByCode } from "./product.service.js";
export { createSale, listSales, getSale, deleteSale, getDashboardSummary } from "./sale.service.js";
export {
  listMedicalHistories,
  getMedicalHistory,
  createMedicalHistory,
  updateMedicalHistory,
  deleteMedicalHistory,
  getMedicalHistorySummary,
} from "./medical-history.service.js";
export {
  createVetSale,
  createVetSaleFromMedicalHistory,
  listVetSales,
  getVetSale,
  deleteVetSale,
  getDoctorDashboard,
} from "./vet-sale.service.js";
