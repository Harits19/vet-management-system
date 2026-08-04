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
    "id": number,
    "name": string,
    "description": string,
    "price": number,
    "hpp": number,
    "branch_id": number,
    "is_active": number,
    "created_at": Date,
    "updated_at": Date
}

export interface PetClinicPatientModel { }

export interface PetClinicMedicalHistoryModel { }