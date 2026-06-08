import { custom, z } from 'zod';
import { Types } from "mongoose";


// {
//   "_id": {
//     "$oid": "6a018bf5c9a9c4d2347689a5"
//   },
//   "externalId": "12248893",
//   "__v": 0,
//   "additional": {
//     "serviceCharge": 0,
//     "discount": 0,
//     "tax": 0,
//     "shipping": 0,
//     "rounding": 0
//   },
//   "cashier": {
//     "userId": {
//       "$oid": "6a02b6341f15b52a866a37a8"
//     },
//     "name": "Vivi Nurmala"
//   },
//   "createdAt": {
//     "$date": "2026-05-11T07:57:41.619Z"
//   },
//   "customer": null,
//   "items": [
//     {
//       "product": {
//         "id": "806799",
//         "name": "Cat Choize Kitten "
//       },
//       "quantity": 1,
//       "pricing": {
//         "selling": 26000,
//         "total": 26000,
//         "cost": 0
//       }
//     }
//   ],
//   "paymentMethod": "Cash",
//   "paymentStatus": "Lunas",
//   "pricing": {
//     "cost": 25000,
//     "profit": 1000,
//     "total": 26000,
//     "selling": 26000
//   },
//   "receiptNumber": "SR1260",
//   "summary": {
//     "total": 26000,
//     "downPayment": 0,
//     "debt": 0
//   },
//   "timestamp": {
//     "$date": "2026-05-11T06:49:00.000Z"
//   },
//   "updatedAt": {
//     "$date": "2026-05-12T05:36:18.835Z"
//   }
// }
const objectId = z
    .string().min(1)
    .refine(Types.ObjectId.isValid)
    .transform((id) => new Types.ObjectId(id));
export const vetSaleSchema = z.object({
    _id: objectId,
    cashier: z.object({
        id: objectId,
        name: z.string().min(1),
    }),
    createdAt: z.date(),
    updatedAt: z.date(),
    customer: z.object({
        id: z
            .string()
            .refine(Types.ObjectId.isValid)
            .transform((id) => new Types.ObjectId(id)),
        name: z.string().min(1),
    }),
    items: z.array(z.object({
        product: z.object({
            id: objectId,
            name: z.string().min(1),
        }),
        quantity: z.number().min(1),
        pricing: z.object({
            cost: z.number().min(0),
            selling: z.number().min(0),
            total: z.number().min(0),
        })
    })),
    summary: z.object({
        total: z.number().min(0),
        profit: z.number().min(0),
    })
})

export interface IVetSale extends z.infer<typeof vetSaleSchema> { }


export const vetSaleCreateSchema = z.object({
    customer: z.object({
        id: objectId,
        name: z.string().min(1),
    }),
    items: z.array(z.object({
        id: objectId,
        quantity: z.number().min(1),
    })).min(1),

})

export interface IVetSaleCreate extends z.infer<typeof vetSaleCreateSchema> { }