import { CategorialTag } from "./categorialTag";
import { createMockItem } from "../testUtils/mockZotero";

function createItems(count: number): Zotero.Item[] {
  return Array.from(
    { length: count },
    (_, index) => createMockItem(index + 1) as unknown as Zotero.Item,
  );
}

describe("CategorialTag", () => {
  test("应解析分类名与标签名", () => {
    const tag = new CategorialTag(1, { tag: "#Subject/Mathematics" }, []);
    expect(tag.categoryName).toBe("Subject");
    expect(tag.tagName).toBe("Mathematics");
    expect(tag.fullName).toBe("#Subject/Mathematics");
  });

  test("应保留 tagId、tagJson、items 与 itemCount", () => {
    const items = createItems(3);
    const tag = new CategorialTag(42, { tag: "#Topic/MachineLearning" }, items);
    expect(tag.tagId).toBe(42);
    expect(tag.tagJson).toEqual({ tag: "#Topic/MachineLearning" });
    expect(tag.items).toBe(items);
    expect(tag.itemCount).toBe(3);
    expect(tag.uniqueElementId).toBe("categorial-tag-42");
  });

  test("应拒绝不以 # 开头的标签", () => {
    expect(
      () => new CategorialTag(1, { tag: "Subject/Mathematics" }, []),
    ).toThrow("Tag name must start with '#'");
  });

  test("多级斜杠只取前两段（与旧行为保持一致）", () => {
    const tag = new CategorialTag(1, { tag: "#A/B/C" }, []);
    expect(tag.categoryName).toBe("A");
    expect(tag.tagName).toBe("B");
  });

  test("空分类名或空标签名不抛错（与旧行为保持一致）", () => {
    expect(new CategorialTag(1, { tag: "#/x" }, []).categoryName).toBe("");
    expect(new CategorialTag(2, { tag: "#x/" }, []).tagName).toBe("");
  });

  test("itemCount 应等于 items 长度", () => {
    const tag = new CategorialTag(1, { tag: "#A/x" }, createItems(2));
    expect(tag.itemCount).toBe(2);
    expect(tag.itemCount).toBe(tag.items.length);
  });
});
