jest.mock("../utils/locale", () => ({
  getString: (key: string) => key,
}));

import { ColumnManager } from "./column";
import { tagManager } from "./manager";
import { createMockItem, createMockZotero } from "../testUtils/mockZotero";

describe("ColumnManager", () => {
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
