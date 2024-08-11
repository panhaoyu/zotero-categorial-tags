import { Manager } from "./manager";
import { config } from "../../package.json";
import { getString } from "../utils/locale";
import type TagJson = _ZoteroTypes.Tags.TagJson;

export class ColumnManager {
  private readonly tagManager: Manager;

  constructor() {
    this.tagManager = new Manager();
  }

  async init() {
    // Initialize the Manager by updating its cache
    await this.tagManager.updateCache();
    this.registerExtraColumn();
  }

  getCategorialTagsOfList(tags: TagJson[]): { categoryName: string, tagName: string, tagJson: TagJson }[] {
    return tags
      .filter(tagJson => tagJson.tag.startsWith("#") && tagJson.tag.includes("/"))
      .map(tagJson => {
        const tagName = tagJson.tag;
        const removePrefix = tagName.slice(1);
        const [categoryName, tagNamePart] = removePrefix.split("/", 2);
        return {
          categoryName,
          tagName: tagNamePart,
          tagJson
        };
      })
      .sort((v1, v2) => v1.tagJson.tag > v2.tagJson.tag ? 1 : -1);
  }

  getCategorialTagsOfItem(item: Zotero.Item): { categoryName: string, tagName: string, tagJson: TagJson }[] {
    const tags = item.getTags() as TagJson[];
    return this.getCategorialTagsOfList(tags);
  }

  getCategorialTagsColumn(item: Zotero.Item): string {
    const categorialTags = this.getCategorialTagsOfItem(item);
    return categorialTags.map(i => i.tagName).join(" ");
  }

  registerExtraColumn() {
    Zotero.ItemTreeManager.registerColumns({
      pluginID: config.addonID,
      dataKey: "categorial-tags",
      label: getString("categorial-tags-column-name"),
      dataProvider: (item: Zotero.Item, dataKey: string) => {
        return this.getCategorialTagsColumn(item);
      }
    });
  }
}