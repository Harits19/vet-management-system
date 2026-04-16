"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const port = Number(process.env.API_PORT || 4000);
const server = http_1.default.createServer(app_1.default);
server.listen(port, () => {
    console.log(`Express API running on http://localhost:${port}`);
});
const shutdown = (signal) => {
    console.log(`Received ${signal}. Shutting down Express API...`);
    server.close(() => {
        process.exit(0);
    });
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
