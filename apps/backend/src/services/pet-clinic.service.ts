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

    await ProductModel.collection.bulkWrite(
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

    await ServiceModel.collection.bulkWrite(
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
    if (!value) return undefined;

    // Normalisasi: uppercase, ± dihapus, koma desimal → titik, spasi rapi
    let s = value
      .toUpperCase()
      .replace(/[Â±]/g, " ")
      .replace(/,/g, ".")
      .replace(/\s+/g, " ")
      .trim();
    if (!s) return undefined;

    // Varian satuan → baku
    s = s
      .replace(/\bTHN\b|\bTHUN\b|\bTH\b/g, "TAHUN")
      .replace(/\bBLN\b/g, "BULAN")
      .replace(/\bMGG\b|\bMG\b/g, "MINGGU");

    // Nilai yang tidak bisa diparse
    if (
      [
        "-",
        "?",
        "TIDAK DIKETAHUI",
        "TIDAK TAHU",
        "UNKNOWN",
        "N/A",
        "0",
      ].includes(s)
    ) {
      return undefined;
    }

    // "- 1 TAHUN" → strip dash leading
    s = s.replace(/^-\s*/, "");

    // Konversi satu bagian ("1 TAHUN 3 BULAN", "7 BULAN", "2 MINGGU") → total bulan
    // fallbackUnit dipakai saat bagian hanya angka tanpa satuan (mis. "2" di "2-3 TAHUN")
    const partToMonths = (
      part: string,
      fallbackUnit?: string,
    ): number | null => {
      const re = /(\d+(?:\.\d+)?)\s*(TAHUN|BULAN|MINGGU|HARI)/g;
      let m: RegExpExecArray | null;
      let total = 0;
      let found = false;
      while ((m = re.exec(part))) {
        found = true;
        const n = parseFloat(m[1]);
        const unit = m[2];
        if (unit === "TAHUN") total += n * 12;
        else if (unit === "BULAN") total += n;
        else if (unit === "MINGGU") total += n / 4;
        else if (unit === "HARI") total += n / 30;
      }
      // Bagian angka tanpa satuan (sisi kiri range) → pakai satuan sisi kanan
      if (!found && fallbackUnit) {
        const numMatch = part.match(/(\d+(?:\.\d+)?)/);
        if (numMatch) {
          found = true;
          const n = parseFloat(numMatch[1]);
          if (fallbackUnit === "TAHUN") total = n * 12;
          else if (fallbackUnit === "BULAN") total = n;
          else if (fallbackUnit === "MINGGU") total = n / 4;
          else if (fallbackUnit === "HARI") total = n / 30;
        }
      }
      return found ? total : null;
    };

    // Detect range: "2-3 TAHUN", "8 BULAN-1 TAHUN", "Â± 4 - 5 bulan", "4 - 5 BULAN"
    const rangeMatch = s.match(/^(.*?)\s*[-–]\s*(.+)$/);
    if (rangeMatch) {
      const unitOf = (part: string): string | undefined => {
        const u = part.match(/(TAHUN|BULAN|MINGGU|HARI)/);
        return u ? u[1] : undefined;
      };
      const unitA = unitOf(rangeMatch[1]);
      const unitB = unitOf(rangeMatch[2]);
      const fallback = unitA ?? unitB;
      const a = partToMonths(rangeMatch[1], fallback);
      const b = partToMonths(rangeMatch[2], fallback);
      if (a !== null && b !== null) {
        const low = Math.min(a, b);
        const high = Math.max(a, b);
        // Keduanya kelipatan 12 → simpan dalam tahun (lebih natural)
        if (low % 12 === 0 && high % 12 === 0) {
          return { value: low / 12, unit: "year", range: high / 12 };
        }
        return {
          value: Math.round(low * 100) / 100,
          unit: "month",
          range: Math.round(high * 100) / 100,
        };
      }
      if (a !== null)
        return { value: Math.round(a * 100) / 100, unit: "month" };
      if (b !== null)
        return { value: Math.round(b * 100) / 100, unit: "month" };
      return undefined;
    }

    // Single value
    const months = partToMonths(s);
    if (months === null) return undefined;
    if (months % 12 === 0) {
      return { value: months / 12, unit: "year" };
    }
    return { value: Math.round(months * 100) / 100, unit: "month" };
  }

  async syncPatient(file: Buffer): Promise<IPetDoc[]> {
    const data = readExcelFile<PetClinicPatientModel>(file);
    const patients: IPetDoc[] = [];
    if (data.length === 0) return patients;

    const owners: Record<string, ICustomerDoc> = {};

    for (const patient of data) {
      // Baris dengan id tidak valid (bukan angka) = data sampah dari sumber — skip.
      if (!/^\d+$/.test(String(patient.id))) {
        continue;
      }
      const ownerName = patient.owner_name;

      let owner: ICustomerDoc = owners[ownerName];

      if (!owner) {
        const result = await CustomerModel.findOne({
          fromPetClinic: true,
          name: ownerName,
        }).lean();

        if (result) {
          owner = result;
          owners[ownerName] = result;
        }
      }

      if (!owner) {
        owner = owners[ownerName] = {
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
        customerId: owner._id,
        gender: patient.gender,
        kind: patient.species,
        name: patient.name,
        petClinicId: patient.id.toString(),
        isActive: !patient.deleted_at,
        notes: patient.notes,
        updatedAt: new Date(),
        initialAge: petClinicService.parseAge(patient.age),
        breed: patient.breed,
        furColor: patient.fur_color,
        code: patient.code,
        syncAt: new Date(),
      });
    }

    await CustomerModel.collection.bulkWrite(
      Object.values(owners).map(({ _id, ...rest }) => ({
        updateOne: {
          filter: { name: rest.name, fromPetClinic: true },
          update: { $set: rest, $setOnInsert: { _id } },
          upsert: true,
        },
      })),
    );

    const debugId = "7881";

    await PetModel.collection.bulkWrite(
      patients.map(({ _id, ...rest }) => {
        if (rest.petClinicId === debugId) {
          console.log("updateData", JSON.stringify(rest));
        }
        return {
          updateOne: {
            filter: { petClinicId: rest.petClinicId },
            update: { $set: rest, $setOnInsert: { _id } },
            upsert: true,
          },
        };
      }),
    );

    const result = await PetModel.findOne({ petClinicId: debugId }).lean();

    console.log("result update", JSON.stringify(result));

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

      // Baris tanpa tanggal kunjungan (date/created_at kosong) tidak bisa disimpan
      // (visitDate required) — skip, jangan gagalkan seluruh sync.
      const visitDate = history.date ?? history.created_at;

      medicalHistories.push({
        _id: new mongoose.Types.ObjectId(),
        petClinicId: history.id.toString(),
        petId: pet?._id,
        visitDate,
        diagnosis: history.diagnosis || "Tanpa diagnosis",
        soap: {
          objective: { physicalExam: [] },
          subjective: { complaint: history.anamnesa || "" },
          assessment: {
            physicalExamNote: history.physical_check || "",
            differentialDiagnosis: history.diagnosis || "Tanpa diagnosis",
          },
          plan: {
            treatmentPlan: history.treatment || "",
            doctorNotes: history.notes || "",
          },
        },
        doctorId: doctor?._id,
        createdAt: history.created_at ?? visitDate,
        updatedAt: history.updated_at ?? visitDate,
        goods: [],
        prescriptions: [],
        treatments: [],
        syncAt: new Date(),
      });
    }

    await MedicalHistoryModel.collection.bulkWrite(
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
