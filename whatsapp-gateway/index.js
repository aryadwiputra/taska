import 'dotenv/config';
import { startServer } from './src/server.js';
import { createClient } from './src/client.js';

const PORT = parseInt(process.env.GATEWAY_PORT || '3001', 10);

let client;
let restartTimer = null;

function start() {
    client = createClient();

    client.on('ready', () => {
        console.log('[gateway] client ready');
    });

    client.on('disconnected', (reason) => {
        console.warn('[gateway] disconnected:', reason);

        if (restartTimer) {
            clearTimeout(restartTimer);
        }

        restartTimer = setTimeout(() => {
            console.log('[gateway] reconnecting...');
            start();
        }, 5000);
    });

    client.on('auth_failure', (msg) => {
        console.error('[gateway] auth failure:', msg);

        if (restartTimer) {
            clearTimeout(restartTimer);
        }

        restartTimer = setTimeout(() => {
            console.log('[gateway] reconnecting after auth failure...');
            start();
        }, 10000);
    });

    startServer(client, PORT);
}

start();
