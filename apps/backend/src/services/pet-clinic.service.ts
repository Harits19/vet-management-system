import { Types } from "mongoose";
import { PetClinicInventory } from "../models/pet-clinic.model";
import { IProductDoc, ProductModel } from "../models/product.model";
import { readExcelFile } from "./excel.service";

const example = {
    "id": 1529,
    "name": "Amoxicillin",
    "category": "Antibiotik",
    "stock": 0,
    "unit": "box",
    "price": 75000,
    "expiry_date": "2026-12-28T16:59:48.000Z",
    "supplier": "PT. Vet Pharma",
    "branch_id": 77,
    "created_at": "2025-12-29T10:32:36.000Z",
    "updated_at": "2026-01-17T00:47:19.000Z",
    "deleted_at": "2026-01-17T00:47:19.000Z"
}

class PetClinicService {

    async syncInventory(file: Buffer): Promise<IProductDoc[]> {
        const data = readExcelFile<PetClinicInventory>(file);

        const inventories = data.map((item) => ({
            _id: new Types.ObjectId(),
            category: item.category,
            createdAt: item.created_at,
            inventory: { quantity: item.stock },
            isActive: !item.deleted_at,
            pricing: { selling: item.price },
            product: { name: item.name, petClinicId: item.id.toString(), supplier: item.supplier, },
            updatedAt: item.updated_at,
            productType: 'medicine',
            syncAt: new Date(),
            unit: item.unit,
        } as IProductDoc));

        await ProductModel.bulkWrite(
            inventories.map((item) => ({
                updateOne: {
                    filter: { 'product.petClinicId': item.product.petClinicId },
                    update: {
                        $set: item,
                    },
                    upsert: true,
                },
            }))
        );

        return inventories;
    }

}


export const petClinicService = new PetClinicService();