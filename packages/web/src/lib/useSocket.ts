'use client';

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useSWRConfig } from 'swr';
import { WS_EVENTS, type WsEventName } from '@fleeted/shared';

import { useAuth } from './auth';
import { useToast } from './toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function ridesKeyMatcher(key: unknown): boolean {
  return typeof key === 'string' && key.startsWith('/api/');
}

export function useSocket(): Socket | null {
  const { session } = useAuth();
  const { mutate } = useSWRConfig();
  const { toast } = useToast();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!session?.token) return;

    const socket = io(API_BASE, { auth: { token: session.token } });
    socketRef.current = socket;

    const handlers: Array<[WsEventName, () => void]> = [
      [
        WS_EVENTS.RIDE_NEW,
        () => {
          toast({ message: 'New ride request received' });
          void mutate(ridesKeyMatcher);
        },
      ],
      [
        WS_EVENTS.OFFER_ACCEPTED,
        () => {
          void mutate(ridesKeyMatcher);
        },
      ],
      [
        WS_EVENTS.RIDE_CONFIRMED,
        () => {
          toast({ kind: 'success', message: 'Ride confirmed' });
          void mutate(ridesKeyMatcher);
        },
      ],
      [
        WS_EVENTS.RIDE_CANCELLED,
        () => {
          toast({ kind: 'error', message: 'A ride was cancelled' });
          void mutate(ridesKeyMatcher);
        },
      ],
      [
        WS_EVENTS.RIDE_STARTED,
        () => {
          toast({ message: 'Ride started — chauffeur on the way' });
          void mutate(ridesKeyMatcher);
        },
      ],
      [
        WS_EVENTS.RIDE_COMPLETED,
        () => {
          toast({ kind: 'success', message: 'Ride completed' });
          void mutate(ridesKeyMatcher);
        },
      ],
    ];

    for (const [event, handler] of handlers) {
      socket.on(event, handler);
    }
    socket.on(WS_EVENTS.READY, () => {
      console.log('[ws] connected to realtime gateway');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [session?.token, mutate, toast]);

  return socketRef.current;
}
