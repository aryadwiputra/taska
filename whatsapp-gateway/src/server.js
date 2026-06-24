import express from 'express';
import QR from 'qrcode';
import { createSender } from './sender.js';

let currentQr = null;

export function startServer(client, port) {
    const app = express();

    app.use(express.json());

    client.on('qr', async (qr) => {
        currentQr = qr;
        const dataUri = await QR.toDataURL(qr);
        console.log('[gateway] QR refreshed');
        app.set('qrDataUri', dataUri);
        app.set('qrTerminal', qr);
    });

    client.on('ready', () => {
        currentQr = null;
        app.set('ready', true);
    });

    client.on('disconnected', (reason) => {
        console.warn('[gateway] disconnected:', reason);
        app.set('ready', false);
        currentQr = null;
    });

    function authMiddleware(req, res, next) {
        const token = process.env.LARAVEL_API_TOKEN;

        if (!token) {
            return next();
        }

        const auth = req.headers['authorization'];

        if (auth !== `Bearer ${token}`) {
            return res.status(401).json({ error: 'unauthorized' });
        }

        next();
    }

    // GET /health
    app.get('/health', (_req, res) => {
        res.json({ ok: true, ready: app.get('ready') === true });
    });

    // GET /status
    app.get('/status', authMiddleware, (_req, res) => {
        const ready = app.get('ready') === true;
        const qr = ready ? null : app.get('qrDataUri');

        res.json({
            ready,
            qr,
            qr_terminal: ready ? null : app.get('qrTerminal'),
        });
    });

    // POST /send
    app.post('/send', authMiddleware, async (req, res) => {
        if (app.get('ready') !== true) {
            return res.status(503).json({ error: 'client not ready' });
        }

        const { phone, message } = req.body;

        if (!phone || !message) {
            return res.status(400).json({ error: 'phone and message required' });
        }

        try {
            const sender = createSender(client);
            await sender.send(phone, message);
            res.json({ ok: true });
        } catch (err) {
            console.error('[gateway] send error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE /session
    app.delete('/session', authMiddleware, async (_req, res) => {
        try {
            await client.destroy();
            app.set('ready', false);
            currentQr = null;
            res.json({ ok: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    client.initialize().catch((err) => {
        console.error('[gateway] init error:', err);
    });

    app.listen(port, () => {
        console.log(`[gateway] listening on port ${port}`);
    });
}
