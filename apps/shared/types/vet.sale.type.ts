import { custom, z } from 'zod';
import { Types } from "mongoose";
import { generateSortFilterSchema } from './pagination';
import { NestedKeys } from './common.type';
import { objectId } from './zod';

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
        cost: z.number().min(0),
        paid: z.number().min(0),
    })
})

export interface IVetSale extends z.infer<typeof vetSaleSchema> { }


export const vetSaleCreateSchema = z.object({
    customer: z.object({
        id: objectId,
        name: z.string().min(1),
    }),
    paid: z.number().min(0),
    items: z.array(z.object({
        id: objectId,
        quantity: z.number().min(1),
    })).min(1),

});


export interface IVetSaleCreate extends z.infer<typeof vetSaleCreateSchema> { }

type VetSaleKey = NestedKeys<IVetSale>;

export const vetSaleSortByList: VetSaleKey[] = [
    '_id',
    'createdAt',
    'updatedAt',
    'summary.profit',
    'summary.total',
    'summary.cost',
    'cashier.name',

] as const;

export const vetSaleFilterSchema = generateSortFilterSchema({
    sortList: vetSaleSortByList,
    defaultSort: "createdAt",
});

export interface VetSaleFilter extends z.infer<typeof vetSaleFilterSchema> { }

export interface VetSaleCreateFormRequest extends Omit<IVetSaleCreate, "items" | 'customer'> {
    customer: {
        id: string;
        name: string;
    },
    items: {
        id: string
        pricing: {
            selling: number;
        };
        quantity: number;
        product: {
            name: string;
        };
    }[];
}


