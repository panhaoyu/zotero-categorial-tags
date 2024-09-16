import { TagDialogUI } from "./tagDialogUI"; // 引入新的 TagDialog 类

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
      return;
    }

    // 创建并打开 TagDialog
    const tagDialog = new TagDialogUI(selections);
    tagDialog.open();
  }
}

export const shortcutsManager = new ShortcutManager();
