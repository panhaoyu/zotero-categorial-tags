import { expect } from "chai";
import { createItemWithTags, delay, waitForPlugin } from "./helpers";

const CATEGORY = "列测试";
const TAG_NAME = "列标签";

interface CustomColumnLike {
  dataKey?: string;
  label?: string;
}

/** 读取已注册的自定义列（Zotero 10 提供 getCustomColumns，返回数组）。 */
function getCustomColumns(): CustomColumnLike[] {
  const manager = Zotero.ItemTreeManager as unknown as {
    getCustomColumns?: () => CustomColumnLike[];
  };
  return manager.getCustomColumns?.() ?? [];
}

function findColumn(): CustomColumnLike | undefined {
  return getCustomColumns().find((column) =>
    column.dataKey?.includes("categorial-tags"),
  );
}

describe("分类标签列", () => {
  let item: Zotero.Item;
  let column: CustomColumnLike | undefined;

  before(async () => {
    await waitForPlugin();
    item = await createItemWithTags("列测试条目", [`#${CATEGORY}/${TAG_NAME}`]);
    // 等待插件标签缓存刷新（addTag 后 500ms 防抖）
    await delay(2000);
    column = findColumn();
  });

  it("应注册分类标签自定义列", () => {
    if (!column?.dataKey) {
      throw new Error(
        `分类标签列未注册；已注册列：${JSON.stringify(getCustomColumns())}`,
      );
    }
    expect(
      Zotero.ItemTreeManager.isCustomColumn(column.dataKey),
      "分类标签列应已注册",
    ).to.equal(true);
    expect(column.label?.length ?? 0, "列应有非空标题").to.be.greaterThan(0);
  });

  it("列数据应显示条目的分类标签", () => {
    expect(column?.dataKey, "分类标签列应已注册").to.not.equal(undefined);
    const data = Zotero.ItemTreeManager.getCustomCellData(
      item,
      column!.dataKey!,
    );
    expect(data, "列数据应包含条目的分类标签名").to.contain(TAG_NAME);
  });
});
