import { useAsync } from '@/hooks/useAsync';
import { isPersisted, storageEstimate, tickets } from '@/lib/storage';

/** All saved tickets plus storage facts, re-read whenever `version` changes. */
export function useTicketList(version = 0) {
  return useAsync(async () => {
    const [list, estimate, persisted] = await Promise.all([tickets.list(), storageEstimate(), isPersisted()]);
    return { list, estimate, persisted };
  }, [version]);
}

export function useTicket(id: string) {
  return useAsync(() => tickets.get(id), [id]);
}
