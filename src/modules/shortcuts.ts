import { CommandKey, PrefDefault, PrefKey } from "./constants";
import Message from "./message";
import { getString } from "../utils/locale";
import { TagDialogUI } from "./tagDialogUI";
import { getPref } from "../utils/prefs";
import Item = Zotero.Item;
import ReaderTab = _ZoteroTypes.ReaderTab;
import { logger } from "../utils/logger";

// Interface defining keyboard shortcut options
interface KeyOptions {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  key: string | null;
}

class ShortcutManager {
  constructor() {
    // Initialize properties or events here if needed
  }

  /**
   * Parses a shortcut string and returns the corresponding key options.
   * @param shortcut - The shortcut string, e.g., "Ctrl+Shift+T".
   * @returns The parsed keyboard options.
   */
  private parseShortcut(shortcut: string): KeyOptions {
    const keys = shortcut.toLowerCase().split("+").map(k => k.trim());

    // Initialize modifier keys and main key
    const keyOptions: KeyOptions = {
      ctrl: false,
      shift: false,
      alt: false,
      meta: false,
      key: null
    };

    // Map modifier keys and main key
    keys.forEach(k => {
      switch (k) {
        case "ctrl":
        case "control":
          keyOptions.ctrl = true;
          break;
        case "shift":
          keyOptions.shift = true;
          break;
        case "alt":
          keyOptions.alt = true;
          break;
        case "meta":
        case "command":
        case "cmd":
          keyOptions.meta = true;
          break;
        default:
          keyOptions.key = k;
      }
    });

    return keyOptions;
  }

  /**
   * Registers the keyboard shortcut event listener.
   */
  public async register(): Promise<void> {
    const shortcut = getPref<string>(PrefKey.shortcut) ?? PrefDefault.shortcut;
    const keyOptions = this.parseShortcut(shortcut);
    logger.info(`Registering shortcut: ${shortcut}, parsed: ${JSON.stringify(keyOptions)}`);

    // Register keyboard event listener
    ztoolkit.Keyboard.register((ev) => {
      if (
        ev.type === "keydown" &&
        ev.ctrlKey === keyOptions.ctrl &&
        ev.shiftKey === keyOptions.shift &&
        ev.altKey === keyOptions.alt &&
        ev.metaKey === keyOptions.meta &&
        ev.key?.toLowerCase() === keyOptions.key
      ) {
        logger.info("Shortcut triggered: opening tags tab");
        addon.hooks.onShortcuts(CommandKey.openTagTab);

      }
    });
  }

  /**
   * Callback function triggered by the shortcut to open the tags dialog.
   */
  public async openTagsTabCallback(): Promise<void> {
    logger.info("Opening tags tab callback started");
    const currentPane = Zotero.getActiveZoteroPane();
    const tabs = currentPane.getState().tabs;
    const currentTab = tabs.find(tab => tab.selected);

    if (!currentTab) {
      logger.info("No active tab found");
      Message.error("Cannot find the currently selected tab to apply categorical tags.");
      return;
    }

    let selections: Item[] = [];
    logger.info(`Current tab type: ${currentTab.type}`);

    switch (currentTab.type) {
      case "reader":
        const readerData = currentTab.data as ReaderTab;
        const selectedItemId = readerData.itemID;
        logger.info(`Reader tab itemID: ${selectedItemId}`);

        if (!selectedItemId) {
          logger.info("No item ID in reader tab");
          Message.error("Cannot identify the current item ID to apply categorical tags.");
          return;
        }

        const selectedItem = Zotero.Items.get(selectedItemId);
        if (selectedItem) {
          selections.push(selectedItem);
        }
        break;

      case "library":
        selections = currentPane.getSelectedItems();
        logger.info(`Library tab selections: ${selections.length} items`);
        break;

      default:
        logger.info(`Unsupported tab type: ${currentTab.type}`);
        Message.error(`Unsupported tab type: "${currentTab.type}".`);
        return;
    }

    // Retrieve the top-level parent for each selected item, ignoring notes or PDF files
    selections = selections.map(item => {
      let parent = item;
      while (parent.parentItem) {
        parent = parent.parentItem;
      }
      return parent;
    });

    logger.info(`Processed selections: ${selections.length} items`);
    if (selections.length === 0) {
      logger.info("No valid selections after processing");
      const hint = getString("categorial-tags-no-selection-hint");
      Message.info(hint);
      return;
    }

    logger.info("Opening tag dialog");
    const tagDialog = new TagDialogUI(selections);
    await tagDialog.open();
  }
}

// Instantiate and export the shortcut manager
export const shortcutsManager = new ShortcutManager();
