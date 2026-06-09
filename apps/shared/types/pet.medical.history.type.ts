export interface IPetMedicalHistory {
    _id: string;
    petId: string;
    visitDate: Date;
    diagnosis: string;
    treatment?: string;
    notes?: string;
    doctorId: string;
    createdAt: Date;
    updatedAt: Date;

}