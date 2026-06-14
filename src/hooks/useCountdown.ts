import { useEffect, useState } from 'react';
import { getCountdown } from '@/utils';

export const useCountdown = (deadline: string) => {
  const [countdown, setCountdown] = useState(() => getCountdown(deadline));

  useEffect(() => {
    if (countdown.expired) return;

    const timer = setInterval(() => {
      const next = getCountdown(deadline);
      setCountdown(next);
      if (next.expired) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline, countdown.expired]);

  return countdown;
};
