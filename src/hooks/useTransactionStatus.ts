'use client';

import { paymentsService } from '@/services/payments.service';
import { FlutterwaveVerifyResponse } from '@/types';
import { useCallback, useEffect, useRef, useState } from 'react';

const POLL_INTERVAL_MS = 3000;
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

interface UseTransactionStatusReturn {
  transaction: FlutterwaveVerifyResponse | null;
  isPolling: boolean;
  timedOut: boolean;
  stop: () => void;
}

/**
 * Polls the Flutterwave verify endpoint every 3 seconds until the payment
 * reaches a terminal state (success | failed | cancelled) or 5 minutes elapse.
 */
export function useTransactionStatus(txRef: string | null): UseTransactionStatusReturn {
  const [transaction, setTransaction] = useState<FlutterwaveVerifyResponse | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [timedOut, setTimedOut] = useState<boolean>(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef<boolean>(false);

  const stop = useCallback((): void => {
    stoppedRef.current = true;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPolling(false);
  }, []);

  useEffect(() => {
    if (!txRef) { return; }

    stoppedRef.current = false;
    setIsPolling(true);
    setTimedOut(false);
    setTransaction(null);

    const poll = async (): Promise<void> => {
      if (stoppedRef.current) { return; }

      try {
        const result = await paymentsService.flutterwaveVerify(txRef);
        setTransaction(result);

        const isTerminal = result.status === 'success' || result.status === 'failed' || result.status === 'cancelled';
        if (isTerminal) {
          stop();
        }
      } catch {
        // Swallow — keep polling
      }
    };

    // Poll immediately then on interval
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    // Global timeout
    timeoutRef.current = setTimeout(() => {
      if (!stoppedRef.current) {
        setTimedOut(true);
        stop();
      }
    }, TIMEOUT_MS);

    return () => { stop(); };
  }, [txRef, stop]);

  return { transaction, isPolling, timedOut, stop };
}
