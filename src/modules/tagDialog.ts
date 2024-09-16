import { tagManager } from "./manager";
import { getString } from "../utils/locale";

export class TagDialog {
  private dialog;
  private itemTags: {
    [key: number]: {
      changed: boolean;
      active: boolean;
    };
  };
  private selections: any[]; // 根据实际类型调整
  private dialogTitle: string;

  constructor(selections: any[]) { // 根据实际类型调整
    this.selections = selections;
    this.itemTags = {};
    this.dialogTitle = "";

    // 初始化 itemTags 和 dialogTitle
    this.initialize();
  }

  private initialize() {
    const itemTagNames = this.selections
      .map(selection => selection.getTags().map((i: any) => i.tag))
      .reduce((acc: string[], tags: string[]) => acc.filter(tag => tags.includes(tag)), this.selections[0].getTags().map((i: any) => i.tag));

    const selectionItemsTitle = this.selections.length === 1
      ? this.selections[0].getDisplayTitle()
      : getString(`categorial-tags-selection-titles`, { args: { length: this.selections.length } });
    this.dialogTitle = getString("categorial-tags-dialog-title", { args: { selectionTitles: selectionItemsTitle } });

    this.itemTags = Object.fromEntries(
      tagManager.getAllTags()
        .map(i => [i.tagId, {
          changed: false,
          active: itemTagNames.includes(i.fullName)
        }])
    );
  }

  public open() {
    if (this.dialog !== undefined) {
      return;
    }

    this.dialog = new ztoolkit.Dialog(2, 1);

    this.dialog.addCell(0, 0, {
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
                          background: this.itemTags[tagData.tagId].active
                            ? "#e5beff"
                            : "#00000000",
                          whiteSpace: "nowrap",
                          cursor: "pointer"
                        },
                        listeners: [
                          {
                            type: "click",
                            listener: (evt: MouseEvent) => {
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

    this.dialog.window.addEventListener("keyup", (event) => {
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
        : "#00000000";
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
