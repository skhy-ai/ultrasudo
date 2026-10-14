/**
 * UltraSudo — Agent Event Bus Protocol
 * Facilitates bidirectional state and action exchange between the AI Copilot
 * and active applications (both Native React components and Iframe apps).
 */

const EVENT_REGISTER_CONTEXT = 'ultrasudo:register-context';
const EVENT_REQUEST_CONTEXT = 'ultrasudo:request-context';
const EVENT_EXECUTE_ACTION = 'ultrasudo:execute-action';
const EVENT_ACTION_RESULT = 'ultrasudo:action-result';

class AgentEventBus {
  constructor() {
    this.activeContext = null;
    this.listeners = new Set();
    this.actionHandlers = new Map();

    if (typeof window !== 'undefined') {
      window.addEventListener(EVENT_REGISTER_CONTEXT, (e) => {
        if (e.detail) {
          this.activeContext = e.detail;
          this.notifyContextSubscribers();
        }
      });

      window.addEventListener(EVENT_ACTION_RESULT, (e) => {
        // Broadcasted back from applications
      });

      // PostMessage bridge for iframed apps
      window.addEventListener('message', (e) => {
        if (!e.data || typeof e.data !== 'object') return;
        if (e.data.type === EVENT_REGISTER_CONTEXT) {
          this.activeContext = e.data.detail;
          this.notifyContextSubscribers();
        }
      });
    }
  }

  /**
   * Register context for an active app
   */
  registerApp(context) {
    this.activeContext = context;
    if (context.actions) {
      context.actions.forEach((act) => {
        this.actionHandlers.set(act.name, act.handler);
      });
    }
    this.notifyContextSubscribers();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(EVENT_REGISTER_CONTEXT, { detail: context })
      );
    }
  }

  /**
   * Unregister when an app unmounts
   */
  unregisterApp(appId) {
    if (this.activeContext && this.activeContext.appId === appId) {
      if (this.activeContext.actions) {
        this.activeContext.actions.forEach((act) => {
          this.actionHandlers.delete(act.name);
        });
      }
      this.activeContext = null;
      this.notifyContextSubscribers();
    }
  }

  /**
   * Get current live context
   */
  getCurrentContext() {
    return this.activeContext;
  }

  /**
   * Request context update from the currently active screen
   */
  requestContextUpdate() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_REQUEST_CONTEXT));
      // Also postMessage to any iframes on screen
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach((f) => {
        try {
          f.contentWindow?.postMessage({ type: EVENT_REQUEST_CONTEXT }, '*');
        } catch (_) {}
      });
    }
    return this.activeContext;
  }

  /**
   * Dispatch an action to be executed by the active app
   */
  async executeAction(actionName, params) {
    // 1. Direct handler registered in local map
    const localHandler = this.actionHandlers.get(actionName);
    if (localHandler) {
      try {
        const result = await localHandler(params);
        return { success: true, result };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    // 2. Dispatch CustomEvent for listening React components
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        window.removeEventListener(EVENT_ACTION_RESULT, onResult);
        resolve({ success: false, error: 'Action execution timed out' });
      }, 5000);

      const onResult = (e) => {
        if (e.detail && e.detail.actionName === actionName) {
          clearTimeout(timeout);
          window.removeEventListener(EVENT_ACTION_RESULT, onResult);
          resolve(e.detail);
        }
      };

      window.addEventListener(EVENT_ACTION_RESULT, onResult);

      const eventPayload = { actionName, params };
      window.dispatchEvent(
        new CustomEvent(EVENT_EXECUTE_ACTION, { detail: eventPayload })
      );

      // Also forward to iframes
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach((f) => {
        try {
          f.contentWindow?.postMessage(
            { type: EVENT_EXECUTE_ACTION, detail: eventPayload },
            '*'
          );
        } catch (_) {}
      });
    });
  }

  /**
   * Subscribe to context changes
   */
  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.activeContext);
    return () => this.listeners.delete(callback);
  }

  notifyContextSubscribers() {
    this.listeners.forEach((cb) => cb(this.activeContext));
  }
}

export const agentEventBus = new AgentEventBus();
