export interface PetClinicInventoryModel {
  id: number;
  name: string;
  category: string;
  stock: number;
  unit: string;
  price: number;
  expiry_date: Date;
  supplier: string;
  branch_id: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface PetClinicServiceModel {
  id: number;
  name: string;
  description: string;
  price: number;
  hpp: number;
  branch_id: number;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

export interface PetClinicPatientModel {
  id: number;
  name: string;
  species: string;
  gender: "male" | "female";
  owner_name: string;
  owner_phone: number;
  notes: string;
  breed?: string;
  fur_color?: string;
  age?: string;
  branch_id: number;
  created_at: Date;
  deleted_at?: Date;
  address?: string;
  code: string;
}

export interface PetClinicMedicalHistoryModel {
  id: number;
  patient_id: number;
  diagnosis?: string;
  anamnesa?: string;
  physical_check?: string;
  treatment?: string;
  notes?: string;
  date?: Date; // ISO 8601
  vet_id?: number;
  created_at: Date; // ISO 8601
  updated_at?: Date; // ISO 8601
  branch_id?: number;
  queue_id?: number;
}
