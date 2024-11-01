export function getItemTags(item: Zotero.Item): { tag: string; type: number }[] {
  // See https://github.com/panhaoyu/zotero-categorial-tags/issues/44
  if (!item.getTags) return [];

  return item.getTags();
}