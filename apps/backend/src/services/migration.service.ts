import mongoose from "mongoose";
import { SaleDB } from "src/models/sale.model";
import { UserModel, UserRole } from "src/models/user.model";
import mongodbService from "./mongodb.service";
import authService from "./auth.service";
import ENV from "src/config/env.config";

async function cashierToUser() {
    await mongodbService.connect();

    console.log("Starting migration...");

    /**
     * 1. Ambil semua cashier unik (string)
     */
    const uniqueCashiers: any[] = await SaleDB.distinct("cashier");

    console.log("Unique cashiers found:", uniqueCashiers.length);

    /**
     * mapping: nama cashier -> userId
     */
    const cashierUserMap = new Map<string, any>();

    /**
     * 2. Buat user CASHIER jika belum ada
     */
    for (const name of uniqueCashiers) {
        if (!name || typeof name !== "string") continue;

        // cek apakah user sudah ada
        let user = await UserModel.findOne({
            name: name,
        });

        if (!user) {
            user = await UserModel.create({
                name,
                email: `${name.toLowerCase().replace(/\s+/g, ".")}@cashier.local`,
                password: "hashed-default-password", // ganti sesuai system kamu
                role: UserRole.CASHIER,
                is_active: true,
            });

            console.log("Created user:", name);
        }

        cashierUserMap.set(name, user._id);
    }

    console.log('done creating users from old sale data')
}



async function updateSaleCashier() {
    console.log('start update sale cashier');

    const oldSales = await SaleDB.collection.find({}).toArray();

    const allUser = await UserModel.find().lean();

    console.log('found all user', allUser.length);

    let updated = 0;

    for (const sale of oldSales) {
        console.log('starting update sale', sale._id);
        const cashierName = sale.cashier?.name || sale.cashier;
        const cashierId = sale.cashier?.userId;


        console.log('sale name', cashierName);

        if (!cashierName) continue;

        const user = allUser.find(
            (u) => u.name === cashierName || u._id?.toString() === cashierId?.toString()
        );


        if (!user) continue;

        console.log('found user', user.name);


        await SaleDB.updateOne(
            { _id: sale._id },
            {
                $set: {
                    cashier: {
                        userId: user._id,
                        name: user.name
                    },
                },
            }
        );

        updated++;
    }

    console.log("Migration done. Updated:", updated);
}

async function distinctSaleCashier() {

    console.log('Check distinct sale cashier');
    const result = await SaleDB.distinct('cashier').lean();
    console.log('Result', JSON.stringify(result, null, 2))
}

async function implementUsernametoAllUser() {
    const allUser = await UserModel.find();

    for (const user of allUser) {

    }
}

async function changeAllUserToDefaultConfig() {
    if (!ENV.ENABLE_SEED) return;
    await UserModel.syncIndexes();
    console.log('start change all user to default config')

    const allUser = await UserModel.find({});

    console.log('found all user', allUser.length);

    for (const user of allUser) {

        console.log('starting change user', user.name);
        const defaultConfig = await authService.getDefaultUserConfig();



        if (!user.username) {
            const username = await authService.generateUniqueUsername(user.name);
            user.username = username;
        }
        user.email = defaultConfig.email;
        user.password = defaultConfig.password;
        await user.save();
        console.log('Updated user', user.name);
    }

    console.log('done change all user to default config');

}

export default {
    cashierToUser,
    updateSaleCashier,
    distinctSaleCashier,
    changeAllUserToDefaultConfig,
}