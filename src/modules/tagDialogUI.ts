import { DialogHelper } from "zotero-plugin-toolkit/dist/helpers/dialog";
import { TagDialogBackend, TagDialogData } from "./tagDialogBackend";
import { CategorialTag } from "./categorialTag";
import { tagManager } from "./manager";

export class TagDialogUI {
  private dialog?: DialogHelper;
  private logic: TagDialogBackend;

  constructor(selections: Zotero.Item[]) {
    this.logic = new TagDialogBackend(selections);
  }

  public open() {
    if (this.dialog !== undefined) return;

    this.dialog = new DialogHelper(3, 1);

    const dialogData: TagDialogData = {
      itemTags: { ...this.logic.itemTags }
    };
    this.dialog.setDialogData(dialogData);

    this.dialog.addCell(0, 0, {
      tag: "input",
      properties: {
        type: "text",
        placeholder: "Filter tags...",
        oninput: (e: Event) => {
          const filterValue = (e.target as HTMLInputElement).value;
          this.logic.filterTags(filterValue, dialogData);
          this.updateTagStyles(dialogData);
        }
      },
      styles: {
        marginBottom: "10px"
      }
    });

    this.dialog.addCell(1, 0, {
      tag: "div",
      styles: {
        userSelect: "none",
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
                    children: category.tags.map((tagData: CategorialTag) => ({
                      tag: "span",
                      id: tagData.uniqueElementId,
                      properties: { innerText: tagData.tagName },
                      styles: {
                        marginLeft: "4px",
                        background: dialogData.itemTags[tagData.tagId].active ? "#e5beff" : "transparent",
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                        padding: "2px",
                        borderRadius: "4px",
                        display: "inline-block",
                        color: dialogData.itemTags[tagData.tagId].isFiltered ? "inherit" : "gray"
                      },
                      listeners: [
                        {
                          type: "click",
                          listener: () => {
                            this.logic.toggleTag(tagData.tagId, dialogData);
                            this.updateTagStyles(dialogData);
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

    this.dialog.addButton("Save and close", "save-button", {
      noClose: false,
      callback: () => {
        this.logic.saveChanges(dialogData);
        this.close();
      }
    });

    this.dialog.addButton("Cancel", "close-button", {
      noClose: false,
      callback: () => this.close()
    });

    const mainWindow = Zotero.getMainWindow();
    const screenWidth = mainWindow.screen.width;
    const screenHeight = mainWindow.screen.height;

    const title = this.logic.dialogTitle;
    const height = screenHeight * 0.8;
    const width = screenWidth * 0.8;

    this.dialog.open(title, {
      centerscreen: true,
      resizable: false,
      height: height,
      width: width
    });

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

  private updateTagStyles(dialogData: TagDialogData) {
    tagManager.getAllTags().forEach(tagData => {
      const element = this.dialog!.window.document.querySelector(`#${tagData.uniqueElementId}`) as HTMLSpanElement;
      const tagState = dialogData.itemTags[tagData.tagId];
      if (element && tagState) {
        element.style.color = tagState.isFiltered ? "inherit" : "gray";
        element.style.background = tagState.active ? "#e5beff" : "transparent";
      }
    });
  }
}
