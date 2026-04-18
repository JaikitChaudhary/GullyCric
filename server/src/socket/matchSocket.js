export const registerMatchSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('joinMatch', (matchCode) => {
      if (matchCode) {
        socket.join(matchCode);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

export const emitMatchEvent = (request, eventName, match, matchCode = match?.matchCode) => {
  const io = request.server.io;

  if (io) {
    if (matchCode) {
      io.to(matchCode).emit(eventName, match);
    }

    io.emit(eventName, match);
  }
};
