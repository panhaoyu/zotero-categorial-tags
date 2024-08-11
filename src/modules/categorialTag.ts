import type TagJson = _ZoteroTypes.Tags.TagJson;

export class CategorialTag {
  readonly categoryName: string;
  readonly fullName: string;
  readonly tagName: string;
  readonly tagJson: TagJson;
  readonly itemCount: number;
  readonly items: Zotero.Item[];
  readonly uniqueElementId: string;
  readonly tagId: number;

  constructor(tagId: number, tagJson: TagJson, items: Zotero.Item[]) {
    this.tagId = tagId;
    this.fullName = tagJson.tag;
    this.uniqueElementId = `categorial-tag-${tagId}`;
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
