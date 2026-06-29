import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, '.env') });

const { createServer } = await import('./src/server.js');

const PORT = parseInt(process.env.GATEWAY_PORT || '3002', 10);

const { httpServer, io, app } = createServer();

httpServer.listen(PORT, () => {
    console.log(`[realtime] listening on port ${PORT}`);
});
