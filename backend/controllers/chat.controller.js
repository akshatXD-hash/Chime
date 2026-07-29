import { Chat } from "../models/chatModel.js"

export const getChat = async(req,res)=>{
    try{
    const userId = req.body;

    if(!userId) {
        return res.status(400).json({message:"UserId is required"})     
    }

    const chat = await Chat.findOne({

        isGroupChat: false,
        users:{$all:[req.user.id,userId]}
    })

    if(chat){return res.status(200).json(chat)}

    let newChat =  await Chat.create({
        chatName:"sender",
        isGroupChat:false,
        users:[req.user.id,userId]
    })

    newChat = await Chat.findById(newChat._id).populate("users","-password");

   return res.status(200).json(newChat);

    return res.status(200).json(newChat)
    }catch(err){
        return res.status(500).json({message:err.message})
    }
}

export const fetchChats = async(req,res)=>{
    try{
    let chats = await Chat.find({
        users:req.user.id
    }).populate("users", "-password")
        .populate("groupAdmin", "-password")
        .populate("latestMessage")
        .sort({ updatedAt: -1 });



    

    if(!chats){
        return res.status(404).json({message:"No chats found"}) }

        return res.status(200).json(chats);
    }catch(err){
        return res.status(500).json({message:err.message})
    }
}

