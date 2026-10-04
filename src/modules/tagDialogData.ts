import { tagManager } from "./manager";
import { getString } from "../utils/locale";
import { TagFilter } from "./tagFilter";
import { getItemTags } from "./zoteroUtils";

/**
 * UI state of a single tag inside the dialog.
 */
export interface TagState {
  changed: boolean;
  active: boolean;
  isFiltered: boolean;
}

/**
 * Business logic of the categorial tag dialog.
 */
export class TagDialogData {
  public itemTags: Record<number, TagState>;
  public dialogTitle: string;
  public tagFilter: TagFilter;
  public filterValue: string;
  private selections: Zotero.Item[];

  constructor(selections: Zotero.Item[]) {
    this.selections = selections;
    this.itemTags = {};
    this.dialogTitle = "";
    this.filterValue = "";

    this.tagFilter = new TagFilter(
      tagManager.getAllTags().map((tag) => tag.tagName),
    );

    this.initialize();
  }

  private initialize(): void {
    if (this.selections.length === 0) {
      throw new Error("No selections provided");
    }

    const initialTags = this.getTagNames(this.selections[0]!);

    const commonTags = this.selections
      .slice(1)
      .reduce<string[]>((acc, selection) => {
        const selectionTags = this.getTagNames(selection);
        return acc.filter((tag) => selectionTags.includes(tag));
      }, initialTags);

    const selectionItemsTitle =
      this.selections.length === 1
        ? this.selections[0]!.getDisplayTitle()
        : getString("categorial-tags-selection-titles", {
            args: { length: this.selections.length },
          });
    this.dialogTitle = getString("categorial-tags-dialog-title", {
      args: { selectionTitles: selectionItemsTitle },
    });

    const itemTags: Record<number, TagState> = {};
    for (const tag of tagManager.getAllTags()) {
      itemTags[tag.tagId] = {
        changed: false,
        active: commonTags.includes(tag.fullName),
        isFiltered: true,
      };
    }
    this.itemTags = itemTags;
  }

  private getTagNames(item: Zotero.Item): string[] {
    return getItemTags(item).map((tag) => tag.tag);
  }

  public filterTags(filterValue: string): void {
    const filterResults = this.tagFilter.filterTags(filterValue);
    this.filterValue = filterValue;
    for (const tag of tagManager.getAllTags()) {
      const tagState = this.itemTags[tag.tagId];
      if (tagState) {
        tagState.isFiltered = filterResults.includes(tag.tagName);
      }
    }
  }

  public toggleTag(tagId: number): void {
    const tagState = this.itemTags[tagId];
    if (tagState) {
      tagState.active = !tagState.active;
      tagState.changed = true;
    }
  }

  public async saveChanges(): Promise<void> {
    await Zotero.DB.executeTransaction(async () => {
      for (const tag of tagManager.getAllTags()) {
        const tagState = this.itemTags[tag.tagId];
        if (!tagState?.changed) continue;
        for (const selection of this.selections) {
          if (tagState.active) {
            selection.addTag(tag.fullName);
          } else {
            selection.removeTag(tag.fullName);
          }
          await selection.save();
        }
      }
    });
  }
}
