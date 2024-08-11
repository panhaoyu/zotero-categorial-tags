import { Category } from "./category";
import { CategorialTag } from "./categorialTag";
import type TagJson = _ZoteroTypes.Tags.TagJson;

export class Manager {
  private categories: Category[] | null = null;
  private cache: CategorialTag[] | null = null;

  // Method to create a CategorialTag instance from a TagJson object
  async fromTagJson(tagJson: TagJson): Promise<CategorialTag> {
    const libraryId = ZoteroPane.getSelectedLibraryID();
    const tagId = Zotero.Tags.getID(tagJson.tag);
    const items = tagId === false ? [] : await Zotero.Tags.getTagItems(libraryId, tagId) as Zotero.Item[];
    return new CategorialTag(tagJson, items);
  }

  // Method to fetch and cache all CategorialTag instances from Zotero.Tags
  async updateCategorialTagCache(): Promise<CategorialTag[]> {
    const tags = await Zotero.Tags.getAll(ZoteroPane.getSelectedLibraryID()) as TagJson[];

    const categorialTags = await Promise.all(
      tags
        .filter(tagJson => tagJson.tag.startsWith("#") && tagJson.tag.includes("/"))
        .map(tagJson => this.fromTagJson(tagJson))
    );

    this.cache = categorialTags;
    return categorialTags;
  }

  // Method to get all cached CategorialTag instances
  async allCategorialTags(): Promise<CategorialTag[]> {
    return this.cache ?? await this.updateCategorialTagCache();
  }

  // Update and cache all categories
  async updateCache(): Promise<Category[]> {
    const categorialTags = await this.allCategorialTags();

    const categoryMap = new Map<string, CategorialTag[]>();

    categorialTags.forEach(tag => {
      if (!categoryMap.has(tag.categoryName)) {
        categoryMap.set(tag.categoryName, []);
      }
      categoryMap.get(tag.categoryName)!.push(tag);
    });

    this.categories = Array.from(categoryMap.entries()).map(
      ([name, tags]) => new Category(name, tags.sort((a, b) => b.itemCount - a.itemCount))
    );

    return this.categories;
  }

  // Get a specific category by name
  async getByName(name: string): Promise<Category | undefined> {
    const categories = this.categories ?? await this.updateCache();
    return categories.find(category => category.name === name);
  }

  // Get all categories
  async all(): Promise<Category[]> {
    return this.categories ?? await this.updateCache();
  }
}
