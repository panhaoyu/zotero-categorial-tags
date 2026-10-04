import { tagManager } from "./manager";
import { config } from "../../package.json";
import { getString } from "../utils/locale";

/**
 * Adds the categorial tags column to the item list.
 */
export class ColumnManager {
  async register(): Promise<void> {
    await Zotero.ItemTreeManager.registerColumns({
      pluginID: config.addonID,
      dataKey: "categorial-tags",
      label: getString("categorial-tags-column-name"),
      dataProvider: (item: Zotero.Item, _dataKey: string) => {
        return tagManager
          .getTagsOfItem(item)
          .map((tag) => tag.tagName)
          .join(" ");
      },
    });
  }
}

export const columnManager = new ColumnManager();
