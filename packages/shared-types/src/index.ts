export const PET_SPECIES = ["cat", "dog", "bird", "rabbit", "other"] as const;

export type PetSpecies = (typeof PET_SPECIES)[number];

export interface OwnerSummary {
  name: string;
  phone: string;
  email?: string;
}

export interface Patient {
  _id: string;
  name: string;
  species: PetSpecies;
  breed?: string;
  age: number;
  owner: OwnerSummary;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientInput {
  name: string;
  species: PetSpecies;
  breed?: string;
  age: number;
  owner: OwnerSummary;
  notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

