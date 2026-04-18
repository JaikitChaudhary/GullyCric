import { useEffect } from 'react';
import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const socket = io(API_BASE, { transports: ['websocket'] });

export const useSocket = ({ matchCode, setMatch, setNotifications }) => {
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to socket server', socket.id);
    });

    socket.on('newMatch', (newMatch) => {
      setNotifications((prev) => [
        `New match created: ${newMatch.name} (${newMatch.maxOvers} overs)`,
        ...prev,
      ]);
    });

    socket.on('scoreUpdate', (updatedMatch) => {
      setMatch(updatedMatch);
      setNotifications((prev) => [
        `Score update: Innings ${updatedMatch.innings} ${updatedMatch.totalRuns}/${updatedMatch.wickets} in ${updatedMatch.currentOver} overs`,
        ...prev,
      ]);
    });

    socket.on('inningsChange', (updatedMatch) => {
      setMatch(updatedMatch);
      setNotifications((prev) => [
        `Innings break: Team 1 scored ${updatedMatch.firstInningsScore}. Target is ${updatedMatch.target}.`,
        ...prev,
      ]);
    });

    socket.on('matchEnd', (updatedMatch) => {
      setMatch(updatedMatch);
      setNotifications((prev) => [
        `Match ended: ${updatedMatch.result}`,
        ...prev,
      ]);
    });

    return () => {
      socket.off('connect');
      socket.off('newMatch');
      socket.off('scoreUpdate');
      socket.off('inningsChange');
      socket.off('matchEnd');
    };
  }, [setMatch, setNotifications]);

  useEffect(() => {
    if (matchCode) {
      socket.emit('joinMatch', matchCode);
    }
  }, [matchCode]);
};

export default useSocket;
