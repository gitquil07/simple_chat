import { useEffect, useRef, useState } from 'react';
import { deleteNotification, receiveNotification } from '../api/greenApi';
import type { Credentials, NotificationBody } from '../types';

export type PollingState = 'connecting' | 'online' | 'error';

const RETRY_DELAY_MS = 3000;

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      resolve();
    });
  });

/**
 * Long-polls ReceiveNotification and acknowledges every notification with DeleteNotification,
 * one at a time, so the queue keeps its FIFO order.
 */
export function useNotificationPolling(
  creds: Credentials,
  onNotification: (body: NotificationBody) => void,
): PollingState {
  const [state, setState] = useState<PollingState>('connecting');
  const handlerRef = useRef(onNotification);

  useEffect(() => {
    handlerRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function loop() {
      while (!signal.aborted) {
        try {
          const notification = await receiveNotification(creds, signal);
          if (signal.aborted) return;
          setState('online');
          if (!notification) continue;
          handlerRef.current(notification.body);
          await deleteNotification(creds, notification.receiptId);
        } catch {
          if (signal.aborted) return;
          setState('error');
          await wait(RETRY_DELAY_MS, signal);
        }
      }
    }

    void loop();
    return () => controller.abort();
  }, [creds]);

  return state;
}
