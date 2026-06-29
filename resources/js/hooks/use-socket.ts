import { useEffect, useRef, useState } from 'react';
import { useSocket } from './socket-context';

export function useSocketEvent<T = Record<string, unknown>>(
    channel: string | null,
    event: string,
    callback: (data: T) => void,
) {
    const { socket } = useSocket();
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        if (!socket || !channel) {
            return;
        }

        const handler = (data: T) => {
            callbackRef.current(data);
        };

        socket.on(event, handler);

        return () => {
            socket.off(event, handler);
        };
    }, [socket, channel, event]);
}

export function useSocketPresence(channel: string | null) {
    const { socket } = useSocket();
    const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (!socket || !channel) {
            return;
        }

        socket.emit('join', channel);

        socket.on('user:joined', ({ id }: { id: number }) => {
            setOnlineUsers((prev) => new Set(prev).add(id));
        });

        socket.on('user:left', ({ id }: { id: number }) => {
            setOnlineUsers((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        });

        socket.emit('presence:subscribe', channel);

        return () => {
            socket.emit('leave', channel);
            socket.off('user:joined');
            socket.off('user:left');
        };
    }, [socket, channel]);

    return { onlineUsers: [...onlineUsers] };
}
