// SessionContext + useSession() live here (not next to the
// SessionProvider component) so React-refresh's "only export
// components" rule stays satisfied — the .tsx file ships ONLY the
// Provider component.

import { createContext, useContext } from 'react';
import type { Session } from './types';

export const SessionContext = createContext<Session | null>(null);

/** Read the session. Must be called inside a SessionProvider — throws
 *  loudly if not, so missing providers fail in dev rather than
 *  silently no-op. */
export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession() called outside SessionProvider — wrap your component in <SessionProvider>.');
  }
  return ctx;
}
