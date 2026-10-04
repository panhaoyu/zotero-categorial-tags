import { TagFilter } from "./tagFilter";

describe("TagFilter", () => {
  const testTags = [
    "重庆",
    "长城",
    "乐清",
    "朝阳区",
    "银行",
    "中兴区",
    "长兴县",
    "厦门",
    "西藏",
    "朝阳",
    "乐山",
    "重庆市",
  ];
  const tagFilter = new TagFilter(testTags);

  test("应匹配基础拼音", () => {
    expect(tagFilter.filterTags("chongqing").sort()).toEqual(
      ["重庆", "重庆市"].sort(),
    );
    expect(tagFilter.filterTags("zhangcheng").sort()).toEqual(["长城"].sort());
  });

  test("应支持多音字不同组合", () => {
    expect(tagFilter.filterTags("zhongqing")).toEqual(["重庆", "重庆市"]);
    expect(tagFilter.filterTags("chaoyangqu")).toEqual(["朝阳区"]);
  });

  test("应匹配原始标签名", () => {
    expect(tagFilter.filterTags("朝阳区")).toEqual(["朝阳区"]);
  });

  test("应支持模糊搜索", () => {
    expect(tagFilter.filterTags("chq").sort()).toEqual(
      ["重庆", "重庆市", "朝阳区"].sort(),
    );
    expect(tagFilter.filterTags("cyq")).toEqual(["朝阳区"]);
  });

  test("应处理多音字组合匹配", () => {
    expect([
      ...tagFilter.filterTags("leqing"),
      ...tagFilter.filterTags("yueqing"),
    ]).toContain("乐清");
  });

  test("应返回空数组当输入为空", () => {
    expect(tagFilter.filterTags("")).toEqual([]);
  });

  test("应返回空数组当无匹配项", () => {
    expect(tagFilter.filterTags("nonexistent")).toEqual([]);
  });

  test("应支持大小写不敏感", () => {
    expect(tagFilter.filterTags("CHONGQING").sort()).toEqual(
      ["重庆", "重庆市"].sort(),
    );
    expect(tagFilter.filterTags("zhangCHENG").sort()).toEqual(["长城"].sort());
  });

  test("应支持多音字交叉匹配", () => {
    expect(tagFilter.filterTags("zhaoyang")).toEqual(["朝阳区", "朝阳"]);
    expect(tagFilter.filterTags("qing").sort()).toEqual(
      ["重庆", "乐清", "重庆市"].sort(),
    );
  });

  test("结果应按标签去重（同一标签命中多个拼音组合只返回一次）", () => {
    const results = tagFilter.filterTags("qing");
    expect(new Set(results).size).toBe(results.length);
  });

  test("单字标签也应支持拼音匹配", () => {
    const singleCharFilter = new TagFilter(["书", "树", "水"]);
    expect(singleCharFilter.filterTags("shu").sort()).toEqual(
      ["书", "树", "水"].sort(),
    );
  });

  test("未匹配的其他标签不应出现在结果中", () => {
    expect(tagFilter.filterTags("chongqing")).not.toContain("长城");
    expect(tagFilter.filterTags("chongqing")).not.toContain("银行");
  });

  test("拉丁字符标签应能按原样匹配", () => {
    const latinFilter = new TagFilter(["MachineLearning", "math"]);
    expect(latinFilter.filterTags("machine")).toContain("MachineLearning");
    expect(latinFilter.filterTags("math")).toContain("math");
  });
});
