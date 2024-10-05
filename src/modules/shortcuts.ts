import { CommandKey, PrefDefault, PrefKey } from "./constants";
import Message from "./message";
import { getString } from "../utils/locale";
import { TagDialogUI } from "./tagDialogUI";
import { getPref } from "../utils/prefs";

class ShortcutManager {
  constructor() {
  }

  // Method to parse the shortcut string
  parseShortcut(shortcut: string) {
    // Convert the shortcut to lower case and split by '+'
    const keys = shortcut.toLowerCase().split("+").map(k => k.trim());

    // Initialize the modifiers and key
    const keyOptions = {
      ctrl: false,
      shift: false,
      alt: false,
      meta: false,
      key: null
    };

    // Map the modifier keys
    keys.forEach(k => {
      if (k === "ctrl" || k === "control") {
        keyOptions.ctrl = true;
      } else if (k === "shift") {
        keyOptions.shift = true;
      } else if (k === "alt") {
        keyOptions.alt = true;
      } else if (k === "meta" || k === "command" || k === "cmd") {
        keyOptions.meta = true;
      } else {
        keyOptions.key = k;
      }
    });

    return keyOptions;
  }

  async register() {
    const shortcut = getPref<string>(PrefKey.shortcut) ?? PrefDefault.shortcut;
    ztoolkit.log(`Registering shortcut: ${shortcut}`);
    const keyOptions = this.parseShortcut(shortcut);

    // Register the keyboard event
    ztoolkit.Keyboard.register((ev) => {
      if (
        ev.type === "keyup" &&
        ev.ctrlKey === keyOptions.ctrl &&
        ev.shiftKey === keyOptions.shift &&
        ev.altKey === keyOptions.alt &&
        ev.metaKey === keyOptions.meta &&
        (ev.key ?? "").toLowerCase() == keyOptions.key
      ) {
        addon.hooks.onShortcuts(CommandKey.openTagTab);
      }
    });
  }

  async openTagsTabCallback() {
    const selections = ZoteroPane.getSelectedItems();
    if (selections.length === 0) {
      const hint = getString("categorial-tags-no-selection-hint");
      Message.info(hint);
      return;
    }

    // Create and open TagDialog
    const tagDialog = new TagDialogUI(selections);
    await tagDialog.open();
  }
}

export const shortcutsManager = new ShortcutManager();
