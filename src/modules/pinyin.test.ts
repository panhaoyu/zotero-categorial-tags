import { TagFilter } from "./tagFilter";

describe("TagFilter", () => {
  const testTags = ["重庆", "长城", "乐清", "朝阳区"];
  const tagFilter = new TagFilter(testTags);

  test("应匹配基础拼音", () => {
    expect(tagFilter.filterTags("chongqing")).toContain("重庆");
    expect(tagFilter.filterTags("zhangcheng")).toContain("长城");
  });

  test("应支持多音字不同组合", () => {
    expect(tagFilter.filterTags("zhongqing")).toContain("重庆");
    expect(tagFilter.filterTags("chaoyangqu")).toContain("朝阳区");
  });

  test("应匹配原始标签名", () => {
    expect(tagFilter.filterTags("朝阳区")).toEqual(["朝阳区"]);
  });

  test("应支持模糊搜索", () => {
    expect(tagFilter.filterTags("chq")).toContain("重庆");
    expect(tagFilter.filterTags("zhyq")).toContain("朝阳区");
  });

  test("应处理多音字组合匹配", () => {
    const results = tagFilter.filterTags("le");
    expect(results).toContain("乐清");
    expect(results).toContain("朝阳区");
  });

  test("应返回空数组当输入为空", () => {
    expect(tagFilter.filterTags("")).toEqual([]);
  });

  test("应返回空数组当无匹配项", () => {
    expect(tagFilter.filterTags("nonexistent")).toEqual([]);
  });

  test("应支持大小写不敏感", () => {
    expect(tagFilter.filterTags("CHONGQING")).toContain("重庆");
    expect(tagFilter.filterTags("zhangCHENG")).toContain("长城");
  });
});