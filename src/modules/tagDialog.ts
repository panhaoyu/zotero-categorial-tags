import { tagManager } from "./manager";
import { getString } from "../utils/locale";
import { DialogHelper } from "zotero-plugin-toolkit/dist/helpers/dialog";
import { CategorialTag } from "./categorialTag";

type Selection = Zotero.Item;

interface TagState {
  changed: boolean;
  active: boolean;
}

interface DialogData {
  itemTags: { [key: number]: TagState };
}

export class TagDialog {
  private dialog?: DialogHelper;
  private itemTags: { [key: number]: TagState };
  private selections: Selection[];
  private dialogTitle: string;

  constructor(selections: Selection[]) {
    this.selections = selections;
    this.itemTags = {};
    this.dialogTitle = "";

    // 初始化 itemTags 和 dialogTitle
    this.initialize();
  }

  private initialize() {
    if (this.selections.length === 0) {
      throw new Error("No selections provided");
    }

    // 获取第一个选中项的标签
    const initialTags = this.selections[0].getTags().map(tagObj => tagObj.tag);

    // 计算所有选中项共有的标签
    const commonTags = this.selections.slice(1).reduce((acc, selection) => {
      const selectionTags = selection.getTags().map(tagObj => tagObj.tag);
      return acc.filter(tag => selectionTags.includes(tag));
    }, initialTags);

    // 设置对话框标题
    const selectionItemsTitle =
      this.selections.length === 1
        ? this.selections[0].getDisplayTitle()
        : getString(`categorial-tags-selection-titles`, { args: { length: this.selections.length } });
    this.dialogTitle = getString("categorial-tags-dialog-title", { args: { selectionTitles: selectionItemsTitle } });

    // 初始化 itemTags，根据 commonTags 设置 active 状态
    this.itemTags = Object.fromEntries(
      tagManager.getAllTags().map(i => [
        i.tagId,
        {
          changed: false,
          active: commonTags.includes(i.fullName)
        }
      ])
    );
  }

  public open() {
    if (this.dialog !== undefined) return;

    this.dialog = new DialogHelper(2, 1); // 使用 DialogHelper

    // 设置 dialogData
    const dialogData: DialogData = {
      itemTags: { ...this.itemTags } // 使用已初始化的 itemTags
    };
    this.dialog.setDialogData(dialogData);

    // 构建对话框内容
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
              children: tagManager.getAllCategories().map(category => ({
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
                        background: dialogData.itemTags[tagData.tagId].active
                          ? "#e5beff"
                          : "transparent", // 根据 active 状态设置背景
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                        padding: "4px",
                        borderRadius: "4px",
                        display: "inline-block"
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
              }))
            }
          ]
        }
      ]
    });

    // 添加按钮
    this.dialog.addButton("Save and close", "save-button", {
      noClose: false,
      callback: () => {
        this.saveChanges();
        this.close();
      }
    });

    this.dialog.addButton("Cancel", "close-button", { noClose: false, callback: () => this.close() });

    // 打开对话框
    this.dialog.open(this.dialogTitle, { centerscreen: true, fitContent: true });

    // 监听 Esc 键关闭对话框
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
    if (!this.dialog) return;

    const tagState = this.dialog.dialogData.itemTags[tagId];
    if (tagState) {
      tagState.active = !tagState.active;
      tagState.changed = true;

      // 手动更新 DOM 元素的样式
      const element: HTMLSpanElement | null = this.dialog.window.document.querySelector(`#${elementId}`);
      if (element) {
        element.style.background = tagState.active ? "#e5beff" : "transparent";
      }
    }
  }

  private saveChanges() {
    if (!this.dialog) return;

    const itemTags: { [key: number]: TagState } = this.dialog.dialogData.itemTags;
    Object.entries(itemTags).forEach(([tagId, activeData]) => {
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
