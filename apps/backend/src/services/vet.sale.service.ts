import { VetSale, VetSaleDB } from "src/models/vet.sale.model";
import { IVetSaleCreate } from "../../../shared/types/vet.sale.type";
import mongoose, { Types } from "mongoose";
import { getAllProductDetail } from "./product.service";


class VetSaleService {


    async create({ sale, cashier }: {
        sale: IVetSaleCreate,
        cashier: {
            id: Types.ObjectId,
            name: string
        }
    }) {
        const productDetails = await getAllProductDetail(sale.items.map(item => item.id));
        const productDetailMap = new Map(productDetails.map(item => [item._id.toString(), item]));

        const newSale: VetSale = {
            _id: new mongoose.Types.ObjectId(),
            customer: {
                id: sale.customer.id,
                name: sale.customer.name,
            },
            cashier: {
                id: cashier.id,
                name: cashier.name,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            summary: {
                total: 0,
                profit: 0,
            },
            items: sale.items.map((item) => {

                const detail = productDetailMap.get(item.id.toString());
                if (!detail) {
                    throw new Error(`Product detail not found for id ${item.id}`)
                }
                const selling = detail.pricing.selling || 0;

                return {
                    pricing: {
                        cost: detail.pricing.cost || 0,
                        selling,
                        total: selling * item.quantity,
                    },
                    quantity: item.quantity,
                    product: {
                        id: item.id,
                        name: detail.product.name ?? '',
                    }

                }
            })
        }

        const result = await VetSaleDB.create(newSale);

        return result;


    }
}

export const vetSaleService = new VetSaleService();

