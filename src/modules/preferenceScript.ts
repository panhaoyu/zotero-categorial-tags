import { getPref, setPref } from "../utils/prefs";
import { ElementID, PrefDefault, PrefKey } from "./constants";
import { logger } from "../utils/logger";
import { DialogHelper } from "zotero-plugin-toolkit";

const SHORTCUT_CAPTURE_INPUT_ID = "shortcut-capture-input";

export async function registerPrefsScripts(window: Window): Promise<void> {
  logger.debug("Registering preferences scripts");
  addon.data.prefs.window = window;
  await updatePrefsUI();
  bindPrefEvents();
}

function getElement<T extends Element>(elementId: string): T {
  const window = addon.data.prefs.window;
  if (window === undefined) throw new Error("Preference window not found");
  const result = window.document.querySelector(elementId);
  if (!result) throw new Error(`Element not found: ${elementId}`);
  return result as T;
}

async function updatePrefsUI(): Promise<void> {
  const shortcut = getPref(PrefKey.shortcut) ?? PrefDefault.shortcut;
  logger.debug(`Updating UI with shortcut: ${shortcut}`);
  getElement<HTMLInputElement>(ElementID.shortcutKeyInput).value = shortcut;
}

function bindPrefEvents(): void {
  logger.debug("Binding preference UI events");

  getElement<HTMLInputElement>(ElementID.shortcutKeyInput).addEventListener(
    "change",
    (event: Event) => {
      const newShortcut = (event.target as HTMLInputElement).value;
      setPref(PrefKey.shortcut, newShortcut);
      logger.info(`Shortcut key updated to: ${newShortcut}`);
    },
  );

  getElement<HTMLButtonElement>(
    ElementID.captureShortcutButton,
  ).addEventListener("click", () => {
    logger.debug("Shortcut capture button clicked");
    void showShortcutCaptureDialog();
  });
}

async function showShortcutCaptureDialog(): Promise<void> {
  logger.info("Showing shortcut capture dialog");

  const dialog = new DialogHelper(1, 1);

  dialog.addCell(0, 0, {
    tag: "div",
    styles: { padding: "10px" },
    children: [
      {
        tag: "label",
        properties: { value: "Press any key combination:" },
      },
      {
        tag: "input",
        id: SHORTCUT_CAPTURE_INPUT_ID,
        properties: { type: "text", readonly: true },
        styles: { margin: "10px 0", fontSize: "14px" },
      },
      {
        tag: "description",
        properties: {
          textContent:
            "Press any key combination (e.g. Ctrl+Shift+K). The combination will appear above.",
        },
        styles: { maxWidth: "300px" },
      },
    ],
  });

  dialog.addButton("Accept", "accept-button", {
    noClose: false,
    callback: () => {
      const inputElement = dialog.window.document.getElementById(
        SHORTCUT_CAPTURE_INPUT_ID,
      );
      if (inputElement instanceof HTMLInputElement && inputElement.value) {
        setPref(PrefKey.shortcut, inputElement.value);
        logger.info(`Dialog accepted new shortcut: ${inputElement.value}`);
        void updatePrefsUI();
      }
    },
  });

  dialog.addButton("Cancel", "cancel-button", {
    noClose: false,
    callback: () => {
      logger.info("Shortcut capture canceled by user");
    },
  });

  // Set dialog data with load callback
  dialog.setDialogData({
    loadCallback: () => {
      const inputElement = dialog.window.document.getElementById(
        SHORTCUT_CAPTURE_INPUT_ID,
      );
      if (!(inputElement instanceof HTMLInputElement)) {
        logger.error("Input element not found in dialog");
        return;
      }
      inputElement.focus();

      dialog.window.addEventListener("keydown", (event: KeyboardEvent) => {
        event.preventDefault();
        event.stopPropagation();

        if (event.key === "Escape") {
          logger.info("Escape pressed, closing dialog");
          dialog.window.close();
          return;
        }

        // Skip Tab and Enter keys
        if (event.key === "Tab" || event.key === "Enter") return;

        const keys: string[] = [];
        if (event.ctrlKey) keys.push("Ctrl");
        if (event.altKey) keys.push("Alt");
        if (event.shiftKey) keys.push("Shift");
        if (event.metaKey) keys.push("Meta");

        // Exclude modifier keys when pressed alone
        if (!["Control", "Alt", "Shift", "Meta"].includes(event.key)) {
          keys.push(event.key);
        }

        if (keys.length > 0) {
          const newShortcut = keys.join("+");
          inputElement.value = newShortcut;
          logger.debug(`Key combination captured: ${newShortcut}`);
        }
      });
    },
  });

  dialog.open("Capture Shortcut", {
    centerscreen: true,
    resizable: false,
    width: 400,
    height: 200,
  });
}
