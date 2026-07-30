import { Chat } from "../models/chatModel.js"

export const getChat = async(req,res)=>{
    try{

        const { userId } = req.body;

        if(!userId){
            return res.status(400).json({
                message:"User ID is required"
            });
        }

        let chat = await Chat.findOne({
            isGroupChat:false,
            users:{
                $all:[req.user.id,userId]
            }
        }).populate("users","-password")
          .populate({
              path: "latestMessage",
              populate: {
                  path: "sender",
                  select: "name pic email",
              },
          });

        if(chat){
            return res.json(chat);
        }

        chat = await Chat.create({
            chatName:"sender",
            isGroupChat:false,
            users:[req.user.id,userId]
        });

        chat = await Chat.findById(chat._id)
            .populate("users","-password");

        return res.json(chat);

    }catch(err){
        return res.status(500).json({
            message:err.message
        });
    }
}

export const fetchChats = async(req,res)=>{
    try{
    let chats = await Chat.find({
        users:req.user.id
    }).populate("users", "-password")
        .populate("groupAdmin", "-password")
        .populate({
            path: "latestMessage",
            populate: {
                path: "sender",
                select: "name pic email",
            },
        })
        .sort({ updatedAt: -1 });



    

    if(!chats){
        return res.status(404).json({message:"No chats found"}) }

        return res.status(200).json(chats);
    }catch(err){
        return res.status(500).json({message:err.message})
    }
}

export const groupChat = async(req,res)=>
{
    try{
    const {name,users} = req.body;

    if(!name || !users){
        return res.status(400).json({message:"Please fill all the fields"})
    }

    const grpChat = await Chat.create({
        chatName:name,
        isGroupChat:true,
        users:[...users,req.user.id],
        groupAdmin:req.user.id
    })

    const fullGroup = await Chat.findById(grpChat._id)
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

    res.json(fullGroup);
    }catch(err){
        return res.status(500).json({message:err.message})
    }
    
}

export const renameGroup = async (req, res) => {

    const { chatId, chatName } = req.body;

    const chat = await Chat.findByIdAndUpdate(
        chatId,
        {
            chatName
        },
        {
            new: true
        }
    ).populate("users", "-password").populate("groupAdmin", "-password");

    if (!chat) {
        return res.status(404).json({
            message: "Chat not found"
        });
    }

    res.json(chat);

};

export const removeFromGroup = async (req, res) => {
    try{
    const {chatId,userId} = req.body;

    if(!chatId || !userId) {
        return res.status(400).json({message:"Please fill all the fields"})
    }

    const newChat = await Chat.findByIdAndUpdate(
        chatId,
        {
            $pull:{users:userId}
        },
        {
            new:true
        }
    ).populate("users", "-password").populate("groupAdmin", "-password");

    return res.status(200).json(newChat);

    
    }catch(err){
        console.log(err);
        return res.status(500).json({message:err.message})
    }
}

export const addToGroup = async(req,res)=>{
    try {
        const {chatId,userId} = req.body;

        if(!chatId || !userId) {
            return res.status(400).json({message:"Please fill all the fields"})
        }

        const chat = await Chat.findByIdAndUpdate(
            chatId,
            {
                $push:{users:userId}
            },
            {
                new:true
            }
        ).populate("users", "-password").populate("groupAdmin", "-password");

        return res.status(200).json(chat);
    } catch(err) {
        return res.status(500).json({message:err.message});
    }
}



