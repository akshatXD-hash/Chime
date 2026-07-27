import mongoose from "mongoose";

export const connectDb = async()=>{
    try{
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("database connected")
    }catch(err){
     console.log(err);
    }
}