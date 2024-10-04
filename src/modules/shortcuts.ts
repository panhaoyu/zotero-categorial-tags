import { TagDialogUI } from "./tagDialogUI";
import { getString } from "../utils/locale";
import Message from "./message"; // 引入新的 TagDialog 类

class ShortcutManager {
  constructor() {
  }

  async register() {
    ztoolkit.Keyboard.register((ev, keyOptions) => {
      if (ev.type === "keyup" && ev.ctrlKey && (ev.key as string).toLowerCase() === "t") {
        addon.hooks.onShortcuts("open-tag-tab");
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

    // 创建并打开 TagDialog
    const tagDialog = new TagDialogUI(selections);
    await tagDialog.open();
  }
}

export const shortcutsManager = new ShortcutManager();
