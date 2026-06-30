import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

interface SocketContextValue {
    socket: Socket | null;
    connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
    socket: null,
    connected: false,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        let currentSocket: Socket | null = null;

        const baseUrl = import.meta.env.VITE_SOCKETIO_URL || '';

        fetch('/api/socket/token', { credentials: 'include' })
            .then((r) => {
                if (!r.ok) {
                    throw new Error('auth failed');
                }

                return r.json();
            })
            .then(({ token }) => {
                if (!token) {
                    return;
                }

                const s = io(baseUrl, {
                    auth: { token },
                    transports: ['websocket'],
                });

                s.on('connect', () => setConnected(true));
                s.on('connect_error', () => setConnected(false));
                s.on('disconnect', () => setConnected(false));
                setSocket(s);
                currentSocket = s;
            })
            .catch(() => {
                // Auth endpoint not available — no realtime
            });

        return () => {
            currentSocket?.close();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    return useContext(SocketContext);
}
