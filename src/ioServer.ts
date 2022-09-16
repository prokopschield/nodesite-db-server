import { Server } from 'socket.io';

import { httpServer } from './httpServer';

export const ioServer = new Server(httpServer, {
	cors: {
		allowedHeaders: '*',
		origin: '*',
	},
	maxHttpBufferSize: 1 << 24,
});
