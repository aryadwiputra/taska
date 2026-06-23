import { createServer as createHttpServer } from 'http';
import express from 'express';
import { Server } from 'socket.io';

export function createServer() {
    const app = express();
    const httpServer = createHttpServer(app);
    const io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    app.use(express.json());

    // Health / status
    app.get('/health', (_req, res) => {
        res.json({ ok: true, rooms: io.engine?.clientsCount ?? 0 });
    });

    // Internal broadcast from Laravel
    app.post('/broadcast', (req, res) => {
        const auth = req.headers['authorization'];

        if (auth !== `Bearer ${process.env.LARAVEL_API_TOKEN}`) {
            return res.status(401).json({ error: 'unauthorized' });
        }

        const { channel, event, data } = req.body;

        if (!channel || !event) {
            return res.status(400).json({ error: 'channel and event required' });
        }

        io.to(channel).emit(event, data ?? {});
        res.json({ ok: true });
    });

    // Socket.IO auth middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error('auth token required'));
        }

        // Validate via Laravel
        const laravelUrl = process.env.LARAVEL_URL || 'http://localhost:8000';

        fetch(`${laravelUrl}/api/socket/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        })
            .then((r) => r.json())
            .then((result) => {
                if (!result.valid) {
                    return next(new Error('invalid token'));
                }

                socket.data.user = result.user;
                socket.data.rooms = result.rooms ?? [];

                // Join user to personal room
                if (result.user?.id) {
                    socket.join(`user.${result.user.id}`);
                }

                // Join project rooms from auth result
                if (result.rooms) {
                    for (const room of result.rooms) {
                        socket.join(room);
                    }
                }

                next();
            })
            .catch((err) => next(new Error('auth service unavailable')));
    });

    // Handle connection
    io.on('connection', (socket) => {
        console.log('[realtime] connected:', socket.data.user?.id);

        socket.on('join', (room) => {
            if (typeof room === 'string') {
                socket.join(room);
            }
        });

        socket.on('leave', (room) => {
            if (typeof room === 'string') {
                socket.leave(room);
            }
        });

        socket.on('disconnect', (reason) => {
            console.log('[realtime] disconnected:', socket.data.user?.id, reason);
        });
    });

    return { httpServer, io, app };
}
