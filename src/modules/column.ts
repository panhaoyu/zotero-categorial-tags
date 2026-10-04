import { tagManager } from "./manager";
import { config } from "../../package.json";
import { getString } from "../utils/locale";

const COLUMN_DATA_KEY = "categorial-tags";

/**
 * Adds the categorial tags column to the item list.
 */
export class ColumnManager {
  private registeredDataKey?: string;

  async register(): Promise<void> {
    const registeredDataKey = Zotero.ItemTreeManager.registerColumn({
      pluginID: config.addonID,
      dataKey: COLUMN_DATA_KEY,
      label: getString("categorial-tags-column-name"),
      dataProvider: (item: Zotero.Item, _dataKey: string) => {
        return tagManager
          .getTagsOfItem(item)
          .map((tag) => tag.tagName)
          .join(" ");
      },
    });

    if (registeredDataKey !== false) {
      this.registeredDataKey = registeredDataKey;
    }
  }

  unregister(): void {
    if (this.registeredDataKey !== undefined) {
      Zotero.ItemTreeManager.unregisterColumn(this.registeredDataKey);
      this.registeredDataKey = undefined;
    }
  }
}

export const columnManager = new ColumnManager();
