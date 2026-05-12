import mongoose from "mongoose";
const mongoUri = "mongodb://root:root@localhost:27017/";


const connect = async () => {
    await mongoose.connect(mongoUri);
}

const mongodbService = {
    connect
};

export default mongodbService;