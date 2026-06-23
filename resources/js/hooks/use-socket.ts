import { useEffect, useRef, useState } from 'react';
import { useSocket } from './socket-context';

export function useSocketEvent<T = Record<string, unknown>>(
    channel: string | null,
    event: string,
    callback: (data: T) => void,
    deps: unknown[] = [],
) {
    const { socket } = useSocket();
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        if (!socket || !channel) return;

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
    const onlineUsersRef = useRef<Set<number>>(new Set());
    const [, forceUpdate] = useState(0);

    useEffect(() => {
        if (!socket || !channel) return;

        socket.emit('join', channel);

        socket.on('user:joined', ({ id }: { id: number }) => {
            onlineUsersRef.current.add(id);
            forceUpdate((n) => n + 1);
        });

        socket.on('user:left', ({ id }: { id: number }) => {
            onlineUsersRef.current.delete(id);
            forceUpdate((n) => n + 1);
        });

        socket.emit('presence:subscribe', channel);

        return () => {
            socket.emit('leave', channel);
            socket.off('user:joined');
            socket.off('user:left');
        };
    }, [socket, channel]);

    return { onlineUsers: [...onlineUsersRef.current] };
}
