import type { TagJson } from "./types";

/**
 * A tag following the `#<category>/<tagName>` naming convention.
 */
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
    if (!tagName.startsWith("#")) {
      throw new Error(`Tag name must start with '#': ${tagName}`);
    }

    // Process tagName to extract categoryName and tagNamePart
    const [categoryName, tagNamePart] = tagName.slice(1).split("/", 2);
    if (categoryName === undefined || tagNamePart === undefined) {
      throw new Error(
        `Tag name must follow the '#category/name' format: ${tagName}`,
      );
    }

    this.categoryName = categoryName;
    this.tagName = tagNamePart;
  }
}
