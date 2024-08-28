import { DialogHelper } from "zotero-plugin-toolkit/dist/helpers/dialog";
import { tagManager } from "./manager";
import { getString } from "../utils/locale";

class ShortcutManager {
  currentDialog: DialogHelper | undefined = undefined;


  constructor() {
  }

  async register() {
    ztoolkit.Keyboard.register((ev, keyOptions) => {
      if (ev.type === "keyup" && ev.ctrlKey && (ev.key as string).toLowerCase() === "t") {
        addon.hooks.onShortcuts("open-tag-tab");
      }
    });
  }

  async closeCurrentDialog() {
    try {
      if (this.currentDialog === undefined) return;
      this.currentDialog.window.close();
      this.currentDialog = undefined;
    } catch (e) {
      ztoolkit.log("Error closing dialog" as any, e);
    }
  }

  async openTagsTabCallback() {
    await this.closeCurrentDialog();

    const selections = ZoteroPane.getSelectedItems();
    if (selections.length === 0) {
      return;
    }

    // 获取所有选中的文献的标签交集
    const itemTagNames = selections
      .map(selection => selection.getTags().map(i => i.tag))
      .reduce((acc, tags) => acc.filter(tag => tags.includes(tag)), selections[0].getTags().map(i => i.tag));


    const selectionItemsTitle = selections.length === 1
      ? selections[0].getDisplayTitle()
      : getString(`categorial-tags-selection-titles`, { args: { length: selections.length } });
    const dialogTitle = getString("categorial-tags-dialog-title", { args: { selectionTitles: selectionItemsTitle } });

    const itemTags: {
      [key: number]: {
        changed: boolean
        active: boolean
      }
    } = Object.fromEntries(
      tagManager.getAllTags()
        .map(i => [i.tagId, {
          changed: false,
          active: itemTagNames.includes(i.fullName)
        }])
    );

    if (this.currentDialog !== undefined) {
      return;
    }

    const dialog = new ztoolkit.Dialog(2, 1);

    dialog.addCell(0, 0, {
      tag: "div",
      styles: {
        userSelect: "none"
      },
      children: [
        {
          tag: "table",
          children: [
            {
              tag: "tbody",
              children: tagManager.getAllCategories().map(
                category => ({
                  tag: "tr",
                  styles: {
                    marginBottom: "6px"
                  },
                  children: [
                    { tag: "th", properties: { innerText: category.name } },
                    {
                      tag: "td",
                      styles: {
                        maxWidth: "800px"
                      },
                      children: category.tags.map((tagData) => ({
                        tag: "span",
                        id: tagData.uniqueElementId,
                        properties: { innerText: tagData.tagName },
                        styles: {
                          marginLeft: "8px",
                          background: itemTags[tagData.tagId].active
                            ? "#e5beff"
                            : "#00000000",
                          whiteSpace: "nowrap",
                          cursor: "pointer"
                        },
                        listeners: [
                          {
                            type: "click",
                            listener: (evt: MouseEvent) => {
                              itemTags[tagData.tagId].active = !itemTags[tagData.tagId].active;
                              itemTags[tagData.tagId].changed = true;
                              const element: HTMLSpanElement =
                                dialog.window.document.querySelector(
                                  `#${tagData.uniqueElementId}`
                                );
                              element.style.background = itemTags[tagData.tagId].active
                                ? "#e5beff"
                                : "#00000000";
                            }
                          }
                        ]
                      }))
                    }
                  ]
                })
              )
            }
          ]
        }
      ]
    });

    dialog.addButton("Save and close", "save-button", {
      noClose: false,
      callback: (ev) => {
        Object.entries(itemTags).forEach(([tagId, activeData]) => {
          if (!activeData.changed) return;
          const tag = tagManager.getTag(tagId);
          if (tag === undefined) return;
          selections.forEach(selection => {
            if (activeData.active) {
              selection.addTag(tag.fullName);
            } else {
              selection.removeTag(tag.fullName);
            }
            selection.save();
          });
        });
      }
    });

    dialog.addButton("Cancel", "close-button", { noClose: false });

    dialog.open(dialogTitle, { centerscreen: true, fitContent: true });
    this.currentDialog = dialog;

    dialog.window.addEventListener("keyup", (event) => {
      if (event.key.toLowerCase() === "escape") {
        this.closeCurrentDialog();
      }
    });
  }
}

export const shortcutsManager = new ShortcutManager();