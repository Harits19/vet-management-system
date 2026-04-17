import { Router } from "express";
import type { ApiResponse, CreatePatientInput, Patient } from "@vet/shared-types";
import { PatientModel, toPatientDTO } from "../models/patient.model.js";

const router = Router();

router.get("/", async (_request, response) => {
  const patients = await PatientModel.find().sort({ createdAt: -1 }).exec();

  response.json({
    success: true,
    data: patients.map((patient) => toPatientDTO(patient.toObject()))
  } satisfies ApiResponse<Patient[]>);
});

router.post("/", async (request, response) => {
  const payload = request.body as Partial<CreatePatientInput>;

  if (!payload.name || !payload.species || payload.age === undefined || !payload.owner?.name || !payload.owner?.phone) {
    response.status(400).json({
      success: false,
      data: null,
      message: "Invalid patient payload"
    });
    return;
  }

  const patient = await PatientModel.create(payload);

  response.status(201).json({
    success: true,
    data: toPatientDTO(patient.toObject())
  } satisfies ApiResponse<Patient>);
});

export default router;
