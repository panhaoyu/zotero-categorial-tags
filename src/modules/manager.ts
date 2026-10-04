import { Category } from "./category";
import { CategorialTag } from "./categorialTag";
import { getItemTags } from "./zoteroUtils";

/**
 * Loads and caches all categorial tags of the selected library, and keeps the
 * cache in sync with Zotero's tag API.
 */
export class Manager {
  private categories: Category[] = [];
  private tagIndex = new Map<string | number, CategorialTag>();

  async register(): Promise<void> {
    await this.updateCache();

    const hook = (): Promise<void> => this.onTagChanged();
    const hookLater = (): void => {
      setTimeout(() => {
        void hook();
      }, 500);
    };

    // 添加 hooks，在变动的时候，触发 onTagChanged
    const originalCreate = Zotero.Tags.create;
    Zotero.Tags.create = async (
      ...args: Parameters<typeof originalCreate>
    ): Promise<number> => {
      const result = await originalCreate.apply(Zotero.Tags, args);
      await hook();
      return result;
    };

    const originalRemoveFromLibrary = Zotero.Tags.removeFromLibrary;
    Zotero.Tags.removeFromLibrary = async (
      ...args: Parameters<typeof originalRemoveFromLibrary>
    ): Promise<void> => {
      const result = await originalRemoveFromLibrary.apply(Zotero.Tags, args);
      await hook();
      return result;
    };

    const originalRename = Zotero.Tags.rename;
    Zotero.Tags.rename = async (
      ...args: Parameters<typeof originalRename>
    ): Promise<void> => {
      const result = await originalRename.apply(Zotero.Tags, args);
      await hook();
      return result;
    };

    const originalAddTag = Zotero.Item.prototype.addTag;
    Zotero.Item.prototype.addTag = function (
      this: Zotero.Item,
      ...args: Parameters<typeof originalAddTag>
    ): boolean {
      const result = originalAddTag.apply(this, args);
      hookLater();
      return result;
    };

    const originalRemoveTag = Zotero.Item.prototype.removeTag;
    Zotero.Item.prototype.removeTag = function (
      this: Zotero.Item,
      ...args: Parameters<typeof originalRemoveTag>
    ): boolean {
      const result = originalRemoveTag.apply(this, args);
      hookLater();
      return result;
    };

    const originalReplaceTag = Zotero.Item.prototype.replaceTag;
    Zotero.Item.prototype.replaceTag = function (
      this: Zotero.Item,
      ...args: Parameters<typeof originalReplaceTag>
    ): boolean {
      const result = originalReplaceTag.apply(this, args);
      hookLater();
      return result;
    };

    const originalRemoveAllTags = Zotero.Item.prototype.removeAllTags;
    Zotero.Item.prototype.removeAllTags = function (
      this: Zotero.Item,
      ...args: Parameters<typeof originalRemoveAllTags>
    ): void {
      originalRemoveAllTags.apply(this, args);
      hookLater();
    };

    const originalSetTags = Zotero.Item.prototype.setTags;
    Zotero.Item.prototype.setTags = function (
      this: Zotero.Item,
      ...args: Parameters<typeof originalSetTags>
    ): void {
      originalSetTags.apply(this, args);
      hookLater();
    };
  }

  async onTagChanged(): Promise<void> {
    await this.updateCache();
  }

  // Update and cache all CategorialTag instances and categories
  async updateCache(): Promise<void> {
    let libraryId: number | undefined = ZoteroPane.getSelectedLibraryID();
    while (libraryId === undefined) {
      await new Promise((resolve) => setTimeout(resolve, 100)); // wait 0.1 seconds
      libraryId = ZoteroPane.getSelectedLibraryID();
    }

    const tags = await Zotero.Tags.getAll(libraryId);
    const categorialTags = await Promise.all(
      tags
        .filter((tagJson) => {
          const tagName = tagJson.tag;
          return tagName.startsWith("#") && tagName.includes("/");
        })
        .map(async (tagJson) => {
          const tagId = Zotero.Tags.getID(tagJson.tag);
          if (tagId === false) {
            throw new Error(`Tag id not found: ${tagJson.tag}`);
          }
          const itemIds = await Zotero.Tags.getTagItems(libraryId!, tagId);
          const items = itemIds
            .map((itemId) => Zotero.Items.get(itemId))
            .filter((item): item is Zotero.Item => item !== false);
          return new CategorialTag(tagId, tagJson, items);
        }),
    );

    this.tagIndex = new Map<string | number, CategorialTag>();
    const categoryMap = new Map<string, CategorialTag[]>();

    categorialTags.forEach((tag) => {
      this.tagIndex.set(tag.fullName, tag);
      this.tagIndex.set(tag.tagId, tag);
      const categoryTags = categoryMap.get(tag.categoryName);
      if (categoryTags) {
        categoryTags.push(tag);
      } else {
        categoryMap.set(tag.categoryName, [tag]);
      }
    });

    this.categories = Array.from(categoryMap.entries())
      .map(([name, tags]) => new Category(name, tags))
      .sort((i, j) => j.itemCount - i.itemCount);
  }

  getTag(idOrName: string | number): CategorialTag | undefined {
    return this.tagIndex.get(idOrName);
  }

  getTagsOfItem(item: Zotero.Item): CategorialTag[] {
    return getItemTags(item)
      .map((tag) => this.getTag(tag.tag))
      .filter((tag): tag is CategorialTag => tag !== undefined)
      .sort((i, j) => j.itemCount - i.itemCount);
  }

  getAllTags(): CategorialTag[] {
    return [...this.tagIndex.values()];
  }

  getAllCategories(): Category[] {
    return this.categories;
  }
}

export const tagManager = new Manager();
