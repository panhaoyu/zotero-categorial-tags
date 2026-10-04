/**
 * A tag attached to an item.
 */
export interface ItemTag {
  tag: string;
  type?: number;
}

/**
 * Return the tags of an item.
 *
 * Some item types (e.g. notes, see issue #44) do not implement `getTags`,
 * in which case an empty array is returned.
 */
export function getItemTags(item: Zotero.Item): ItemTag[] {
  // See https://github.com/panhaoyu/zotero-categorial-tags/issues/44
  if (!item.getTags) return [];

  return item.getTags();
}
