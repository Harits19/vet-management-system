import { Types } from "mongoose";
import { ProductDB as ProductDB } from "src/models/product.model";



export async function getAllProductDetail(ids: Types.ObjectId[]) {
    const result = await ProductDB.find({
        _id: {
            $in: ids
        }
    }).lean()

    return result;

}