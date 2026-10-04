import { tagManager } from "./manager";
import { config } from "../../package.json";
import { getString } from "../utils/locale";

const COLUMN_DATA_KEY = "categorial-tags";
const ITEM_TREE_POLL_INTERVAL = 100;
const ITEM_TREE_POLL_TIMEOUT = 10000;

/**
 * 在条目列表中注册分类标签列。
 */
export class ColumnManager {
  private registeredDataKey?: string;

  async register(): Promise<void> {
    await this.waitForItemTree();
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

  /**
   * 等待主窗口条目列表完成挂载后再注册列。
   *
   * Zotero 在自定义列变化时会通知所有 item tree 刷新，
   * 若此时条目列表尚未挂载（React 组件未就绪），其内部会抛出
   * `this.tree is undefined` 的未捕获异常。
   */
  private async waitForItemTree(): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < ITEM_TREE_POLL_TIMEOUT) {
      const itemsView = Zotero.getMainWindow()?.ZoteroPane?.itemsView as
        { tree?: unknown } | false | null | undefined;
      if (itemsView && itemsView.tree) {
        return;
      }
      await Zotero.Promise.delay(ITEM_TREE_POLL_INTERVAL);
    }
  }
}

export const columnManager = new ColumnManager();
