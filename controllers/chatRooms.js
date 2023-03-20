const { StatusCodes } = require("http-status-codes");
const { default: mongoose } = require("mongoose");
const { BadRequestError, NotFoundError } = require("../errors");

const { ChatRoom, ChatMessage } = require("../models");

const initiate = async (req, res) => {
  const { userId } = req.user;
  const { userIds, type } = req.body;

  if (!Array.isArray(userIds)) {
    throw new BadRequestError(`Array of userIds is required`);
  }

  const allUserIds = [...userIds, userId];

  const chatRoom = await ChatRoom.initiateChat(allUserIds, type, userId);

  res.status(StatusCodes.OK).json(chatRoom);
};

const postMessage = async (req, res) => {
  const { userId } = req.user;
  const { roomId } = req.params;
  const { msg } = req.body;

  if (!msg) {
    throw new BadRequestError(`No message was sent`);
  }

  let post = await ChatMessage.create({
    chatRoomId: roomId,
    message: msg,
    postedByUserId: userId,
    readByRecipients: { readByUserId: userId },
  });

  const aggregate = await ChatMessage.aggregate([
    // get post where _id = post._id
    { $match: { _id: post._id } },
    // do a join on another table called users, and
    // get me a user whose _id = postedByUser
    {
      $lookup: {
        from: "users",
        localField: "postedByUserId",
        foreignField: "_id",
        pipeline: [{ $project: { password: 0 } }],
        as: "postedByUser",
      },
    },
    { $unwind: "$postedByUser" },
    // do a join on another table called chatrooms, and
    // get me a chatroom whose _id = chatRoomId
    {
      $lookup: {
        from: "chatrooms",
        localField: "chatRoomId",
        foreignField: "_id",
        as: "chatRoomInfo",
      },
    },
    { $unwind: "$chatRoomInfo" },
    { $unwind: "$chatRoomInfo.userIds" },
    // do a join on another table called users, and
    // get me a user whose _id = userIds
    {
      $lookup: {
        from: "users",
        localField: "chatRoomInfo.userIds",
        foreignField: "_id",
        pipeline: [{ $project: { password: 0 } }],
        as: "chatRoomInfo.userProfile",
      },
    },
    { $unwind: "$chatRoomInfo.userProfile" },
    // group data
    {
      $group: {
        _id: "$chatRoomInfo._id",
        postId: { $last: "$_id" },
        chatRoomId: { $last: "$chatRoomInfo._id" },
        message: { $last: "$message" },
        type: { $last: "$type" },
        postedByUser: { $last: "$postedByUser" },
        readByRecipients: { $last: "$readByRecipients" },
        chatRoomInfo: { $addToSet: "$chatRoomInfo.userProfile" },
        createdAt: { $last: "$createdAt" },
        updatedAt: { $last: "$updatedAt" },
      },
    },
  ]);

  post = aggregate[0];
  // socket post
  global.io.sockets.in(roomId).emit("new-message", { msg: post });

  res.status(StatusCodes.OK).json(post);
};

const getRecentConversation = async (req, res) => {
  const { userId } = req.user;
  const { page = 0, limit = 10 } = req.query;
  const options = { page: +page, limit: +limit };

  const rooms = await ChatRoom.getChatRoomsByUserId(userId);
  const roomIds = rooms.map((room) => room._id);
  console.log(roomIds);
  const recentConversation = await ChatMessage.aggregate([
    { $match: { chatRoomId: { $in: roomIds } } },
    {
      $group: {
        _id: "$chatRoomId",
        messageId: { $last: "$_id" },
        chatRoomId: { $last: "$chatRoomId" },
        message: { $last: "$message" },
        type: { $last: "$type" },
        postedByUser: { $last: "$postedByUserId" },
        createdAt: { $last: "$createdAt" },
        readByRecipients: { $last: "$readByRecipients" },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "users",
        localField: "postedByUser",
        foreignField: "_id",
        pipeline: [{ $project: { password: 0 } }],
        as: "postedByUser",
      },
    },
    { $unwind: "$postedByUser" },
    {
      $lookup: {
        from: "chatrooms",
        localField: "_id",
        foreignField: "_id",
        as: "roomInfo",
      },
    },
    { $unwind: "$roomInfo" },
    { $unwind: "$roomInfo.userIds" },
    // do a join on another table called users
    {
      $lookup: {
        from: "users",
        localField: "roomInfo.userIds",
        foreignField: "_id",
        pipeline: [{ $project: { password: 0 } }],
        as: "roomInfo.userProfile",
      },
    },

    { $unwind: "$readByRecipients" },
    // do a join on another table called users
    {
      $lookup: {
        from: "users",
        localField: "readByRecipients.readByUserId",
        foreignField: "_id",
        pipeline: [{ $project: { password: 0 } }],
        as: "readByRecipients.readByUser",
      },
    },

    {
      $group: {
        _id: "$roomInfo._id",
        messageId: { $last: "$messageId" },
        chatRoomId: { $last: "$chatRoomId" },
        message: { $last: "$message" },
        type: { $last: "$type" },
        postedByUser: { $last: "$postedByUser" },
        readByRecipients: { $addToSet: "$readByRecipients" },
        roomInfo: { $addToSet: "$roomInfo.userProfile" },
        createdAt: { $last: "$createdAt" },
      },
    },
    { $skip: options.page * options.limit },
    { $limit: options.limit },
  ]);

  res.status(StatusCodes.OK).json(recentConversation);
};

const getConversationByRoomId = async (req, res) => {
  const { userId } = req.user;
  const { roomId } = req.params;
  const options = {
    page: parseInt(req.query.page) || 0,
    limit: parseInt(req.query.limit) || 10,
  };

  const room = await ChatRoom.getChatRoomByRoomId(roomId);
  if (!room) {
    throw new NotFoundError(`Room with id ${roomId} not found`);
  }

  await room.populate({ path: "userIds", select: "-password" });
  const users = room.userIds;

  const conversation = await ChatMessage.aggregate([
    { $match: { chatRoomId: mongoose.Types.ObjectId(roomId) } },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "users",
        localField: "postedByUserId",
        foreignField: "_id",
        pipeline: [{ $project: { password: 0 } }],
        as: "postedByUser",
      },
    },
    { $unwind: "$postedByUser" },
    { $skip: options.page * options.limit },
    { $limit: options.limit },
    { $sort: { createdAt: 1 } },
  ]);

  // TODO - here not working

  res.status(StatusCodes.OK).json({ conversation, users });
};

const markConversationReadByRoomId = async (req, res) => {
  const { userId } = req.user;
  const { roomId } = req.params;

  const room = await ChatRoom.getChatRoomByRoomId(roomId);

  if (!room) {
    throw new NotFoundError(`Room with id ${roomId} not found`);
  }

  const result = await ChatMessage.updateMany(
    {
      chatRoomId: roomId,
      "readByRecipients.readByUserId": { $ne: userId },
    },
    {
      $addToSet: {
        readByRecipients: { readByUserId: userId },
      },
    }
  );

  res.status(StatusCodes.OK).json(result);
};

const getUnreadCount = async (req, res) => {
  const { userId } = req.user;

  const rooms = await ChatRoom.getChatRoomsByUserId(userId);
  const roomIds = rooms.map((room) => room._id);

  const unreadConversation = await ChatMessage.aggregate([
    {
      $match: {
        chatRoomId: { $in: roomIds },
        postedByUserId: { $ne: mongoose.Types.ObjectId(userId) },
        "readByRecipients.readByUserId": {
          $ne: mongoose.Types.ObjectId(userId),
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "postedByUserId",
        foreignField: "_id",
        pipeline: [{ $project: { password: 0 } }],
        as: "postedByUserId",
      },
    },
    { $unwind: "$readByRecipients" },
    {
      $project: {
        chatRoomId: 1,
        postedByUserId: { $arrayElemAt: ["$postedByUserId", 0] },
        message: 1,
        type: 1,
        createdAt: 1,
        readByUser: "$readByRecipients.readByUserId",
      },
    },
    {
      $match: {
        readByUser: { $ne: mongoose.Types.ObjectId(userId) },
      },
    },
    {
      $group: {
        _id: "$chatRoomId",
        chatRoomId: { $last: "$chatRoomId" },
        postedByUser: { $last: "$postedByUserId" },
        lastMessage: { $last: "$message" },
        type: { $last: "$type" },
        createdAt: { $last: "$createdAt" },
        numberOfUnreadMsgs: { $count: {} },
        readByRecipients: { $addToSet: "$readByUser" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "readByRecipients",
        foreignField: "_id",
        pipeline: [{ $project: { password: 0 } }],
        as: "readByRecipients",
      },
    },
  ]);

  res.status(StatusCodes.OK).json(unreadConversation);
};

const deleteRoomById = async (req, res) => {
  const { roomId } = req.params;
  const room = await ChatRoom.remove({ _id: roomId });
  const messages = await ChatMessage.remove({ chatRoomId: roomId });

  res.status(StatusCodes.OK).json({
    msg: `Room with id ${roomId} deleted`,
    deletedRoomsCount: room.deletedCount,
    deletedMessagesCount: messages.deletedCount,
  });
};

const deleteMessageById = async (req, res) => {
  const { messageId } = req.params;
  const message = await ChatMessage.remove({ _id: messageId });

  res.status(StatusCodes.OK).json({
    msg: `Message with id ${messageId} deleted`,
    deletedMessagesCount: message.deletedCount,
  });
};

module.exports = {
  initiate,
  postMessage,
  getRecentConversation,
  getConversationByRoomId,
  markConversationReadByRoomId,
  deleteRoomById,
  deleteMessageById,
  getUnreadCount,
};
