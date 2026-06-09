import express from "express";
import { authMiddleware } from "src/middlewares/auth.middleware";
import { petService } from "src/services/pet.service";
import { sendResponse } from "src/services/response.service";
import { z } from 'zod'
const petCreateSchema = z.array(z.object({
    customerId: z.string().min(1),
    name: z.string().min(1),
    kind: z.string().min(1),
    gender: z.enum(["male", "female"]),
    notes: z.string().optional(),
})).default([]);

class PetRoute {

    get routes() {
        const router = express.Router();

        router.get('/kind', authMiddleware, async (req, res) => {

            const result = await petService.getAllKindOfPet()
            return sendResponse(res, {
                data: result,
            })
        })

        router.post('/', authMiddleware, async (req, res) => {
            const body = petCreateSchema.parse(req.body?.data);
            console.log('body', body);
            await petService.insertPets(body);
            return sendResponse(res, {
                data: body,
            })

        })
        return router;
    }
}

export const petRoute = new PetRoute()