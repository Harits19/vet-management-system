import zod from 'zod'

export const petMedicalHistorySchema = zod.object({
    petId: zod.string().min(1),
    visitDate: zod.date(),
    complaints: zod.string().min(1),
    diagnosis: zod.string().optional(),
    treatments: zod.array(zod.string()).default([]),
    medications: zod.array(
        zod.object({
            name: zod.string().min(1),
            dosage: zod.string().optional(),
            frequency: zod.string().optional(),
            duration: zod.string().optional(),
            notes: zod.string().optional(),
        }),
    ).default([]),
    vaccinations: zod.array(
        zod.object({
            name: zod.string().min(1),
            date: zod.date(),
            notes: zod.string().optional(),
        }),
    ).default([]),
    allergies: zod.array(zod.string()).default([]),
    weight: zod.number().positive().optional(),
    temperature: zod.number().optional(),
    attachments: zod.array(
        zod.object({
            fileName: zod.string(),
            fileUrl: zod.url(),
        }),
    ).default([]),
    notes: zod.string().optional(),
    nextVisitDate: zod.date().optional(),
});

export interface IPetMedicalHistory extends zod.infer<typeof petMedicalHistorySchema> { }