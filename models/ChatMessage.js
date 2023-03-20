const mongoose = require("mongoose");

const MESSAGE_TYPES = {
  TEXT: "text",
  IMG: "image",
  VIDEO: "video",
  AUDIO: "audio",
};

const ChatMessageSchema = new mongoose.Schema(
  {
    chatRoomId: {
      type: mongoose.Types.ObjectId,
      ref: "ChatRoom",
    },
    message: {
      type: mongoose.Mixed,
    },
    type: {
      type: String,
      default: () => MESSAGE_TYPES.TEXT,
    },
    postedByUserId: { type: mongoose.Types.ObjectId, ref: "User" },
    readByRecipients: [
      new mongoose.Schema({
        readByUserId: { type: mongoose.Types.ObjectId, ref: "User" },
        readAt: {
          type: Date,
          default: Date.now(),
        },
      }),
    ],
  },
  {
    timestamps: true,
  }

module.exports = mongoose.model("ChatMessage", ChatMessageSchema);
