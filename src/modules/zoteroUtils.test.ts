import { getItemTags } from "./zoteroUtils";
import { createMockItem } from "../testUtils/mockZotero";

describe("getItemTags", () => {
  test("应返回条目自身的标签", () => {
    const item = createMockItem(1, ["#A/x", "plain"]);
    expect(getItemTags(item as unknown as Zotero.Item)).toEqual([
      { tag: "#A/x" },
      { tag: "plain" },
    ]);
  });

  test("无 getTags 的条目应返回空数组", () => {
    const item = createMockItem(2, ["#A/x"]);
    (item as unknown as { getTags?: unknown }).getTags = undefined;
    expect(getItemTags(item as unknown as Zotero.Item)).toEqual([]);
  });

  test("无标签条目应返回空数组", () => {
    const item = createMockItem(3, []);
    expect(getItemTags(item as unknown as Zotero.Item)).toEqual([]);
  });

  test("应保留标签类型信息", () => {
    const item = {
      getTags: () => [{ tag: "#A/x", type: 1 }],
    } as unknown as Zotero.Item;
    expect(getItemTags(item)).toEqual([{ tag: "#A/x", type: 1 }]);
  });
});
