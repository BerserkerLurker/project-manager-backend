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

    socket.on("chat", (msg, callback) => {
      console.log("message: " + msg);
      callback({ msg: `got it! ${new Date()}` });
    });

    // subscribe to a chat room
    socket.on("subscribe", (room, otherUserId) => {
      const userSockets = users.filter((user) => user.userId === otherUserId);
      userSockets.map((userInfo) => {
        console.log(global.io.of("/").sockets.keys());
        console.log(global.io.of("/").sockets.get(userInfo.clientId).connected);
        const socketConn = global.io.of("/").sockets.get(userInfo.clientId);
        // const socketConn = global.io.sockets.connected(userInfo.clientId);
        if (socketConn.connected) {
          socketConn.join(room);
          console.log(global.io.of("/").adapter.rooms);
        }
      });
      socket.join(room);
      global.io.to(room).emit(`Welcome to ${room} ${userInfo.userName}`);
      // console.log(global.io.of("/").adapter.rooms);
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
