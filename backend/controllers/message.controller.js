import { Message } from "../models/messageModel.js";

export const getMessages =  async(req,res)=>{
    try{
    const {chatId} = req.params;

    const messages = await Message.find({
        chat:chatId
    }).populate("sender", "-password")
        .populate("chat");

    if(!messages) {
        return res.status(404).json({message:"No messages found"})  
    }

    return res.status(200).json(messages);
    }catch(err){
        return res.status(500).json({message:err.message})
    }
}