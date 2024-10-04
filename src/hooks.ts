import { config } from "../package.json";
import { initLocale } from "./utils/locale";
import { registerPrefsScripts } from "./modules/preferenceScript";
import { createZToolkit } from "./utils/ztoolkit";
import { columnManager } from "./modules/column";
import { shortcutsManager } from "./modules/shortcuts";
import { preferenceManager } from "./modules/prefs";
import { tagManager } from "./modules/manager";

async function onStartup() {
  ztoolkit.log("onStartup started");
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise
  ]);
  ztoolkit.log("Zotero initialization completed");
  initLocale();
  ztoolkit.log("Initializing managers");
  await tagManager.register();
  await columnManager.register();
  await preferenceManager.register();
  await shortcutsManager.register();
  ztoolkit.log("Managers initialized");
}

async function onMainWindowLoad(win: Window): Promise<void> {  // Create ztoolkit for every window
  addon.data.ztoolkit = createZToolkit();
  ztoolkit.log("onMainWindowLoad executed");  // @ts-ignore This is a moz feature
  window.MozXULElement.insertFTLIfNeeded(`${config.addonRef}-mainWindow.ftl`);
}

async function onMainWindowUnload(win: Window): Promise<void> {

  ztoolkit.log("onMainWindowUnload executed");
  ztoolkit.unregisterAll();
  addon.data.dialog?.window?.close();
}

function onShutdown(): void {
  ztoolkit.unregisterAll();
  addon.data.dialog?.window?.close();
  // Remove addon object
  addon.data.alive = false;
  delete Zotero[config.addonInstance];
}

/**
 * This function is just an example of dispatcher for Preference UI events.
 * Any operations should be placed in a function to keep this function clear.
 * @param type event type
 * @param data event data
 */
async function onPrefsEvent(type: string, data: { [key: string]: any }) {
  ztoolkit.log(`onPrefsEvent triggered with type: ${type}`);
  switch (type) {
    case "load":
      registerPrefsScripts(data.window);
      break;
    default:
      return;
  }
}

function onShortcuts(type: string) {
  ztoolkit.log(`onShortcuts triggered with type: ${type}`);
  switch (type) {
    case "open-tag-tab":
      shortcutsManager.openTagsTabCallback().then();
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
  onShortcuts
};