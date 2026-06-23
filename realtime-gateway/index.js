import 'dotenv/config';
import { createServer } from './src/server.js';

const PORT = parseInt(process.env.GATEWAY_PORT || '3002', 10);

const { httpServer, io, app } = createServer();

httpServer.listen(PORT, () => {
    console.log(`[realtime] listening on port ${PORT}`);
});
