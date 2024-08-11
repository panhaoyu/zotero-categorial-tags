import { DialogHelper } from "zotero-plugin-toolkit/dist/helpers/dialog";
import { tagManager } from "./manager";
import type TagJson = _ZoteroTypes.Tags.TagJson;

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
    if (selections.length !== 1) {
      new ztoolkit.ProgressWindow("Tags manager only supports exactly 1 item").show();
      return;
    }

    const selection = selections[0];
    const mapping: {
      [key: string]: {
        tagName: string,
        activated: boolean,
        elementId: string,
        categoryName: string,
        tagJson: TagJson
        tagIndex: number
      }[]
    } = {};

    const categorialTagsList = tagManager.getAllTags();

    categorialTagsList.forEach((tagData, tagIndex) => {
      mapping[tagData.categoryName] ??= [];
      mapping[tagData.categoryName].push({
        categoryName: tagData.categoryName,
        tagIndex: tagIndex,
        tagJson: tagData.tagJson,
        tagName: tagData.tagName,
        activated: false,
        elementId: `tags-dialog-item-${selection.id}-tag-${tagIndex}`
      });
    });

    const tags = tagManager.getTagsOfItem(selection);
    tags.forEach(tagData => {
      mapping[tagData.categoryName].find(v2 => v2.tagName === tagData.tagName)!.activated = true;
    });

    const tagsToChange: { [key in string]: boolean } = {};

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
              children: Object.entries(mapping).map(
                ([categoryName, tagsData]) => ({
                  tag: "tr",
                  styles: {
                    marginBottom: "6px"
                  },
                  children: [
                    { tag: "th", properties: { innerText: categoryName } },
                    {
                      tag: "td",
                      styles: {
                        maxWidth: "800px"
                      },
                      children: tagsData.map((tagData) => ({
                        tag: "span",
                        id: tagData.elementId,
                        properties: { innerText: tagData.tagName },
                        styles: {
                          marginLeft: "8px",
                          background: tagData.activated
                            ? "#e5beff"
                            : "#00000000",
                          whiteSpace: "nowrap",
                          cursor: "pointer"
                        },
                        listeners: [
                          {
                            type: "click",
                            listener: (evt: MouseEvent) => {
                              tagData.activated = !tagData.activated;
                              const element: HTMLSpanElement =
                                dialog.window.document.querySelector(
                                  `#${tagData.elementId}`
                                );
                              element.style.background = tagData.activated
                                ? "#e5beff"
                                : "#00000000";
                              tagsToChange[tagData.tagJson.tag] =
                                tagData.activated;
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
        Object.entries(tagsToChange).forEach(([tagName, activation]) => {
          if (activation) {
            selection.addTag(tagName);
          } else {
            selection.removeTag(tagName);
          }
          selection.save();
        });
      }
    });

    dialog.addButton("Cancel", "close-button", { noClose: false });

    dialog.open("Tags", { centerscreen: true, fitContent: true });
    this.currentDialog = dialog;

    dialog.window.addEventListener("keyup", (event) => {
      if (event.key.toLowerCase() === "escape") {
        this.closeCurrentDialog();
      }
    });
  }
}

export const shortcutsManager = new ShortcutManager();