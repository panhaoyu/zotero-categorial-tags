import { tagManager } from "./manager";
import { getString } from "../utils/locale";
import { DialogHelper } from "zotero-plugin-toolkit/dist/helpers/dialog";
import { CategorialTag } from "./categorialTag";


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
  private selections: Zotero.Item[];
  private dialogTitle: string;

  constructor(selections: Zotero.Item[]) {
    this.selections = selections;
    this.itemTags = {};
    this.dialogTitle = "";


    this.initialize();
  }

  private initialize() {

    if (this.selections.length === 0) {
      throw new Error("No selections provided");
    }


    const initialTags = this.selections[0].getTags().map(tagObj => tagObj.tag);


    const commonTags = this.selections.slice(1).reduce((acc, selection) => {
      const selectionTags = selection.getTags().map(tagObj => tagObj.tag);
      return acc.filter(tag => selectionTags.includes(tag));
    }, initialTags);


    const selectionItemsTitle =
      this.selections.length === 1
        ? this.selections[0].getDisplayTitle()
        : getString(`categorial-tags-selection-titles`, { args: { length: this.selections.length } });
    this.dialogTitle = getString("categorial-tags-dialog-title", { args: { selectionTitles: selectionItemsTitle } });


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


    this.dialog = new DialogHelper(3, 1);


    const dialogData: DialogData = {
      itemTags: { ...this.itemTags }
    };
    this.dialog.setDialogData(dialogData);


    this.dialog.addCell(0, 0, {
      tag: "input",
      properties: {
        type: "text",
        placeholder: "Filter tags...",
        oninput: (e: Event) => {
          const filterValue = (e.target as HTMLInputElement).value.toLowerCase();


          tagManager.getAllTags().forEach(tagData => {
            const element = this.dialog!.window.document.querySelector(`#${tagData.uniqueElementId}`) as HTMLSpanElement;
            if (element) {
              const isVisible = tagData.tagName.toLowerCase().includes(filterValue);
              element.style.display = isVisible ? "inline-block" : "none";
              element.style.color = isVisible ? "inherit" : "gray";
            }
          });
        }
      },
      styles: {
        marginBottom: "10px",
        padding: "5px",
        width: "98%"
      }
    });


    this.dialog.addCell(1, 0, {
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
                          : "transparent",
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


    this.dialog.addButton("Save and close", "save-button", {
      noClose: false,
      callback: () => {
        this.saveChanges();
        this.close();
      }
    });


    this.dialog.addButton("Cancel", "close-button", {
      noClose: false,
      callback: () => this.close()
    });


    this.dialog.open(this.dialogTitle, {
      centerscreen: true,
      fitContent: true
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

  private toggleTag(tagId: number, elementId: string) {
    if (!this.dialog) return;

    const tagState = this.dialog.dialogData.itemTags[tagId];
    if (tagState) {
      tagState.active = !tagState.active;
      tagState.changed = true;


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
