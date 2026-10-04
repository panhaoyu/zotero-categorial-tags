import { expect } from "chai";
import { waitForPlugin } from "./helpers";

/**
 * 启动健康检查：验证插件初始化过程不产生未捕获异常。
 */
describe("插件启动健康检查", () => {
  before(async () => {
    await waitForPlugin();
  });

  it("初始化不应产生 item tree 列刷新错误（_resetColumns）", () => {
    const messages = Services.console.getMessageArray();
    const resetErrors: string[] = [];
    for (const message of messages) {
      try {
        const m = message as { errorMessage?: string; message?: string };
        const text = String(m.errorMessage ?? m.message ?? "");
        if (
          text.includes("_resetColumns") ||
          text.includes("this.tree is undefined")
        ) {
          resetErrors.push(text.slice(0, 200));
        }
      } catch {
        // 忽略无法读取的消息
      }
    }
    expect(
      resetErrors,
      `启动时产生了列刷新错误：${JSON.stringify(resetErrors)}`,
    ).to.have.lengthOf(0);
  });
});
