import { Category } from "./category";
import { CategorialTag } from "./categorialTag";
import TagJson = _ZoteroTypes.Tags.TagJson;

export class Manager {
  private categories: Category[] | null = null;
  private categorialTag: CategorialTag;

  constructor() {
    this.categorialTag = new CategorialTag({} as TagJson, []);
  }

  // Update and cache all categories
  async updateCache(): Promise<Category[]> {
    const categorialTags = await this.categorialTag.all();

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