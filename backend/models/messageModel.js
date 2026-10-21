import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    clientMessageId: { type: String, maxlength: 128 },

    deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    content: {
      type: String,
      trim: true,
      required: true,
    },

    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Message = mongoose.model("Message", messageSchema);