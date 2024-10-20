import { CommandKey, PrefDefault, PrefKey } from "./constants";
import Message from "./message";
import { getString } from "../utils/locale";
import { TagDialogUI } from "./tagDialogUI";
import { getPref } from "../utils/prefs";
import Item = Zotero.Item;
import ReaderTab = _ZoteroTypes.ReaderTab;

interface KeyOptions {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  key: string | null;
}

class ShortcutManager {
  constructor() {
  }

  // Method to parse the shortcut string
  parseShortcut(shortcut: string) {
    // Convert the shortcut to lower case and split by '+'
    const keys = shortcut.toLowerCase().split("+").map(k => k.trim());

    // Initialize the modifiers and key
    const keyOptions: KeyOptions = {
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
    const keyOptions: KeyOptions = this.parseShortcut(shortcut);

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
    const currentPane = Zotero.getActiveZoteroPane();
    const libraryId = currentPane.getSelectedLibraryID();
    const tabs = currentPane.getState().tabs;
    const currentTab = tabs.find(i => i.selected);
    if (!currentTab) {
      Message.error("Categorial tags cannot find the current selected tab.");
      return;
    }
    let selections: Item[];
    switch (currentTab.type) {
      case "reader":
        const tabData = currentTab.data as ReaderTab;
        const selectedItemId = tabData.itemID;
        if (!selectedItemId) {
          Message.error(`Categorial tags cannot identify the current item id: "${selectedItemId}".`);
          return;
        }
        let selectedItem = Zotero.Items.get(selectedItemId);
        selections = [selectedItem];
        break;
      case "library":
        selections = currentPane.getSelectedItems();
        break;
      default:
        Message.error(`Categorial tags cannot identify the current tab type: "${currentTab.type}".`);
        return;
    }

    // Only the outer item is used for categorial tags.
    // Tag for note or PDF file is not useful.
    selections = selections.map(i => {
      while (i.parentItem) {
        i = i.parentItem;
      }
      return i;
    });

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
