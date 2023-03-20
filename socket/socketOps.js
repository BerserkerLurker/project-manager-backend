function socketOps() {
  let users = [];
  global.io.on("connection", (socket) => {
    // console.log(socket.handshake.auth);
    console.log("A User connected: " + socket.id);

    var userInfo = new Object();
    userInfo.userId = socket.handshake.auth.user.userId;
    userInfo.clientId = socket.id;
    userInfo.userName = socket.handshake.auth.user.name;
    users.push(userInfo);
    // console.log(users);
    global.io.emit("users", users);

    socket.on("userslist", (senderList, callback) => {

      callback(users);
    });

    // logout event
    socket.on("end", () => {
      socket.disconnect();
    });

    socket.on("disconnect", () => {
      console.log("user disconnected");

      users = users.filter((user) => user.clientId !== socket.id);
      // console.log(users);
      global.io.emit("users", users);
    });

    socket.on("chat", (payload, callback) => {
      const { msg, roomId } = payload;
      console.log(msg, roomId);
      if (roomId === "all") {
        socket.broadcast.emit("all", { msg, roomId });
        // setTimeout(() => {
        //   callback({ msg: `got it! ` });
        // }, 1000);
      } else {
        socket.to(roomId).emit(roomId, { msg, roomId });
      }
    });

    // subscribe to a chat room
    socket.on("subscribe", (room, otherUserId) => {
      const userSockets = users.filter((user) => user.userId === otherUserId);
      // console.log(global.io.of("/").adapter.rooms.get(room), userSockets[0].clientId);

      socket.join(room);
      if (userSockets.length === 0) {
        global.io.to(room).emit(`${otherUserId} is offline`);
      } else if (
        global.io.of("/").adapter.rooms.get(room)?.has(userSockets[0].clientId)
      ) {
        console.log(global.io.of("/").adapter.rooms);
        return;
      } else {
        userSockets.map((userNfo) => {
          // console.log(global.io.of("/").sockets.keys());
          // console.log(global.io.of("/").sockets.get(userInfo.clientId).connected);
          const socketConn = global.io.of("/").sockets.get(userNfo.clientId);
          // const socketConn = global.io.sockets.connected(userInfo.clientId);

          if (socketConn.connected) {
            socketConn.join(room);
            // console.log(global.io.of("/").adapter.rooms);
          }
        });
      }
      console.log(global.io.of("/").adapter.rooms);

      socket.to(room).emit("joined", {
        roomId: room,
        msg: `Welcome to ${room} ${userInfo.userName} `,
      });
    });

    // mute a chat room
    socket.on("unsubscribe", (room) => {
      socket.leave(room);
      global.io.to(room).emit(`${userInfo.userName} left the room`);
      console.log(global.io.of("/").adapter.rooms);
    });
  });
}

module.exports = { socketOps };
