import { CommandKey, PrefDefault, PrefKey } from "./constants";
import Message from "./message";
import { getString } from "../utils/locale";
import { TagDialogUI } from "./tagDialogUI";
import { getPref } from "../utils/prefs";
import { parseShortcut } from "./shortcutParser";
import { logger } from "../utils/logger";

/**
 * 处理打开标签对话框的全局快捷键。
 */
export class ShortcutManager {
  private unregisterKeyboard?: () => void;

  /**
   * 注册键盘快捷键事件监听。
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
   * 移除已注册的键盘快捷键监听。
   */
  public unregister(): void {
    this.unregisterKeyboard?.();
    this.unregisterKeyboard = undefined;
  }

  /**
   * 快捷键触发时打开标签对话框的回调。
   */
  public async openTagsTabCallback(): Promise<void> {
    logger.info("Opening tags tab callback started");
    const currentPane = Zotero.getActiveZoteroPane();
    if (!currentPane) {
      logger.info("No active Zotero pane found");
      Message.error(getString("categorial-tags-error-no-active-tab"));
      return;
    }

    const tabs = currentPane.getState().tabs;
    const currentTab = tabs.find((tab) => tab.selected);

    if (!currentTab) {
      logger.info("No active tab found");
      Message.error(getString("categorial-tags-error-no-active-tab"));
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
          Message.error(getString("categorial-tags-error-no-item-id"));
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
        Message.error(
          getString("categorial-tags-error-unsupported-tab", {
            args: { type: currentTab.type },
          }),
        );
        return;
    }

    // 将每个选中条目归到其顶层父条目（忽略笔记或 PDF 附件）
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

// 导出快捷键管理器单例
export const shortcutsManager = new ShortcutManager();
