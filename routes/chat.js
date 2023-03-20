const express = require("express");
const router = express.Router();
const {
  initiate,
  postMessage,
  getRecentConversation,
  getConversationByRoomId,
  markConversationReadByRoomId,
  deleteRoomById,
  deleteMessageById,
  getUnreadCount,
} = require("../controllers/chatRooms");

router
  .get("/", getRecentConversation)
  .get("/:roomId", getConversationByRoomId)
  .post("/initiate", initiate)
  .get("/room/unreadcount", getUnreadCount)
  .post("/:roomId/message", postMessage)
  .put("/:roomId/mark-read", markConversationReadByRoomId)
  .delete("/room/:roomId", deleteRoomById)
  .delete("/message/:messageId", deleteMessageById);

module.exports = router;
