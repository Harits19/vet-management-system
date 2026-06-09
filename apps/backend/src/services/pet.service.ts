import { LoggerConfig } from "src/config/logger.config";
import { PetModel as PetDB } from "src/models/pet.model";


class PetService {
    logger = new LoggerConfig({ prefix: 'PetService' })

    async getAllKindOfPet() {
        const logger = new LoggerConfig({ prefix: 'getAll', parent: this.logger })
        const result = await PetDB.distinct('kind');
        logger.log('result ', { length: result.length, example: result.at(0) })
        return result;
    }
}

export const petService = new PetService();