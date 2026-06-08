import { custom, z } from 'zod';
import { Types } from "mongoose";
import { generateSortFilterSchema } from './pagination';
import { NestedKeys } from './common.type';
import { numberRequired, objectId } from './zod';

export const vetSaleSchema = z.object({
    _id: objectId,
    cashier: z.object({
        _id: objectId,
        name: z.string().min(1),
    }),
    createdAt: z.date(),
    updatedAt: z.date(),
    customer: z.object({
        _id: objectId,
        name: z.string().min(1),
    }),
    items: z.array(z.object({
        product: z.object({
            _id: objectId,
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
        _id: objectId,
        name: z.string().min(1),
    }),
    paid: numberRequired,
    items: z.array(z.object({
        _id: objectId,
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
        _id: string;
        name: string;
    },
    paid: number;
    items: {
        _id: string
        pricing: {
            selling: number;
        };
        quantity: number;
        product: {
            name: string;
        };
    }[];
}


