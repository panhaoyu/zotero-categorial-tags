import { Category } from "./category";
import { CategorialTag } from "./categorialTag";
import { getItemTags } from "./zoteroUtils";
import TagJson = _ZoteroTypes.Tags.TagJson;

class Manager {
  private categories: Category[] = [];
  private tagQueryMapping: { [key: string]: CategorialTag } = {};

  async register() {
    const self: Manager = this;
    await self.updateCache();

    async function hook() {
      await self.onTagChanged();
    }

    async function hookLater() {
      await new Promise(resolve => setTimeout(resolve, 500));
      await hook.call(self);
    }

    // 添加 hooks，在变动的时候，触发 onTagChanged
    const originalCreate = Zotero.Tags.create;
    Zotero.Tags.create = async (...args) => {
      const result = await originalCreate.apply(Zotero.Tags, args);
      await hook.call(self);
      return result;
    };

    const originalRemoveFromLibrary = Zotero.Tags.removeFromLibrary;
    Zotero.Tags.removeFromLibrary = async (...args) => {
      const result = await originalRemoveFromLibrary.apply(Zotero.Tags, args);
      await hook.call(self);
      return result;
    };

    const originalRename = Zotero.Tags.rename;
    Zotero.Tags.rename = async (...args) => {
      const result = await originalRename.apply(Zotero.Tags, args);
      await hook.call(self);
      return result;
    };


    const originalAddTag = Zotero.Item.prototype.addTag;
    Zotero.Item.prototype.addTag = function(...args: any) {
      const result = originalAddTag.apply(this, args);
      hookLater.call(self).then();
      return result;
    };

    const originalRemoveTag = Zotero.Item.prototype.removeTag;
    Zotero.Item.prototype.removeTag = function(...args: any) {
      const result = originalRemoveTag.apply(this, args);
      hookLater.call(self).then();
      return result;
    };

    const originalReplaceTag = Zotero.Item.prototype.replaceTag;
    Zotero.Item.prototype.replaceTag = function(...args: any) {
      const result = originalReplaceTag.apply(this, args);
      hookLater.call(self).then();
      return result;
    };

    const originalRemoveAllTags = Zotero.Item.prototype.removeAllTags;
    Zotero.Item.prototype.removeAllTags = function(...args: any) {
      originalRemoveAllTags.apply(this, args);
      hookLater.call(self).then();
    };

    const originalSetTags = Zotero.Item.prototype.setTags;
    Zotero.Item.prototype.setTags = function(...args: any) {
      originalSetTags.apply(this, args);
      hookLater.call(self).then();
    };
  }

  async onTagChanged() {
    await this.updateCache();
  }

  // Update and cache all CategorialTag instances and categories
  async updateCache(): Promise<void> {
    let libraryId = ZoteroPane.getSelectedLibraryID();
    while (libraryId === undefined) {
      await new Promise(resolve => setTimeout(resolve, 100)); // wait 0.1 seconds
      libraryId = ZoteroPane.getSelectedLibraryID();
    }

    const tags = await Zotero.Tags.getAll(libraryId) as TagJson[];
    const categorialTags = await Promise.all(
      tags
        .filter(tagJson => {
          const tagName = tagJson.tag;
          return tagName.startsWith("#") && tagName.includes("/");
        })
        .map(async tagJson => {
          const tagId = Zotero.Tags.getID(tagJson.tag);
          if (tagId === false) {
            throw `Tag id not found: ${tagJson.tag}`;
          }
          const itemsIds = await Zotero.Tags.getTagItems(libraryId, tagId);
          const items = itemsIds.map(i => Zotero.Items.get(i));
          return new CategorialTag(tagId, tagJson, items);
        })
    );

    const categoryMap = new Map<string, CategorialTag[]>();
    this.tagQueryMapping = {};

    categorialTags.forEach(tag => {
      this.tagQueryMapping[tag.fullName] = tag;
      this.tagQueryMapping[tag.tagId] = tag;
      if (!categoryMap.get(tag.categoryName)) {
        categoryMap.set(tag.categoryName, []);
      }
      categoryMap.get(tag.categoryName)!.push(tag);
    });

    this.categories = Array.from(categoryMap.entries()).map(
      ([name, tags]) => new Category(name, tags)
    ).sort((i, j) => j.itemCount - i.itemCount);
  }

  getTag(idOrName: string | number): CategorialTag | undefined {
    return this.tagQueryMapping[idOrName];
  }

  getTagsOfItem(item: Zotero.Item): CategorialTag[] {
    return getItemTags(item)
      .map(tag => this.getTag(tag.tag))
      .filter(i => i !== undefined)
      .map(i => i as CategorialTag)
      .sort((i, j) => j.itemCount - i.itemCount);
  }

  getAllTags(): CategorialTag[] {
    return Object.values(this.tagQueryMapping);
  }

  getAllCategories(): Category[] {
    return this.categories;
  }
}

export const tagManager = new Manager();