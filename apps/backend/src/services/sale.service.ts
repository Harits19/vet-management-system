import { Sale, SaleDB } from "src/models/sale.model";
import { SaleCreateRequest } from "../../../shared/types/sale.type";
import { Types } from "mongoose";





const populateEmailCashier = async () => {

    const sale = await SaleDB.find()
        .populate("cashier.userId", "email").lean();

    console.log('sale email', JSON.stringify(sale, null, 2))
}


export async function getNewReceiptNumber() {
    const lastData = await SaleDB.findOne().sort({ timestamp: -1 });
    const prefix = 'SR';

    if (!lastData) {
        return `${prefix}1`
    }


    const lastNumber = parseInt(lastData.receiptNumber.replace('SR', ''), 10);
    const nextCode = `${prefix}${lastNumber + 1}`;
    return nextCode;
}


export default {
    populateEmailCashier
}