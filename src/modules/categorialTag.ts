import type TagJson = _ZoteroTypes.Tags.TagJson;

export class CategorialTag {
  categoryName: string;
  tagName: string;
  tagJson: TagJson;
  itemCount: number;
  items: Zotero.Item[];

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
}
