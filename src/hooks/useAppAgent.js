import { useEffect, useRef } from 'react';
import { agentEventBus } from '../utils/ai/agentEventBus';

/**
 * useAppAgent — Hook for applications to expose live context and actions to UltraSudo Copilot.
 *
 * @param {Object} config
 * @param {string} config.appId - Unique application identifier (e.g. 'healthy-kitchen')
 * @param {string} config.appName - Human-friendly app name (e.g. 'Healthy Kitchen')
 * @param {Function} config.getContext - Function returning live state object or snapshot
 * @param {Array<string>} [config.suggestedPrompts] - Array of 2-4 starter prompt chips
 * @param {Array<Object>} [config.actions] - List of actions { name, description, parameters, isDestructive, handler }
 */
export function useAppAgent({
  appId,
  appName,
  getContext,
  suggestedPrompts = [],
  actions = [],
}) {
  const getContextRef = useRef(getContext);
  getContextRef.current = getContext;

  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    if (!appId) return;

    const buildRegistrationPayload = () => {
      const contextData = getContextRef.current ? getContextRef.current() : null;
      return {
        appId,
        appName: appName || appId,
        contextData,
        suggestedPrompts,
        actions: (actionsRef.current || []).map((act) => ({
          name: act.name,
          description: act.description,
          parameters: act.parameters || {},
          isDestructive: !!act.isDestructive,
          handler: act.handler,
        })),
      };
    };

    // Register on mount
    agentEventBus.registerApp(buildRegistrationPayload());

    // Listen for requests to refresh context
    const handleContextRequest = () => {
      agentEventBus.registerApp(buildRegistrationPayload());
    };

    window.addEventListener('ultrasudo:request-context', handleContextRequest);

    return () => {
      window.removeEventListener('ultrasudo:request-context', handleContextRequest);
      agentEventBus.unregisterApp(appId);
    };
  }, [appId, appName, suggestedPrompts]);

  // Provide a function to manually trigger a context refresh when local state updates
  const refreshContext = () => {
    if (!appId) return;
    const contextData = getContextRef.current ? getContextRef.current() : null;
    agentEventBus.registerApp({
      appId,
      appName: appName || appId,
      contextData,
      suggestedPrompts,
      actions: (actionsRef.current || []).map((act) => ({
        name: act.name,
        description: act.description,
        parameters: act.parameters || {},
        isDestructive: !!act.isDestructive,
        handler: act.handler,
      })),
    });
  };

  return { refreshContext };
}
