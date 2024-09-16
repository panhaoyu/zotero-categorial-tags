import { tagManager } from "./manager";
import { getString } from "../utils/locale";
import { DialogHelper } from "zotero-plugin-toolkit/dist/helpers/dialog";
import { CategorialTag } from "./categorialTag";

// 定义 Selection 接口以提高类型安全性
interface Selection {
  getTags(): Array<{ tag: string }>;

  getDisplayTitle(): string;

  addTag(tagName: string): void;

  removeTag(tagName: string): void;

  save(): void;
}

// 定义 TagState 接口
interface TagState {
  changed: boolean;
  active: boolean;
}

export class TagDialog {
  private dialog?: DialogHelper;
  private itemTags: { [key: number]: TagState };
  private selections: Selection[]; // 已调整为具体类型
  private dialogTitle: string;

  constructor(selections: Selection[]) { // 已调整为具体类型
    this.selections = selections;
    this.itemTags = {};
    this.dialogTitle = "";

    // 初始化 itemTags 和 dialogTitle
    this.initialize();
  }

  private initialize() {
    const initialTags = this.selections[0].getTags().map(tagObj => tagObj.tag);
    const commonTags = this.selections.slice(1).reduce((acc, selection) => {
      const selectionTags = selection.getTags().map(tagObj => tagObj.tag);
      return acc.filter(tag => selectionTags.includes(tag));
    }, initialTags);

    const selectionItemsTitle = this.selections.length === 1
      ? this.selections[0].getDisplayTitle()
      : getString(`categorial-tags-selection-titles`, { args: { length: this.selections.length } });
    this.dialogTitle = getString("categorial-tags-dialog-title", { args: { selectionTitles: selectionItemsTitle } });

    this.itemTags = Object.fromEntries(
      tagManager.getAllTags()
        .map(i => [i.tagId, {
          changed: false,
          active: commonTags.includes(i.fullName)
        }])
    );
  }

  public open() {
    if (this.dialog !== undefined) return;

    this.dialog = new DialogHelper(2, 1); // 替换为 DialogHelper

    this.dialog.addCell(0, 0, {
      tag: "div",
      styles: {
        userSelect: "none",
        maxHeight: "800px",
        overflowY: "auto"
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
                      children: category.tags.map((tagData: CategorialTag) => ({
                        tag: "span",
                        id: tagData.uniqueElementId,
                        properties: { innerText: tagData.tagName },
                        styles: {
                          marginLeft: "8px",
                          background: this.itemTags[tagData.tagId].active
                            ? "#e5beff"
                            : "transparent", // 替换透明颜色
                          whiteSpace: "nowrap",
                          cursor: "pointer"
                        },
                        listeners: [
                          {
                            type: "click",
                            listener: () => {
                              this.toggleTag(tagData.tagId, tagData.uniqueElementId);
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

    this.dialog.addButton("Save and close", "save-button", {
      noClose: false,
      callback: () => {
        this.saveChanges();
        this.close();
      }
    });

    this.dialog.addButton("Cancel", "close-button", { noClose: false, callback: () => this.close() });

    this.dialog.open(this.dialogTitle, { centerscreen: true, fitContent: true });

    this.dialog.window.addEventListener("keyup", event => {
      if (event.key.toLowerCase() === "escape") {
        this.close();
      }
    });
  }

  public close() {
    if (this.dialog === undefined) return;
    this.dialog.window.close();
    this.dialog = undefined;
  }

  private toggleTag(tagId: number, elementId: string) {
    this.itemTags[tagId].active = !this.itemTags[tagId].active;
    this.itemTags[tagId].changed = true;
    const element: HTMLSpanElement | null = this.dialog?.window.document.querySelector(`#${elementId}`);
    if (element) {
      element.style.background = this.itemTags[tagId].active
        ? "#e5beff"
        : "transparent"; // 替换透明颜色
    }
  }

  private saveChanges() {
    Object.entries(this.itemTags).forEach(([tagId, activeData]) => {
      if (!activeData.changed) return;
      const tag = tagManager.getTag(Number(tagId));
      if (tag === undefined) return;
      this.selections.forEach(selection => {
        if (activeData.active) {
          selection.addTag(tag.fullName);
        } else {
          selection.removeTag(tag.fullName);
        }
        selection.save();
      });
    });
  }
}
