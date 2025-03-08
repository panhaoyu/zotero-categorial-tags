import { DialogHelper } from "zotero-plugin-toolkit";
import { TagDialogData } from "./tagDialogData";
import { CategorialTag } from "./categorialTag";
import { tagManager } from "./manager";

interface Colors {
  foreground: string;
  background: string;
  initialBackground: string;
}

const ACTIVE_ITEM_BG = "#efd2ff";
const FILTERED_ITEM_BG = "#b5f1c4";

function getColors({ tag, isActive, isFiltered }: {
  tag: CategorialTag,
  isActive: boolean,
  isFiltered: boolean
}): Colors {
  let foreground = "inherit";
  let background = "transparent";
  let initialBackground = "transparent";

  if (isActive) {
    background = ACTIVE_ITEM_BG;
    initialBackground = ACTIVE_ITEM_BG;
  } else if (isFiltered) {
    background = FILTERED_ITEM_BG;
  }

  return { foreground, background, initialBackground };
}

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
                  {
                    tag: "th",
                    properties: { innerText: category.name },
                    styles: {
                      whiteSpace: "nowrap"  // Ensure text does not wrap
                    }
                  },
                  {
                    tag: "td",
                    children: category.tags.map((tag: CategorialTag) => {
                      const isFiltered = this.logic.itemTags[tag.tagId].isFiltered;
                      const isActive = this.logic.itemTags[tag.tagId].active;
                      const colors = getColors({
                        tag: tag, isActive, isFiltered
                      });
                      return {
                        tag: "span",
                        id: tag.uniqueElementId,
                        properties: { innerText: tag.tagName },
                        styles: {
                          marginLeft: "4px",
                          background: colors.initialBackground,
                          whiteSpace: "nowrap",
                          cursor: "pointer",
                          padding: "2px",
                          borderRadius: "4px",
                          display: "inline-block",
                          color: colors.foreground
                        },
                        listeners: [
                          {
                            type: "click",
                            listener: () => {
                              this.logic.toggleTag(tag.tagId);
                              this.updateTagStyles();
                            }
                          }
                        ]
                      };
                    })
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
      callback: async () => await this.handleSaveShortcut()
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

    const inputElement = this.document.getElementById(this.filterInputElementId) as HTMLInputElement | null;
    if (inputElement) {
      inputElement.focus();
    }

    this.addGlobalKeyListeners();
  }

  private addGlobalKeyListeners() {
    this.document.addEventListener("keydown", async event => {
      if (event.key.toLowerCase() === "escape") {
        this.handleCloseShortcut();
      } else if (event.key.toLowerCase() === "enter") {
        await this.handleSaveShortcut();
      }
    });
  }

  private handleCloseShortcut() {
    this.close();
  }

  private async handleSaveShortcut() {
    this.close();
    await this.logic.saveChanges();
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
    const useInitial = this.logic.filterValue.length == 0;
    tagManager.getAllTags().forEach(tag => {
      const element = this.document.getElementById(tag.uniqueElementId) as HTMLSpanElement;
      const tagState = this.logic.itemTags[tag.tagId];
      if (element && tagState) {
        const colors = getColors({ tag: tag, isFiltered: tagState.isFiltered, isActive: tagState.active });
        element.style.color = colors.foreground;
        element.style.background = useInitial ? colors.initialBackground : colors.background;
      }
    });
  }
}