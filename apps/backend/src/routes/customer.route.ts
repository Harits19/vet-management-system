import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { customerController } from "src/controllers/customer.controller.js";


class CustomerRoute {



    get routes() {
        const router = express.Router();
        router.get("/", authMiddleware, customerController.get);
        router.post("/", authMiddleware, customerController.create);


        return router;
    }
}



export const customerRoute = new CustomerRoute();