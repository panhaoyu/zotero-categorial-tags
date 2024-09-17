import { DialogHelper } from "zotero-plugin-toolkit/dist/helpers/dialog";
import { TagDialogData } from "./tagDialogData";
import { CategorialTag } from "./categorialTag";
import { tagManager } from "./manager";

export class TagDialogUI {
  private dialog?: DialogHelper;
  private logic: TagDialogData;

  private readonly filterInputElementId: string = "zotero-categorial-tags-filter-input";

  constructor(selections: Zotero.Item[]) {
    this.logic = new TagDialogData(selections);
  }

  public async open() {
    if (this.dialog !== undefined) return;

    this.dialog = new DialogHelper(3, 1);

    this.dialog.setDialogData({ itemTags: { ...this.logic.itemTags } });

    this.dialog.addCell(0, 0, {
      tag: "input",
      id: this.filterInputElementId,
      properties: {
        type: "text",
        placeholder: "Filter tags...",
        oninput: (e: Event) => {
          const filterValue = (e.target as HTMLInputElement).value;
          this.logic.filterTags(filterValue);
          this.updateTagStyles();
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
                        background: this.logic.itemTags[tagData.tagId].active ? "#e5beff" : "transparent",
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                        padding: "2px",
                        borderRadius: "4px",
                        display: "inline-block",
                        color: this.logic.itemTags[tagData.tagId].isFiltered ? "inherit" : "gray"
                      },
                      listeners: [
                        {
                          type: "click",
                          listener: () => {
                            this.logic.toggleTag(tagData.tagId);
                            this.updateTagStyles();
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
        this.logic.saveChanges();
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
    const height = Math.min(screenHeight * 0.8, 600); // Limit height to 600px or 80% of screen height
    const width = Math.min(screenWidth * 0.8, 800);   // Limit width to 800px or 80% of screen width

    this.dialog.open(title, {
      centerscreen: true,
      resizable: true,
      height: height,
      width: width
    });

    await new Promise(resolve => setTimeout(resolve, 300));


    this.document.getElementById(this.filterInputElementId).focus();

    this.document.addEventListener("keyup", event => {
      if (event.key.toLowerCase() === "escape") {
        this.close();
      } else if (event.key.toLowerCase() === "enter") {
        this.logic.saveChanges();
        this.close();
      }
    });
  }

  get document(): Document {
    return this.dialog?.window.document!;
  }

  public close() {
    if (this.dialog === undefined) return;
    this.dialog.window.close();
    this.dialog = undefined;
  }

  private updateTagStyles() {
    tagManager.getAllTags().forEach(tagData => {
      const element = this.document.getElementById(tagData.uniqueElementId) as HTMLSpanElement;
      const tagState = this.logic.itemTags[tagData.tagId];
      if (element && tagState) {
        element.style.color = tagState.isFiltered ? "inherit" : "gray";
        element.style.background = tagState.active ? "#e5beff" : "transparent";
      }
    });
  }
}