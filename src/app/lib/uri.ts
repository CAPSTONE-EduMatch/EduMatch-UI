import dotenv from "dotenv";
dotenv.config();
const a = decodeURIComponent(process.env.DATABASE_PASSWORD || "");
console.log("Decoded password:", a);