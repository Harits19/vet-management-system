import { LoggerConfig } from "src/config/logger.config";
import { PetModel as PetDB, PetModel } from "src/models/pet.model";
import { IPet } from "../../../shared/types";


class PetService {
    logger = new LoggerConfig({ prefix: 'PetService' })

    async getAllKindOfPet() {
        const logger = new LoggerConfig({ prefix: 'getAll', parent: this.logger })
        const result = await PetDB.distinct('kind');
        logger.log('result ', { length: result.length, example: result.at(0) })
        return result;
    }

    async insertPets(pets: Omit<IPet, '_id'>[]) {
        const logger = new LoggerConfig({ prefix: 'insertPets', parent: this.logger })

        logger.log('start inset pets', { length: pets.length, example: pets.at(0) })

        const result = await PetDB.insertMany(pets)
        logger.log('result ', { length: result.length, example: result.at(0) });

    }
}

export const petService = new PetService();