import { CommandKey, PrefDefault, PrefKey } from "./constants";
import Message from "./message";
import { getString } from "../utils/locale";
import { TagDialogUI } from "./tagDialogUI";
import { getPref } from "../utils/prefs";
import { parseShortcut } from "./shortcutParser";
import { logger } from "../utils/logger";

/**
 * Handles the global shortcut that opens the tag dialog.
 */
export class ShortcutManager {
  private unregisterKeyboard?: () => void;

  /**
   * Registers the keyboard shortcut event listener.
   */
  public async register(): Promise<void> {
    const shortcut = getPref(PrefKey.shortcut) ?? PrefDefault.shortcut;
    const keyOptions = parseShortcut(shortcut);
    logger.info(
      `Registering shortcut: ${shortcut}, parsed: ${JSON.stringify(keyOptions)}`,
    );

    const callback = (event: KeyboardEvent): void => {
      if (
        event.type === "keydown" &&
        event.ctrlKey === keyOptions.ctrl &&
        event.shiftKey === keyOptions.shift &&
        event.altKey === keyOptions.alt &&
        event.metaKey === keyOptions.meta &&
        event.key?.toLowerCase() === keyOptions.key
      ) {
        logger.info("Shortcut triggered: opening tags tab");
        addon.hooks.onShortcuts(CommandKey.openTagTab);
      }
    };

    ztoolkit.Keyboard.register(callback);
    this.unregisterKeyboard = () => {
      ztoolkit.Keyboard.unregister(callback);
    };
  }

  /**
   * Removes the registered keyboard shortcut listener.
   */
  public unregister(): void {
    this.unregisterKeyboard?.();
    this.unregisterKeyboard = undefined;
  }

  /**
   * Callback function triggered by the shortcut to open the tags dialog.
   */
  public async openTagsTabCallback(): Promise<void> {
    logger.info("Opening tags tab callback started");
    const currentPane = Zotero.getActiveZoteroPane();
    if (!currentPane) {
      logger.info("No active Zotero pane found");
      Message.error(
        "Cannot find the currently selected tab to apply categorical tags.",
      );
      return;
    }

    const tabs = currentPane.getState().tabs;
    const currentTab = tabs.find((tab) => tab.selected);

    if (!currentTab) {
      logger.info("No active tab found");
      Message.error(
        "Cannot find the currently selected tab to apply categorical tags.",
      );
      return;
    }

    let selections: Zotero.Item[] = [];
    logger.info(`Current tab type: ${currentTab.type}`);

    switch (currentTab.type) {
      case "reader": {
        const readerData = currentTab.data as
          _ZoteroTypes.ReaderTab | undefined;
        const selectedItemId = readerData?.itemID;
        logger.info(`Reader tab itemID: ${selectedItemId}`);

        if (!selectedItemId) {
          logger.info("No item ID in reader tab");
          Message.error(
            "Cannot identify the current item ID to apply categorical tags.",
          );
          return;
        }

        const selectedItem = Zotero.Items.get(selectedItemId);
        if (selectedItem !== false) {
          selections.push(selectedItem);
        }
        break;
      }

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
    selections = selections.map((item) => {
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
