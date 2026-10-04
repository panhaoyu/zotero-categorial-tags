import { Category } from "./category";
import { CategorialTag } from "./categorialTag";
import { createMockItem } from "../testUtils/mockZotero";

function createItems(count: number): Zotero.Item[] {
  return Array.from(
    { length: count },
    (_, index) => createMockItem(index + 1) as unknown as Zotero.Item,
  );
}

function createTag(id: number, tag: string, itemCount: number): CategorialTag {
  return new CategorialTag(id, { tag }, createItems(itemCount));
}

describe("Category", () => {
  test("应按 itemCount 从多到少排序标签", () => {
    const category = new Category("Subject", [
      createTag(1, "#Subject/A", 1),
      createTag(2, "#Subject/B", 3),
      createTag(3, "#Subject/C", 2),
    ]);
    expect(category.tags.map((tag) => tag.tagName)).toEqual(["B", "C", "A"]);
  });

  test("itemCount 应为所有标签 itemCount 之和", () => {
    const category = new Category("Subject", [
      createTag(1, "#Subject/A", 1),
      createTag(2, "#Subject/B", 3),
      createTag(3, "#Subject/C", 2),
    ]);
    expect(category.itemCount).toBe(6);
  });

  test("排序不应修改传入数组", () => {
    const tags = [createTag(1, "#Subject/A", 1), createTag(2, "#Subject/B", 3)];
    const original = [...tags];
    new Category("Subject", tags);
    expect(tags).toEqual(original);
  });

  test("空标签列表应得到 0 计数", () => {
    const category = new Category("Empty", []);
    expect(category.tags).toEqual([]);
    expect(category.itemCount).toBe(0);
  });

  test("itemCount 相同时应保持原始相对顺序", () => {
    const category = new Category("Subject", [
      createTag(1, "#Subject/A", 2),
      createTag(2, "#Subject/B", 2),
    ]);
    expect(category.tags.map((tag) => tag.tagName)).toEqual(["A", "B"]);
  });
});
