import { Message } from "../models/messageModel.js";
import { Chat } from "../models/chatModel.js";

export const getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;

        const messages = await Message.find({
            chat: chatId
        })
            .populate("sender", "-password")
            .populate({
                path: "chat",
                populate: {
                    path: "users",
                    select: "-password"
                }
            });

        if (!messages) {
            return res.status(404).json({ message: "No messages found" })
        }

        return res.status(200).json(messages);
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}

export const sendMessage = async (req, res) => {

    try {

        const { content, chatId } = req.body;

        if (!content || !chatId) {
            return res.status(400).json({
                message: "Content and Chat ID are required"
            });
        }

        let message = await Message.create({
            sender: req.user.id,
            content,
            chat: chatId
        });

        message = await Message.findById(message._id)
            .populate("sender", "-password")
            .populate("chat");

        await Chat.findByIdAndUpdate(chatId, {
            latestMessage: message._id
        });

        return res.json(message);

    } catch (err) {

        return res.status(500).json({
            message: err.message
        });

    }

};