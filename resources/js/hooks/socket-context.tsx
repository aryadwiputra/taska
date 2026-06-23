import { createContext, useContext, useEffect, useRef, useState } from 'react';
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
    const [connected, setConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const initializedRef = useRef(false);

    useEffect(() => {
        initializedRef.current = true;

        const baseUrl = import.meta.env.VITE_SOCKETIO_URL || '';

        fetch(`${baseUrl}/api/socket/token`).then((r) => r.json()).then(({ token }) => {
            const socket = io(baseUrl, {
                auth: { token },
                transports: ['websocket'],
            });

            socket.on('connect', () => setConnected(true));
            socket.on('disconnect', () => setConnected(false));
            socketRef.current = socket;
        }).catch(() => {
            // Auth endpoint not available — no realtime
        });

        return () => {
            socketRef.current?.close();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    return useContext(SocketContext);
}
