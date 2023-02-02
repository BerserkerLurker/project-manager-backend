function socketOps() {
  let users = [];
  global.io.on("connection", (socket) => {
    console.log(socket.handshake.auth);
    console.log("A User connected: " + socket.id);

    var userInfo = new Object();
    userInfo.userId = socket.handshake.auth.user.userId;
    userInfo.clientId = socket.id;
    userInfo.userName = socket.handshake.auth.user.name;
    users.push(userInfo);
    // console.log(users);
    global.io.emit("users", users);

    socket.on("end", () => {
      socket.disconnect();
    });

    socket.on("disconnect", () => {
      console.log("user disconnected");

      users = users.filter((user) => user.clientId !== socket.id);
      // console.log(users);
      global.io.emit("users", users);
    });

    socket.on("chat", (msg) => {
      console.log("message: " + msg);
    });

  });
}

module.exports = { socketOps };
