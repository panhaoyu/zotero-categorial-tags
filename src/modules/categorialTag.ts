import type { TagJson } from "./types";

/**
 * 遵循 `#<分类>/<标签名>` 命名规范的分类标签。
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

    // 校验标签名以 "#" 开头
    const tagName = tagJson.tag;
    if (!tagName.startsWith("#")) {
      throw new Error(`Tag name must start with '#': ${tagName}`);
    }

    // 从标签名中拆分出分类名与标签名部分（标签名部分可包含斜杠）
    const body = tagName.slice(1);
    const separatorIndex = body.indexOf("/");
    if (separatorIndex === -1) {
      throw new Error(
        `Tag name must follow the '#category/name' format: ${tagName}`,
      );
    }

    this.categoryName = body.slice(0, separatorIndex);
    this.tagName = body.slice(separatorIndex + 1);
  }
}
