import mongoose, { Types } from "mongoose";
import type {
  PetClinicInventoryModel,
  PetClinicMedicalHistoryModel,
  PetClinicPatientModel,
  PetClinicServiceModel,
} from "../models/pet-clinic.model.js";
import { ProductModel, type IProductDoc } from "../models/product.model.js";
import { readExcelFile } from "./excel.service.js";
import { IServiceDoc, ServiceModel } from "../models/service.model.js";
import { IPetDoc, IPetDocInitialAge, PetModel } from "../models/pet.model.js";
import {
  IMedicalHistoryDoc,
  MedicalHistoryModel,
} from "../models/medical-history.model.js";
import { CustomerModel, ICustomerDoc } from "../models/customer.model.js";
import { UserModel } from "../models/user.model.js";

class PetClinicService {
  async syncInventory(file: Buffer): Promise<IProductDoc[]> {
    const data = readExcelFile<PetClinicInventoryModel>(file);
    if (data.length === 0) return [];

    const inventories = data.map(
      (item) =>
        ({
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
        }) as IProductDoc,
    );

    await ProductModel.bulkWrite(
      inventories.map(({ _id, ...rest }) => ({
        updateOne: {
          filter: { "product.petClinicId": rest.product.petClinicId },
          update: { $set: rest, $setOnInsert: { _id } },
          upsert: true,
        },
      })),
    );

    return inventories;
  }

  async syncService(file: Buffer): Promise<IServiceDoc[]> {
    const data = readExcelFile<PetClinicServiceModel>(file);
    if (data.length === 0) return [];

    const services = data.map(
      (item) =>
        ({
          _id: new mongoose.Types.ObjectId(),
          petClinicId: item.id.toString(),
          syncAt: new Date(),
          createdAt: item.created_at,
          isActive: item.is_active === 1,
          name: item.name,
          price: item.price,
          updatedAt: item.updated_at,
          description: item.description,
        }) as IServiceDoc,
    );

    await ServiceModel.bulkWrite(
      services.map(({ _id, ...rest }) => ({
        updateOne: {
          filter: { petClinicId: rest.petClinicId },
          update: { $set: rest, $setOnInsert: { _id } },
          upsert: true,
        },
      })),
    );

    return services;
  }

  parseAge(value?: string): IPetDocInitialAge | undefined {
    // TODO handle format ini
    // { undefined, '7 BULAN', '6 BULAN', '2 BULAN', '4 BULAN', '3 BULAN', '8 TAHUN', '2 TAHUN', '5 TAHUN', '1 TAHUN', '8 BULAN', '1 BULAN', '1,5 BULAN', 'Â± 1 Tahun', 'Â± 4 - 5 bulan', '4 Tahun', 'Â±3 TAHUN', '-', '2,5 BULAN', '5 Bulan', 'Â±4 Tahun', 'Tidak Diketahui', '2-3 TAHUN', '3 TAHUN', '1 THUN', '5 BULAN', '2-3 BULAN', '6 TAHUN', '4-5 BULAN', '5-6 BULAN', '1 TAHUN 3 BULAN', '9 TAHUN', '7-8 TAHUN', '6-7 BULAN', '2 MINGGU', '10 BULAN', '1 TAHUN 7 BULAN', '4 TAHUN', '7 TH', 'Â±2-3 TAHUN', '11 BULAN', 'Â±3 BULAN', 'Â± 3 BULAN', 'Â±3-4 BULAN', '9 BULAN', '1,5 TAHUN', '2-3 BULAN ', '6BULAN', '1 TH', '4,5 TAHUN', '6-7 TAHUN', '1 TAHUN 2 BULAN', '2 - 3 TAHUN', '3-4 BULAN', '4-6 BULAN', '8 BULAN-1 TAHUN', '- 1 TAHUN', '3,5 TAHUN', '10 TAHUN', '15 BULAN', '13 BULAN', '2,5 TAHUN', '1TAHUN', '2 MINGGU ', '4-5 TAHUN', '1-2 BULAN', '1 TAHUN 5 BULAN', '3 MINGGU', 'Â± 1 tahun', '7-8 BULAN', '?', '14 TAHUN', '2 TAHUN 3 BULAN', ' 2 TAHUN', '12 TAHUN', '4-5 MINGGU', '5 HARI' }

    return undefined;
  }

  async syncPatient(file: Buffer): Promise<IPetDoc[]> {
    const data = readExcelFile<PetClinicPatientModel>(file);
    const patients: IPetDoc[] = [];
    if (data.length === 0) return patients;

    const owners: Record<string, ICustomerDoc> = {};

    for (const patient of data) {
      if (patient.deleted_at) {
        continue;
      }
      const ownerName = patient.owner_name;
      const ownerFromDB = await CustomerModel.findOne({
        fromPetClinic: true,
        name: ownerName,
      });
      const owner = ownerFromDB || owners[ownerName];
      if (!owner) {
        owners[ownerName] = {
          _id: new mongoose.Types.ObjectId(),
          createdAt: new Date(),
          name: ownerName,
          updatedAt: new Date(),
          address: patient.address,
          whatsapp: patient.owner_phone?.toString(),
          fromPetClinic: true,
          syncAt: new Date(),
        };
      }

      patients.push({
        _id: new mongoose.Types.ObjectId(),
        createdAt: patient.created_at,
        customerId: owners[ownerName]._id,
        gender: patient.gender,
        kind: patient.species,
        name: patient.name,
        petClinicId: patient.id.toString(),
        notes: patient.notes,
        updatedAt: new Date(),
        initialAge: petClinicService.parseAge(patient.age),
        breed: patient.breed,
        furColor: patient.fur_color,
        code: patient.code,
        syncAt: new Date(),
      });
    }
    await CustomerModel.bulkWrite(
      Object.values(owners).map(({ _id, ...rest }) => ({
        updateOne: {
          filter: { name: rest.name, fromPetClinic: true },
          update: { $set: rest, $setOnInsert: { _id } },
          upsert: true,
        },
      })),
    );

    await PetModel.bulkWrite(
      patients.map(({ _id, ...rest }) => ({
        updateOne: {
          filter: { petClinicId: rest.petClinicId },
          update: { $set: rest, $setOnInsert: { _id } },
          upsert: true,
        },
      })),
    );

    return patients;
  }

  async syncMedicalHistory(file: Buffer): Promise<IMedicalHistoryDoc[]> {
    const data = readExcelFile<PetClinicMedicalHistoryModel>(file);
    if (data.length === 0) return [];

    const medicalHistories: IMedicalHistoryDoc[] = [];
    const doctor = await UserModel.findOne({ role: "doctor" }).lean();

    if (!doctor) {
      throw new Error(`Not found role doctor in database`);
    }

    for (const history of data) {
      
      const pet = await PetModel.findOne({
        petClinicId: history.patient_id.toString(),
      }).lean();

      if (!pet) {
        console.warn(`Pet not found with petClinicId ${history.patient_id}`);
        continue;
      }

      medicalHistories.push({
        _id: new mongoose.Types.ObjectId(),
        petClinicId: history.id.toString(),
        petId: pet?._id,
        visitDate: history.date!,
        diagnosis: history.diagnosis!,
        soap: {
          objective: { physicalExam: [] },
          subjective: { complaint: history.anamnesa!, },
          assessment: {
            physicalExamNote: history.physical_check!,
            differentialDiagnosis: history.diagnosis!,
          },
          plan: {
            treatmentPlan: history.treatment!,
            doctorNotes: history.notes!,
          },
        },
        doctorId: doctor?._id,
        createdAt: history.created_at,
        updatedAt: history.updated_at!,
        goods: [],
        prescriptions: [],
        treatments: [],
        syncAt: new Date(),
      });
    }

    await MedicalHistoryModel.bulkWrite(
      medicalHistories.map(({ _id, ...rest }) => ({
        updateOne: {
          filter: { petClinicId: rest.petClinicId },
          update: { $set: rest, $setOnInsert: { _id } },
          upsert: true,
        },
      })),
    );

    return medicalHistories;
  }
}

export const petClinicService = new PetClinicService();
