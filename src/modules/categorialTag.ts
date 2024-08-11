import type TagJson = _ZoteroTypes.Tags.TagJson;

export class CategorialTag {
  categoryName: string;
  tagName: string;
  tagJson: TagJson;
  itemCount: number;
  items: Zotero.Item[];

  private cache: CategorialTag[] | null = null;

  constructor(tagJson: TagJson, items: Zotero.Item[]) {
    this.tagJson = tagJson;
    this.items = items;
    this.itemCount = items.length;

    // Validate that the tag name starts with "#"
    const tagName = tagJson.tag;
    if (tagName[0] !== "#") {
      throw new Error("Tag name must start with '#'");
    }

    // Process tagName to extract categoryName and tagNamePart
    const removePrefix = tagName.slice(1);
    const [categoryName, tagNamePart] = removePrefix.split("/", 2);

    this.categoryName = categoryName;
    this.tagName = tagNamePart;
  }

  // Method to create a CategorialTag instance from a TagJson object
  async fromTagJson(tagJson: TagJson): Promise<CategorialTag> {
    const libraryId = ZoteroPane.getSelectedLibraryID();
    const tagId = Zotero.Tags.getID(tagJson.tag);
    const items = tagId === false ? [] : await Zotero.Tags.getTagItems(libraryId, tagId) as Zotero.Item[];
    return new CategorialTag(tagJson, items);
  }

  // Method to fetch and cache all CategorialTag instances from Zotero.Tags
  async updateCache(): Promise<CategorialTag[]> {
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
  async all(): Promise<CategorialTag[]> {
    return this.cache ?? await this.updateCache();
  }
}

