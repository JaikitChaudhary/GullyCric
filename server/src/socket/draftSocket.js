export const getDraftRoomName = (tournamentId) => `draft:${tournamentId}`;

export const registerDraftSocket = (io) => {
  io.on('connection', (socket) => {
    socket.on('joinDraft', (tournamentId) => {
      if (tournamentId) {
        socket.join(getDraftRoomName(tournamentId));
      }
    });
  });
};

export const emitDraftEvent = (request, tournamentId, draft) => {
  const io = request.server.io;

  if (io && tournamentId) {
    io.to(getDraftRoomName(tournamentId)).emit('draftUpdate', draft);
  }
};
