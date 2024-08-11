import { Category } from "./category";
import { CategorialTag } from "./categorialTag";
import type TagJson = _ZoteroTypes.Tags.TagJson;

class Manager {
  private categories: Category[] = [];
  private tagMappingByName: { [key: string]: CategorialTag } = {};

  // Initialize the Manager by updating the cache
  async init() {
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
          const items = tagId === false ? [] : await Zotero.Tags.getTagItems(libraryId, tagId) as Zotero.Item[];
          return new CategorialTag(tagJson, items);
        })
    );

    const categoryMap = new Map<string, CategorialTag[]>();
    this.tagMappingByName = {};

    categorialTags.forEach(tag => {
      // Update tagMappingByName
      const key = `#${tag.categoryName}/${tag.tagName}`;
      this.tagMappingByName[key] = tag;

      // Update categoryMap
      if (!categoryMap.has(tag.categoryName)) {
        categoryMap.set(tag.categoryName, []);
      }
      categoryMap.get(tag.categoryName)!.push(tag);
    });

    this.categories = Array.from(categoryMap.entries()).map(
      ([name, tags]) => new Category(name, tags.sort((a, b) => b.itemCount - a.itemCount))
    );
  }

  getCategorialTagsOfList(tags: TagJson[]): { categoryName: string, tagName: string, tagJson: TagJson }[] {
    return tags
      .filter(tagJson => tagJson.tag.startsWith("#") && tagJson.tag.includes("/"))
      .map(tagJson => {
        const tagName = tagJson.tag;
        const removePrefix = tagName.slice(1);
        const [categoryName, tagNamePart] = removePrefix.split("/", 2);
        const key = `#${categoryName}/${tagNamePart}`;
        const tag = this.tagMappingByName[key];
        return {
          categoryName: tag.categoryName,
          tagName: tag.tagName,
          tagJson: tag.tagJson
        };
      })
      .sort((v1, v2) => v1.tagJson.tag > v2.tagJson.tag ? 1 : -1);
  }

  getCategorialTagsOfItem(item: Zotero.Item): { categoryName: string, tagName: string, tagJson: TagJson }[] {
    const tags = item.getTags() as TagJson[];
    return this.getCategorialTagsOfList(tags);
  }

  getTags(): CategorialTag[] {
    return Object.values(this.tagMappingByName);
  }

  getCategories(): Category[] {
    return this.categories;
  }
}

export const tagManager = new Manager();