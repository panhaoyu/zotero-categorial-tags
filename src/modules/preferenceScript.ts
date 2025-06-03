import { getPref, setPref } from "../utils/prefs";
import { ElementID, PrefDefault, PrefKey } from "./constants";
import { logger } from "../utils/logger";

export async function registerPrefsScripts(_window: Window) {
  addon.data.prefs.window = _window;
  updatePrefsUI().then();
  bindPrefEvents();
}

function getElement<T extends Element>(elementId: string): T {
  const window = addon.data.prefs.window;
  if (window === undefined) throw "Window not found";
  const result = window.document.querySelector(elementId);
  if (!result) throw `Element not found: ${elementId}`;
  return result as T;
}

async function updatePrefsUI() {
  getElement<HTMLInputElement>(ElementID.shortcutKeyInput).value = getPref<string>(PrefKey.shortcut) ?? PrefDefault.shortcut;
}

function bindPrefEvents() {
  getElement<HTMLInputElement>(ElementID.shortcutKeyInput).addEventListener("change", e => {
    const element = e.target as HTMLInputElement;
    const newShortcut = element.value;
    setPref(PrefKey.shortcut, newShortcut);
    logger.info(`Shortcut key updated to: ${newShortcut}`);
  });
}
