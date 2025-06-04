import { getPref, setPref } from "../utils/prefs";
import { ElementID, PrefDefault, PrefKey } from "./constants";
import { logger } from "../utils/logger";
import { DialogHelper } from "zotero-plugin-toolkit";

export async function registerPrefsScripts(_window: Window) {
  logger.debug("Registering preferences scripts");
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
  const shortcut = getPref<string>(PrefKey.shortcut) ?? PrefDefault.shortcut;
  logger.debug(`Updating UI with shortcut: ${shortcut}`);
  getElement<HTMLInputElement>(ElementID.shortcutKeyInput).value = shortcut;
}

function bindPrefEvents() {
  logger.debug("Binding preference UI events");

  getElement<HTMLInputElement>(ElementID.shortcutKeyInput).addEventListener("change", e => {
    const element = e.target as HTMLInputElement;
    const newShortcut = element.value;
    setPref(PrefKey.shortcut, newShortcut);
    logger.info(`Shortcut key updated to: ${newShortcut}`);
  });

  getElement<HTMLButtonElement>(ElementID.captureShortcutButton).addEventListener("click", () => {
    logger.debug("Shortcut capture button clicked");
    void showShortcutCaptureDialog();
  });
}

async function showShortcutCaptureDialog() {
  logger.info("Showing shortcut capture dialog");

  const dialog = new DialogHelper(1, 1);
  const inputId = "shortcut-capture-input";

  dialog.addCell(0, 0, {
    tag: "div",
    styles: { padding: "10px" },
    children: [
      {
        tag: "label",
        properties: { value: "Press any key combination:" }
      },
      {
        tag: "input",
        id: inputId,
        properties: { type: "text", readonly: true },
        styles: { margin: "10px 0", fontSize: "14px" }
      },
      {
        tag: "description",
        properties: { textContent: "Press any key combination (e.g. Ctrl+Shift+K). The combination will appear above." },
        styles: { maxWidth: "300px" }
      }
    ]
  });

  dialog.addButton("Accept", "accept-button", {
    noClose: false,
    callback: () => {
      const inputElement = dialog.window.document.getElementById(inputId) as HTMLInputElement;
      if (inputElement && inputElement.value) {
        setPref(PrefKey.shortcut, inputElement.value);
        logger.info(`Dialog accepted new shortcut: ${inputElement.value}`);
        updatePrefsUI();
      }
    }
  });

  dialog.addButton("Cancel", "cancel-button", {
    noClose: false,
    callback: () => {
      logger.info("Shortcut capture canceled by user");
    }
  });

  // Set dialog data with load callback
  dialog.setDialogData({
    loadCallback: () => {
      const inputElement = dialog.window.document.getElementById(inputId) as HTMLInputElement;
      if (!inputElement) {
        logger.error("Input element not found in dialog");
        return;
      }
      inputElement.focus();

      dialog.window.addEventListener("keydown", (e: KeyboardEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.key === "Escape") {
          logger.info("Escape pressed, closing dialog");
          dialog.window.close();
          return;
        }

        // Skip Tab and Enter keys
        if (e.key === "Tab" || e.key === "Enter") return;

        const keys = [];
        if (e.ctrlKey) keys.push("Ctrl");
        if (e.altKey) keys.push("Alt");
        if (e.shiftKey) keys.push("Shift");
        if (e.metaKey) keys.push("Meta");

        // Exclude modifier keys when pressed alone
        if (!["Control", "Alt", "Shift", "Meta"].includes(e.key)) {
          keys.push(e.key);
        }

        if (keys.length > 0) {
          const newShortcut = keys.join("+");
          inputElement.value = newShortcut;
          logger.debug(`Key combination captured: ${newShortcut}`);
        }
      });
    }
  });

  dialog.open("Capture Shortcut", {
    centerscreen: true,
    resizable: false,
    width: 400,
    height: 200
  });
}