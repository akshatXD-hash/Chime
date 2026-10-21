import mongoose from "mongoose";
import { Message } from "../models/messageModel.js";
import { Chat } from "../models/chatModel.js";

export const getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        if (!mongoose.isObjectIdOrHexString(chatId)) return res.status(400).json({ message: "Please choose a valid conversation." });
        if (!await Chat.exists({ _id: chatId, users: req.user.id })) {
            return res.status(403).json({ message: "You no longer have access to this conversation." });
        }

        const messages = await Message.find({
            chat: chatId
        }).sort({ createdAt: 1, _id: 1 })
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

        if (typeof content !== "string" || !content.trim() || !mongoose.isObjectIdOrHexString(chatId)) {
            return res.status(400).json({
                message: "Content and Chat ID are required"
            });
        }

        if (!await Chat.exists({ _id: chatId, users: req.user.id })) {
            return res.status(403).json({ message: "You no longer have access to this conversation." });
        }
        const message = await Message.create({
            sender: req.user.id,
            content,
            chat: chatId
        });

        const [populatedMessage] = await Promise.all([
            Message.findById(message._id)
                .populate("sender", "-password")
                .populate({
                    path: "chat",
                    populate: {
                        path: "users",
                        select: "-password"
                    }
                }),
            Chat.findByIdAndUpdate(chatId, {
                latestMessage: message._id
            })
        ]);

        req.app.get("io")?.to(populatedMessage.chat.users.map((user) => String(user._id))).emit("receive-message", populatedMessage);
        return res.json(populatedMessage);

    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};

export const markMessagesRead = async (req, res) => {
    const { chatId } = req.params;
    const { messageIds } = req.body || {};
    const userId = req.user.id;

    if (!mongoose.isObjectIdOrHexString(chatId) || !Array.isArray(messageIds) ||
        messageIds.length === 0 || messageIds.length > 100 ||
        !messageIds.every((id) => mongoose.isObjectIdOrHexString(id))) {
        return res.status(400).json({ message: "We couldn't update the read status. Please try again." });
    }

    try {
        const chat = await Chat.findOne({ _id: chatId, users: userId }).select("users");
        if (!chat) {
            return res.status(403).json({ message: "You no longer have access to this conversation." });
        }

        const messages = await Message.find({
            _id: { $in: messageIds },
            chat: chatId,
            sender: { $ne: userId }
        }).select("_id");
        const ids = messages.map((message) => message._id.toString());

        if (ids.length) {
            await Message.updateMany(
                { _id: { $in: ids }, chat: chatId },
                { $addToSet: { readBy: userId } }
            );
            const receipt = { chatId, messageIds: ids, userId };
            req.app.get("io")?.to(chat.users.map((id) => id.toString())).emit("messages-read", receipt);
        }

        return res.json({ chatId, messageIds: ids, userId });
    } catch (err) {
        console.error("Could not update read status:", err);
        return res.status(500).json({ message: "We couldn't update the read status. Please try again." });
    }
};
