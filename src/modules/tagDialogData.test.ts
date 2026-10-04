import { TagDialogData } from "./tagDialogData";
import { tagManager } from "./manager";
import {
  createMockItem,
  createMockZotero,
  type MockItem,
} from "../testUtils/mockZotero";

jest.mock("../utils/locale", () => ({
  getString: (key: string, options?: { args?: unknown }) =>
    options?.args ? `${key}:${JSON.stringify(options.args)}` : key,
}));

const fixtures = [
  { name: "#Subject/Math", itemIds: [1, 2] },
  { name: "#Subject/Physics", itemIds: [] },
  { name: "#Status/Read", itemIds: [1] },
];

async function setupManager(items: MockItem[]): Promise<void> {
  const itemMap = new Map<number, Zotero.Item>(
    items.map((item) => [item.id, item as unknown as Zotero.Item]),
  );
  createMockZotero(fixtures, { items: itemMap });
  await tagManager.updateCache();
}

function tagIdOf(fullName: string): number {
  const tag = tagManager.getTag(fullName);
  if (!tag) throw new Error(`Missing fixture tag: ${fullName}`);
  return tag.tagId;
}

describe("TagDialogData", () => {
  test("无选择项时应抛错", () => {
    expect(() => new TagDialogData([])).toThrow("No selections provided");
  });

  test("单条目应激活该条目已有的分类标签", async () => {
    const item = createMockItem(1, ["#Subject/Math", "#Status/Read"]);
    await setupManager([item]);

    const data = new TagDialogData([item as unknown as Zotero.Item]);

    expect(data.itemTags[tagIdOf("#Subject/Math")]?.active).toBe(true);
    expect(data.itemTags[tagIdOf("#Status/Read")]?.active).toBe(true);
    expect(data.itemTags[tagIdOf("#Subject/Physics")]?.active).toBe(false);
    expect(data.dialogTitle).toContain("categorial-tags-dialog-title");
    expect(data.dialogTitle).toContain("item-1");
  });

  test("多条目时应只激活所有条目共有的标签", async () => {
    const item1 = createMockItem(1, ["#Subject/Math", "#Status/Read"]);
    const item2 = createMockItem(2, ["#Subject/Math"]);
    await setupManager([item1, item2]);

    const data = new TagDialogData([
      item1 as unknown as Zotero.Item,
      item2 as unknown as Zotero.Item,
    ]);

    expect(data.itemTags[tagIdOf("#Subject/Math")]?.active).toBe(true);
    expect(data.itemTags[tagIdOf("#Status/Read")]?.active).toBe(false);
    expect(data.dialogTitle).toContain("categorial-tags-selection-titles");
  });

  test("toggleTag 应翻转激活状态并标记为已修改", async () => {
    const item = createMockItem(1, ["#Subject/Math"]);
    await setupManager([item]);
    const data = new TagDialogData([item as unknown as Zotero.Item]);
    const tagId = tagIdOf("#Subject/Math");

    data.toggleTag(tagId);
    expect(data.itemTags[tagId]).toMatchObject({
      active: false,
      changed: true,
    });

    data.toggleTag(tagId);
    expect(data.itemTags[tagId]).toMatchObject({
      active: true,
      changed: true,
    });
  });

  test("toggleTag 对未知 tagId 应无副作用", async () => {
    const item = createMockItem(1, []);
    await setupManager([item]);
    const data = new TagDialogData([item as unknown as Zotero.Item]);

    data.toggleTag(9999);
    expect(data.itemTags[9999]).toBeUndefined();
  });

  test("filterTags 应更新 isFiltered 并记录 filterValue", async () => {
    const item = createMockItem(1, []);
    await setupManager([item]);
    const data = new TagDialogData([item as unknown as Zotero.Item]);

    data.filterTags("math");
    expect(data.filterValue).toBe("math");
    expect(data.itemTags[tagIdOf("#Subject/Math")]?.isFiltered).toBe(true);
    expect(data.itemTags[tagIdOf("#Subject/Physics")]?.isFiltered).toBe(false);

    data.filterTags("physics");
    expect(data.itemTags[tagIdOf("#Subject/Math")]?.isFiltered).toBe(false);
    expect(data.itemTags[tagIdOf("#Subject/Physics")]?.isFiltered).toBe(true);
  });

  test("filterTags 空输入应清空过滤", async () => {
    const item = createMockItem(1, []);
    await setupManager([item]);
    const data = new TagDialogData([item as unknown as Zotero.Item]);

    data.filterTags("math");
    data.filterTags("");
    expect(
      tagManager
        .getAllTags()
        .every((tag) => !data.itemTags[tag.tagId]?.isFiltered),
    ).toBe(true);
  });

  test("saveChanges 应只应用被修改的标签到所有选择项", async () => {
    const item1 = createMockItem(1, ["#Subject/Math", "#Status/Read"]);
    const item2 = createMockItem(2, ["#Subject/Math"]);
    await setupManager([item1, item2]);
    const data = new TagDialogData([
      item1 as unknown as Zotero.Item,
      item2 as unknown as Zotero.Item,
    ]);

    data.toggleTag(tagIdOf("#Subject/Physics"));
    data.toggleTag(tagIdOf("#Subject/Math"));

    await data.saveChanges();

    for (const item of [item1, item2]) {
      expect(item.addTag).toHaveBeenCalledWith("#Subject/Physics");
      expect(item.removeTag).toHaveBeenCalledWith("#Subject/Math");
      expect(item.addTag).not.toHaveBeenCalledWith("#Status/Read");
      expect(item.removeTag).not.toHaveBeenCalledWith("#Status/Read");
      expect(item.save).toHaveBeenCalledTimes(2);
    }
  });

  test("saveChanges 在没有修改时不应触碰条目", async () => {
    const item = createMockItem(1, ["#Subject/Math"]);
    await setupManager([item]);
    const data = new TagDialogData([item as unknown as Zotero.Item]);

    await data.saveChanges();

    expect(item.addTag).not.toHaveBeenCalled();
    expect(item.removeTag).not.toHaveBeenCalled();
    expect(item.save).not.toHaveBeenCalled();
  });

  test("saveChanges 应在数据库事务中执行", async () => {
    const item = createMockItem(1, []);
    await setupManager([item]);
    const data = new TagDialogData([item as unknown as Zotero.Item]);
    data.toggleTag(tagIdOf("#Subject/Physics"));

    await data.saveChanges();

    const zotero = (
      globalThis as unknown as {
        Zotero: { DB: { executeTransaction: jest.Mock } };
      }
    ).Zotero;
    expect(zotero.DB.executeTransaction).toHaveBeenCalledTimes(1);
  });
});
