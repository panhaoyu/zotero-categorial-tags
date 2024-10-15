import { tagManager } from "./manager";
import { getString } from "../utils/locale";
import { TagFilter } from "./tagFilter";

interface TagState {
  changed: boolean;
  active: boolean;
  isFiltered: boolean;
}

export class TagDialogData {
  public itemTags: { [key: number]: TagState };
  public dialogTitle: string;
  public tagFilter: TagFilter;
  private selections: Zotero.Item[];

  constructor(selections: Zotero.Item[]) {
    this.selections = selections;
    this.itemTags = {};
    this.dialogTitle = "";

    const allTags = tagManager.getAllTags().map(tagData => tagData.tagName);
    this.tagFilter = new TagFilter(allTags);

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
          active: commonTags.includes(i.fullName),
          isFiltered: true
        }
      ])
    );
  }

  public filterTags(filterValue: string) {
    const filterResults = this.tagFilter.filterTags(filterValue);
    tagManager.getAllTags().forEach((tagData, index) => {
      const tagState = this.itemTags[tagData.tagId];
      if (tagState) {
        tagState.isFiltered = filterResults[index];
      }
    });
  }

  public toggleTag(tagId: number) {
    const tagState = this.itemTags[tagId];
    if (tagState) {
      tagState.active = !tagState.active;
      tagState.changed = true;
    }
  }

  public async saveChanges() {
    for (const [tagId, activeData] of Object.entries(this.itemTags)) {
      if (!activeData.changed) continue;
      const tag = tagManager.getTag(Number(tagId));
      if (tag === undefined) continue;
      for (const selection of this.selections) {
        if (activeData.active) {
          selection.addTag(tag.fullName);
        } else {
          selection.removeTag(tag.fullName);
        }
        await selection.saveTx();
      }
    }
  }
}