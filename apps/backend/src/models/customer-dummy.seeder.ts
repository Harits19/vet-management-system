import mongoose from "mongoose";
import { CustomerModel } from "../models/customer.model";
import { PetModel } from "../models/pet.model";
import { MedicalHistoryModel } from "../models/pet.medical.history.model";
import { UserModel, UserRole } from "../models/user.model";
import ENV from "src/config/env.config";

export const seedDummyCustomerData = async () => {
    if (!ENV.ENABLE_SEED) return;
    try {
        // 1. Cari atau Buat Dokter (User) karena Medical History butuh doctorId
        let doctor = await UserModel.findOne({ role: UserRole.DOCTOR });
        if (!doctor) {
            doctor = await UserModel.create({
                name: "drh. Siti Aminah",
                username: "drh_siti",
                email: "siti@vet.com",
                password: "password123", // Harusnya di-hash pada sistem asli
                role: UserRole.DOCTOR,
                is_active: true,
            });
        }

        // 2. Buat Data Customer (Owner)
        const customer = await CustomerModel.create({
            name: "Budi Santoso",
            whatsapp: "081234567890",
            address: "Jl. Melati No. 12, Jakarta Selatan",
        });

        console.log(`✅ Customer created: ${customer.name}`);

        // 3. Buat Data Pet yang terhubung ke Customer tersebut
        const pet = await PetModel.create({
            name: "Luna",
            kind: "Kucing (Persia)",
            gender: "female",
            notes: "Sangat manja, alergi makanan laut",
            ownerId: customer._id,
        });

        console.log(`✅ Pet created: ${pet.name} (Owner: ${customer.name})`);

        // 4. Buat Riwayat Medis (Medical History) untuk Pet tersebut
        const medicalHistory = await MedicalHistoryModel.create({
            petId: pet._id,
            doctorId: doctor._id,
            visitDate: new Date(),
            diagnosis: "Flu Ringan dan Nafsu Makan Menurun",
            treatment: "Pemberian vitamin booster dan obat flu cair",
            notes: "Diminta kontrol kembali jika dalam 3 hari tidak ada perubahan",
        });

        console.log(`✅ Medical History created for ${pet.name}`);

        return {
            customer,
            pet,
            medicalHistory,
            doctor
        };
    } catch (error) {
        console.error("❌ Error seeding dummy data:", error);
        throw error;
    }
};

