import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import type {
  CreatePatientInput,
  OwnerSummary,
  Patient,
  PetSpecies,
} from "@vet/shared-types";

class OwnerSubdocument implements OwnerSummary {
  @prop({ required: true, trim: true, type: () => String })
  public name!: string;

  @prop({ required: true, trim: true, type: () => String })
  public phone!: string;

  @prop({ trim: true, type: () => String })
  public email?: string;
}

@modelOptions({
  schemaOptions: {
    timestamps: true,
    versionKey: false,
  },
})
class PatientDocument implements CreatePatientInput {
  @prop({ required: true, trim: true, type: () => String })
  public name!: string;

  @prop({
    required: true,
    enum: ["cat", "dog", "bird", "rabbit", "other"],
    type: () => String,
  })
  public species!: PetSpecies;

  @prop({ trim: true, type: () => String })
  public breed?: string;

  @prop({ required: true, min: 0, type: () => Number })
  public age!: number;

  @prop({ required: true, _id: false, type: () => OwnerSubdocument })
  public owner!: OwnerSummary;

  @prop({ trim: true, type: () => String })
  public notes?: string;
}

export const PatientModel = getModelForClass(PatientDocument);

export function toPatientDTO(document: {
  _id: { toString(): string };
  name: string;
  species: PetSpecies;
  breed?: string;
  age: number;
  owner: OwnerSummary;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}): Patient {
  return {
    _id: document._id.toString(),
    name: document.name,
    species: document.species,
    breed: document.breed,
    age: document.age,
    owner: document.owner,
    notes: document.notes,
    createdAt: (document.createdAt ?? new Date()).toISOString(),
    updatedAt: (document.updatedAt ?? new Date()).toISOString(),
  };
}
