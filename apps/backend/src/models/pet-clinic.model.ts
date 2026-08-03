export interface PetClinicInventory {
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