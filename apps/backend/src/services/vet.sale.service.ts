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
        const productDetails = await getAllProductDetail(sale.items.map(item => item._id));
        const productDetailMap = new Map(productDetails.map(item => [item._id.toString(), item]));
        console.log('productDetailMap', productDetailMap)

        const items = sale.items.map((item) => {

            const detail = productDetailMap.get(item._id.toString());
            if (!detail) {
                throw new Error(`Product detail not found for id ${item._id}`)
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
                    _id: item._id,
                    name: detail.product.name ?? '',
                }

            }
        });

        const summary = items.reduce((prev, curr) => {

            return {
                total: prev.total + curr.pricing.total,
                profit: prev.profit + (curr.pricing.selling - curr.pricing.cost) * curr.quantity,
                cost: prev.cost + curr.pricing.cost * curr.quantity,
            }
        }, {
            total: 0,
            profit: 0,
            cost: 0,

        });

        console.log('items', items);
        console.log('summary', summary)

        const newSale: VetSale = {
            _id: new mongoose.Types.ObjectId(),
            customer: {
                _id: sale.customer._id,
                name: sale.customer.name,
            },
            cashier: {
                _id: cashier.id,
                name: cashier.name,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            summary: {
                ...summary,
                paid: sale.paid,
            },
            items,
        }

        console.log('newSale', newSale)


        const result = await VetSaleDB.create(newSale);

        return result;


    }
}

export const vetSaleService = new VetSaleService();

