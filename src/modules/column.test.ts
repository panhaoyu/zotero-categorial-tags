jest.mock("../utils/locale", () => ({
  getString: (key: string) => key,
}));

import { ColumnManager } from "./column";
import { tagManager } from "./manager";
import { createMockItem, createMockZotero } from "../testUtils/mockZotero";

describe("ColumnManager", () => {
  test("register 应使用插件 ID 与数据键注册列", async () => {
    const registerColumn = jest.fn(
      (_options: unknown) => "registered-data-key",
    );
    const unregisterColumn = jest.fn(() => true);
    const zotero = createMockZotero([]);
    (zotero as unknown as Record<string, unknown>).ItemTreeManager = {
      registerColumn,
      unregisterColumn,
    };

    const manager = new ColumnManager();
    await manager.register();

    expect(registerColumn).toHaveBeenCalledTimes(1);
    const options = registerColumn.mock.calls[0]?.[0] as unknown as {
      pluginID: string;
      dataKey: string;
      label: string;
    };
    expect(options.pluginID).toBe("categorialtags@panhaoyu.com");
    expect(options.dataKey).toBe("categorial-tags");
    expect(options.label).toBe("categorial-tags-column-name");

    manager.unregister();
    expect(unregisterColumn).toHaveBeenCalledWith("registered-data-key");
  });

  test("注册失败（返回 false）时 unregister 不应调用注销", async () => {
    const registerColumn = jest.fn(() => false);
    const unregisterColumn = jest.fn(() => true);
    const zotero = createMockZotero([]);
    (zotero as unknown as Record<string, unknown>).ItemTreeManager = {
      registerColumn,
      unregisterColumn,
    };

    const manager = new ColumnManager();
    await manager.register();
    manager.unregister();

    expect(unregisterColumn).not.toHaveBeenCalled();
  });

  test("dataProvider 应返回条目的分类标签名", async () => {
    let dataProvider:
      ((item: Zotero.Item, dataKey: string) => string) | undefined;
    const registerColumn = jest.fn((options: unknown) => {
      dataProvider = (
        options as {
          dataProvider: (item: Zotero.Item, dataKey: string) => string;
        }
      ).dataProvider;
      return "registered-data-key";
    });
    const item = createMockItem(1, ["#A/x", "#A/y", "plain"]);
    const zotero = createMockZotero(
      [
        { name: "#A/x", itemIds: [1] },
        { name: "#A/y", itemIds: [1] },
      ],
      { items: new Map([[1, item as unknown as Zotero.Item]]) },
    );
    (zotero as unknown as Record<string, unknown>).ItemTreeManager = {
      registerColumn,
      unregisterColumn: jest.fn(),
    };
    await tagManager.updateCache();

    const manager = new ColumnManager();
    await manager.register();

    expect(dataProvider).toBeDefined();
    expect(
      dataProvider!(item as unknown as Zotero.Item, "categorial-tags"),
    ).toBe("x y");
  });
});
