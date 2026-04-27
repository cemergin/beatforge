// Router implementation — small + greedy.
//
// Address resolution: split target on '.', walk longest-prefix-first.
// `channel.0.color.cutoff` first tries to register/find at the full
// path (rare — registrations usually happen at sub-paths). Then it
// strips one trailing segment at a time looking for a registered
// module, treating the remaining segments as the param name (joined
// with '.'). So registering at `channel.0.color` with a param named
// `cutoff` matches a target of `channel.0.color.cutoff`.
//
// Voice triggers go to exact-match registrations. We don't strip
// segments for voice lookups — voices live at well-known addresses.

import type { ControllableModule } from '../audio-graph/types';
import type {
  EventBus,
  ParamEvent,
  TriggerEvent,
  Unsubscribe,
} from '../events';
import type { Router, VoiceHandler } from './types';

export function makeRouter(): Router {
  const modules = new Map<string, ControllableModule>();
  const voices = new Map<string, VoiceHandler>();

  const registerModule = (address: string, module: ControllableModule): Unsubscribe => {
    modules.set(address, module);
    return () => {
      // Only remove if still the same registration — protects against
      // unsubscribing AFTER a re-registration replaced this module.
      if (modules.get(address) === module) modules.delete(address);
    };
  };

  const registerVoice = (address: string, handler: VoiceHandler): Unsubscribe => {
    voices.set(address, handler);
    return () => {
      if (voices.get(address) === handler) voices.delete(address);
    };
  };

  /** Resolve a dotted address into [module, paramName] by stripping
   *  trailing segments until a registration matches. Returns null
   *  when nothing in the address path is registered. */
  const resolveModule = (target: string): [ControllableModule, string] | null => {
    if (modules.has(target)) {
      // Exact registration on a no-param target — treat as the
      // module's first param. Rare but supported.
      const m = modules.get(target);
      if (m && m.params.length > 0) return [m, m.params[0].name];
      return null;
    }
    const parts = target.split('.');
    for (let cut = parts.length - 1; cut >= 1; cut--) {
      const head = parts.slice(0, cut).join('.');
      const tail = parts.slice(cut).join('.');
      const m = modules.get(head);
      if (m) return [m, tail];
    }
    return null;
  };

  const dispatchParam = (event: ParamEvent): void => {
    const resolved = resolveModule(event.target);
    if (!resolved) return;            // unknown target — silently drop
    const [mod, paramName] = resolved;
    mod.set(paramName, event.value, { when: event.when, ramp: event.ramp });
  };

  const dispatchTrigger = (event: TriggerEvent): void => {
    const handler = voices.get(event.target);
    if (handler) handler(event);
  };

  const bindBus = (bus: EventBus): Unsubscribe => {
    const offParam = bus.on('param', dispatchParam);
    const offTrigger = bus.on('trigger', dispatchTrigger);
    return () => { offParam(); offTrigger(); };
  };

  return { registerModule, registerVoice, bindBus };
}
