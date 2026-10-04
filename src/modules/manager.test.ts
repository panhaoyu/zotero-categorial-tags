import { Manager } from "./manager";
import { createMockItem, createMockZotero } from "../testUtils/mockZotero";

const fixtures = [
  { name: "#Subject/Math", itemIds: [1, 2, 3] },
  { name: "#Subject/Physics", itemIds: [1] },
  { name: "#Status/Read", itemIds: [2, 3] },
  { name: "#Empty/None", itemIds: [] },
  { name: "plain-tag", itemIds: [1] },
];

describe("Manager", () => {
  describe("updateCache", () => {
    test("应缓存分类标签并保持分类按总数排序", async () => {
      createMockZotero(fixtures);
      const manager = new Manager();
      await manager.updateCache();

      expect(
        manager.getAllCategories().map((category) => category.name),
      ).toEqual(["Subject", "Status", "Empty"]);
      expect(manager.getAllTags().map((tag) => tag.fullName)).toEqual([
        "#Subject/Math",
        "#Subject/Physics",
        "#Status/Read",
        "#Empty/None",
      ]);
    });

    test("getAllTags 不应包含重复项（回归：name/tagId 双索引）", async () => {
      createMockZotero(fixtures);
      const manager = new Manager();
      await manager.updateCache();

      const tags = manager.getAllTags();
      expect(tags).toHaveLength(4);
      expect(new Set(tags).size).toBe(4);
    });

    test("非分类标签应被忽略", async () => {
      createMockZotero(fixtures);
      const manager = new Manager();
      await manager.updateCache();

      expect(manager.getTag("plain-tag")).toBeUndefined();
      expect(manager.getTag(5)).toBeUndefined();
    });

    test("分类内的标签应按 itemCount 降序排列", async () => {
      const items = new Map<number, Zotero.Item>([
        [1, createMockItem(1) as unknown as Zotero.Item],
        [2, createMockItem(2) as unknown as Zotero.Item],
        [3, createMockItem(3) as unknown as Zotero.Item],
      ]);
      createMockZotero(fixtures, { items });
      const manager = new Manager();
      await manager.updateCache();

      const subject = manager
        .getAllCategories()
        .find((category) => category.name === "Subject");
      expect(subject?.tags.map((tag) => tag.tagName)).toEqual([
        "Math",
        "Physics",
      ]);
      expect(subject?.itemCount).toBe(4);
    });

    test("同一标签应按全名与 tagId 均可查询", async () => {
      createMockZotero(fixtures);
      const manager = new Manager();
      await manager.updateCache();

      const byName = manager.getTag("#Subject/Math");
      const byId = manager.getTag(1);
      expect(byName).toBeDefined();
      expect(byId).toBe(byName);
    });

    test("无法解析 id 的标签应跳过而不是导致整体失败", async () => {
      const zotero = createMockZotero(fixtures);
      zotero.Tags.getID.mockReturnValue(false);
      const manager = new Manager();

      await expect(manager.updateCache()).resolves.toBeUndefined();
      expect(manager.getAllTags()).toEqual([]);
    });

    test("条目 id 无效时应过滤掉（Items.get 返回 false）", async () => {
      createMockZotero(fixtures);
      const manager = new Manager();
      await manager.updateCache();

      const math = manager.getTag("#Subject/Math");
      expect(math?.itemCount).toBe(0);
    });

    test("应使用 ZoteroPane 当前库", async () => {
      const zotero = createMockZotero(fixtures, { libraryId: 3 });
      const manager = new Manager();
      await manager.updateCache();

      expect(zotero.Tags.getAll).toHaveBeenCalledWith(3);
    });
  });

  describe("getTagsOfItem", () => {
    test("应返回条目上命中的分类标签", async () => {
      const item = createMockItem(1, ["#Subject/Math", "plain-tag"]);
      const items = new Map<number, Zotero.Item>([
        [1, item as unknown as Zotero.Item],
      ]);
      createMockZotero(fixtures, { items });
      const manager = new Manager();
      await manager.updateCache();

      const tags = manager.getTagsOfItem(item as unknown as Zotero.Item);
      expect(tags.map((tag) => tag.tagName)).toEqual(["Math"]);
    });

    test("无 getTags 的条目应返回空数组", async () => {
      createMockZotero(fixtures);
      const manager = new Manager();
      await manager.updateCache();

      const note = createMockItem(9);
      (note as unknown as { getTags?: unknown }).getTags = undefined;
      expect(manager.getTagsOfItem(note as unknown as Zotero.Item)).toEqual([]);
    });
  });

  describe("条目标签变更", () => {
    test("应防抖触发一次缓存刷新", async () => {
      jest.useFakeTimers();
      try {
        const zotero = createMockZotero(fixtures);
        const manager = new Manager();
        await manager.register();
        const calls = zotero.Tags.getAll.mock.calls.length;

        zotero.Item.prototype.addTag("plain-tag");
        zotero.Item.prototype.removeTag("plain-tag");
        zotero.Item.prototype.replaceTag("a", "b");

        await jest.advanceTimersByTimeAsync(499);
        expect(zotero.Tags.getAll.mock.calls.length).toBe(calls);

        await jest.advanceTimersByTimeAsync(1);
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
        expect(zotero.Tags.getAll.mock.calls.length).toBe(calls + 1);
      } finally {
        jest.useRealTimers();
      }
    });
  });
});
