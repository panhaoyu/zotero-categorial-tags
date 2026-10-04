import { config } from "../package.json";
import { initLocale } from "./utils/locale";
import { registerPrefsScripts } from "./modules/preferenceScript";
import { createZToolkit } from "./utils/ztoolkit";
import { columnManager } from "./modules/column";
import { shortcutsManager } from "./modules/shortcuts";
import { preferenceManager } from "./modules/prefs";
import { tagManager } from "./modules/manager";
import { CommandKey } from "./modules/constants";
import { logger } from "./utils/logger";

/**
 * Data passed to `onPrefsEvent` from the preference pane XHTML.
 */
export interface PrefsEventData {
  window: Window;
}

async function onStartup(): Promise<void> {
  logger.info("onStartup started");
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);
  logger.info("Zotero initialization completed");
  initLocale();
  logger.info("Initializing managers");
  await tagManager.register();
  await columnManager.register();
  await preferenceManager.register();
  await shortcutsManager.register();
  logger.info("Managers initialized");
}

async function onMainWindowLoad(_win: Window): Promise<void> {
  addon.data.ztoolkit = createZToolkit();
  logger.info("onMainWindowLoad executed");
}

async function onMainWindowUnload(_win: Window): Promise<void> {
  logger.info("onMainWindowUnload executed");
  ztoolkit.unregisterAll();
  addon.data.dialog?.window?.close();
}

function onShutdown(): void {
  logger.info("onShutdown executed");
  shortcutsManager.unregister();
  tagManager.unregister();
  columnManager.unregister();
  ztoolkit.unregisterAll();
  addon.data.dialog?.window?.close();
  // Remove addon object
  addon.data.alive = false;
  delete (Zotero as unknown as Record<string, unknown>)[config.addonInstance];
}

/**
 * This function is just an example of dispatcher for Preference UI events.
 * Any operations should be placed in a function to keep this function clear.
 * @param type event type
 * @param data event data
 */
async function onPrefsEvent(type: string, data: PrefsEventData): Promise<void> {
  logger.info(`onPrefsEvent triggered with type: ${type}`);
  switch (type) {
    case "load":
      await registerPrefsScripts(data.window);
      break;
    default:
      return;
  }
}

const lastTriggeredTimes: Record<string, number> = {};

function onShortcuts(type: string): void {
  const now = Date.now();
  if (lastTriggeredTimes[type] && now - lastTriggeredTimes[type] < 100) {
    return;
  }
  lastTriggeredTimes[type] = now;

  logger.info(`onShortcuts triggered with type: ${type}`);
  switch (type) {
    case CommandKey.openTagTab:
      void shortcutsManager.openTagsTabCallback();
      break;
    default:
      break;
  }
}

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
  onPrefsEvent,
  onShortcuts,
};
