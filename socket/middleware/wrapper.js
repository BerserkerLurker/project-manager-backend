const wrapAuth = (middleware) => (socket, next) =>
  middleware(socket.handshake, {}, next);
module.exports = { wrapAuth };
