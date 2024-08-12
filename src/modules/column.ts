import { tagManager } from "./manager";
import { config } from "../../package.json";
import { getString } from "../utils/locale";

export class ColumnManager {


  async register() {
    // Initialize the Manager by updating its cache
    Zotero.ItemTreeManager.registerColumns({
      pluginID: config.addonID,
      dataKey: "categorial-tags",
      label: getString("categorial-tags-column-name"),
      dataProvider: (item: Zotero.Item, dataKey: string) => {
        return tagManager
          .getTagsOfItem(item)
          .map(i => i.tagName)
          .join(" ");
      }
    });
  }
}

export const columnManager = new ColumnManager();