import { DialogHelper } from "zotero-plugin-toolkit";
import { TagDialogData } from "./tagDialogData";
import { CategorialTag } from "./categorialTag";
import { tagManager } from "./manager";
import { getString } from "../utils/locale";

interface Colors {
  foreground: string;
  background: string;
  initialBackground: string;
}

interface ColorState {
  isActive: boolean;
  isFiltered: boolean;
}

const ACTIVE_ITEM_BG = "#efd2ff";
const FILTERED_ITEM_BG = "#b5f1c4";

function getColors({ isActive, isFiltered }: ColorState): Colors {
  let background = "transparent";
  let initialBackground = "transparent";

  if (isActive) {
    background = ACTIVE_ITEM_BG;
    initialBackground = ACTIVE_ITEM_BG;
  } else if (isFiltered) {
    background = FILTERED_ITEM_BG;
  }

  return { foreground: "inherit", background, initialBackground };
}

/**
 * 用于为选中条目增删分类标签的对话框。
 */
export class TagDialogUI {
  private dialog?: DialogHelper;
  private readonly logic: TagDialogData;
  private readonly filterInputElementId = "zotero-categorial-tags-filter-input";

  constructor(selections: Zotero.Item[]) {
    this.logic = new TagDialogData(selections);
  }

  public async open(): Promise<void> {
    if (this.dialog !== undefined) return;

    const dialog = new DialogHelper(3, 1);
    this.dialog = dialog;

    dialog.setDialogData({ itemTags: { ...this.logic.itemTags } });

    dialog.addCell(0, 0, {
      tag: "input",
      id: this.filterInputElementId,
      properties: {
        type: "text",
        placeholder: getString("categorial-tags-filter-placeholder"),
        oninput: (event: Event) => {
          const filterValue = (event.target as HTMLInputElement).value;
          this.logic.filterTags(filterValue);
          this.updateTagStyles();
        },
      },
      styles: {
        marginBottom: "10px",
      },
    });

    dialog.addCell(1, 0, {
      tag: "div",
      styles: {
        userSelect: "none",
        overflowY: "auto",
      },
      children: [
        {
          tag: "table",
          children: [
            {
              tag: "tbody",
              children: tagManager.getAllCategories().map((category) => ({
                tag: "tr",
                styles: {
                  marginBottom: "6px",
                },
                children: [
                  {
                    tag: "th",
                    properties: { innerText: category.name },
                    styles: {
                      whiteSpace: "nowrap", // 避免文字换行
                    },
                  },
                  {
                    tag: "td",
                    children: category.tags.map((tag: CategorialTag) => {
                      const tagState = this.logic.itemTags[tag.tagId];
                      const colors = getColors({
                        isActive: tagState?.active ?? false,
                        isFiltered: tagState?.isFiltered ?? false,
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
                          color: colors.foreground,
                        },
                        listeners: [
                          {
                            type: "click",
                            listener: () => {
                              this.logic.toggleTag(tag.tagId);
                              this.updateTagStyles();
                            },
                          },
                        ],
                      };
                    }),
                  },
                ],
              })),
            },
          ],
        },
      ],
    });

    dialog.addButton(
      getString("categorial-tags-save-and-close"),
      "save-button",
      {
        noClose: false,
        callback: () => {
          void this.handleSaveShortcut();
        },
      },
    );

    dialog.addButton(getString("categorial-tags-cancel"), "close-button", {
      noClose: false,
      callback: () => this.close(),
    });

    const mainWindow = Zotero.getMainWindow();
    const screenWidth = mainWindow.screen.width;
    const screenHeight = mainWindow.screen.height;

    const title = this.logic.dialogTitle;
    const height = Math.min(screenHeight * 0.8, 600); // 高度限制为 600px 或屏幕高度的 80%
    const width = Math.min(screenWidth * 0.8, 800); // 宽度限制为 800px 或屏幕宽度的 80%

    dialog.open(title, {
      centerscreen: true,
      resizable: true,
      height: height,
      width: width,
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    const inputElement = this.document.getElementById(
      this.filterInputElementId,
    );
    if (inputElement instanceof HTMLInputElement) {
      inputElement.focus();
    }

    this.addGlobalKeyListeners();
  }

  private addGlobalKeyListeners(): void {
    this.document.addEventListener("keydown", (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "escape") {
        this.close();
      } else if (key === "enter") {
        void this.handleSaveShortcut();
      }
    });
  }

  private async handleSaveShortcut(): Promise<void> {
    this.close();
    await this.logic.saveChanges();
  }

  private get document(): Document {
    if (!this.dialog) throw new Error("Dialog is not open");
    return this.dialog.window.document;
  }

  public close(): void {
    if (this.dialog === undefined) return;
    this.dialog.window.close();
    this.dialog = undefined;
  }

  private updateTagStyles(): void {
    const useInitial = this.logic.filterValue.length === 0;
    for (const tag of tagManager.getAllTags()) {
      const element = this.document.getElementById(tag.uniqueElementId);
      const tagState = this.logic.itemTags[tag.tagId];
      if (element instanceof HTMLElement && tagState) {
        const colors = getColors({
          isActive: tagState.active,
          isFiltered: tagState.isFiltered,
        });
        element.style.color = colors.foreground;
        element.style.background = useInitial
          ? colors.initialBackground
          : colors.background;
      }
    }
  }
}
