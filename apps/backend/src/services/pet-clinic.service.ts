import mongoose, { Types } from "mongoose";
import type { PetClinicInventoryModel, PetClinicMedicalHistoryModel, PetClinicPatientModel, PetClinicServiceModel } from "../models/pet-clinic.model.js";
import { ProductModel, type IProductDoc } from "../models/product.model.js";
import { readExcelFile } from "./excel.service.js";
import { IServiceDoc, ServiceModel } from "../models/service.model.js";
import { IPetDoc, PetModel } from "../models/pet.model.js";
import { IMedicalHistoryDoc } from "../models/medical-history.model.js";

class PetClinicService {

    async syncInventory(file: Buffer): Promise<IProductDoc[]> {
        const data = readExcelFile<PetClinicInventoryModel>(file);
        if (data.length === 0) return [];

        const inventories = data.map((item) => ({
            _id: new Types.ObjectId(),
            category: item.category,
            createdAt: item.created_at,
            inventory: { quantity: item.stock },
            isActive: !item.deleted_at,
            pricing: { selling: item.price },
            product: {
                name: item.name,
                petClinicId: item.id.toString(),
                supplier: item.supplier,
            },
            updatedAt: item.updated_at,
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

    async syncService(file: Buffer): Promise<IServiceDoc[]> {
        const data = readExcelFile<PetClinicServiceModel>(file);
        if (data.length === 0) return [];

        const services = data.map((item) => ({
            _id: new mongoose.Types.ObjectId(),
            petClinicId: item.id.toString(),
            syncAt: new Date(),
            createdAt: item.created_at,
            isActive: item.is_active === 1,
            name: item.name,
            price: item.price,
            updatedAt: item.updated_at,
            description: item.description,
        } as IServiceDoc))

        await ServiceModel.bulkWrite(
            services.map(({ _id, ...rest }) => ({
                updateOne: {
                    filter: { "petClinicId": rest.petClinicId },
                    update: { $set: rest, $setOnInsert: { _id } },
                    upsert: true,
                },
            }))
        );

        return services;

    }

    async syncPatient(file: Buffer): Promise<IPetDoc[]> {
        const data = readExcelFile<PetClinicPatientModel>(file);
        if (data.length === 0) return [];

        const services = data.map((item) => ({
            _id: new mongoose.Types.ObjectId(),
        } as IPetDoc))

        // await PetModel.bulkWrite(
        //     services.map(({ _id, ...rest }) => ({
        //         updateOne: {
        //             filter: { "petClinicId": rest.petClinicId },
        //             update: { $set: rest, $setOnInsert: { _id } },
        //             upsert: true,
        //         },
        //     }))
        // );

        return services;

    }

    async syncMedicalHistory(file: Buffer): Promise<IMedicalHistoryDoc[]> {
        const data = readExcelFile<PetClinicMedicalHistoryModel>(file);
        if (data.length === 0) return [];

        const services = data.map((item) => ({
            _id: new mongoose.Types.ObjectId(),
        } as IMedicalHistoryDoc))

        // await PetModel.bulkWrite(
        //     services.map(({ _id, ...rest }) => ({
        //         updateOne: {
        //             filter: { "petClinicId": rest.petClinicId },
        //             update: { $set: rest, $setOnInsert: { _id } },
        //             upsert: true,
        //         },
        //     }))
        // );

        return services;
    }
}

export const petClinicService = new PetClinicService();
