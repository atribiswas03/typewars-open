import { io } from 'socket.io-client';
import API_BASE_URL from './api';

const SOCKET_URL = API_BASE_URL;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket'],
});
