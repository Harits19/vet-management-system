import { Types } from "mongoose";
import type { PetClinicInventory } from "../models/pet-clinic.model.js";
import { ProductModel, type IProductDoc } from "../models/product.model.js";
import { readExcelFile } from "./excel.service.js";

class PetClinicService {
    async syncInventory(file: Buffer): Promise<IProductDoc[]> {
        const data = readExcelFile<PetClinicInventory>(file);
        if (data.length === 0) return [];

        const inventories = data.map((item) => ({
            _id: new Types.ObjectId(),
            category: item.category,
            createdAt: item.created_at ? new Date(item.created_at) : new Date(),
            inventory: { quantity: item.stock },
            isActive: !item.deleted_at,
            pricing: { selling: item.price },
            product: {
                name: item.name,
                petClinicId: item.id.toString(),
                supplier: item.supplier,
            },
            updatedAt: item.updated_at ? new Date(item.updated_at) : new Date(),
            productType: "medicine",
            syncAt: new Date(),
            unit: item.unit,
        } as IProductDoc));

        await ProductModel.bulkWrite(
            inventories.map(({ _id, ...rest }) => ({
                updateOne: {
                    filter: { "product.petClinicId": rest.product.petClinicId },
                    update: { $set: rest, $setOnInsert: { _id } },
                    upsert: true,
                },
            }))
        );

        return inventories;
    }
}

export const petClinicService = new PetClinicService();
