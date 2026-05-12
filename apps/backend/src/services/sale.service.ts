import { SaleModel } from "src/models/sale.model";




const populateEmailCashier = async () => {

    const sale = await SaleModel.find()
        .populate("cashier.userId", "email").lean();

    console.log('sale email', JSON.stringify(sale, null, 2))
}



export default {
    populateEmailCashier
}