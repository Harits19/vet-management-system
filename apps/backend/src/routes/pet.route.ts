import express from "express";
import { authMiddleware } from "src/middlewares/auth.middleware";
import { petService } from "src/services/pet.service";
import { sendResponse } from "src/services/response.service";


class PetRoute {
    private router = express.Router();

    get route() {
        this.router.get('/kind', authMiddleware, async (req, res) => {

            const result = await petService.getAllKindOfPet()
            return sendResponse(res, {
                data: result,
            })
        })
        return this.router;
    }
}

export const petRoute = new PetRoute()