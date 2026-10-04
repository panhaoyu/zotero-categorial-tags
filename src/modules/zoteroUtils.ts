/**
 * 条目上附带的一个标签。
 */
export interface ItemTag {
  tag: string;
  type?: number;
}

/**
 * 返回条目的标签列表。
 *
 * 部分条目类型（如笔记，见 issue #44）未实现 `getTags`，此时返回空数组。
 */
export function getItemTags(item: Zotero.Item): ItemTag[] {
  // 参见 https://github.com/panhaoyu/zotero-categorial-tags/issues/44
  if (!item.getTags) return [];

  return item.getTags();
}
