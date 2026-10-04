import { config } from "../../package.json";

export { initLocale, getString, getLocaleID };

/**
 * Fluent 消息可接受的参数。
 */
export type LocalizationArgs = Record<string, string | number>;

/**
 * `getString` 的选项。
 */
export interface GetStringOptions {
  branch?: string;
  args?: LocalizationArgs;
}

/**
 * 初始化本地化数据。
 */
function initLocale(): void {
  const l10n = new (
    typeof Localization === "undefined"
      ? ztoolkit.getGlobal("Localization")
      : Localization
  )([`${config.addonRef}-addon.ftl`], true);
  addon.data.locale = {
    current: l10n,
  };
}

/**
 * 获取本地化字符串，参见 https://firefox-source-docs.mozilla.org/l10n/fluent/tutorial.html#fluent-translation-list-ftl
 * @param localString ftl 键名
 * @param options.branch 分支名
 * @param options.args 消息参数
 * @example
 * ```ftl
 * # addon.ftl
 * addon-static-example = 这是默认分支！
 *     .branch-example = 这是 addon-static-example 下的一个分支！
 * addon-dynamic-example =
    { $count ->
        [one] 我有 { $count } 个苹果
       *[other] 我有 { $count } 个苹果
    }
 * ```
 * ```js
 * getString("addon-static-example"); // 这是默认分支！
 * getString("addon-static-example", { branch: "branch-example" }); // 这是 addon-static-example 下的一个分支！
 * getString("addon-dynamic-example", { args: { count: 1 } }); // 我有 1 个苹果
 * getString("addon-dynamic-example", { args: { count: 2 } }); // 我有 2 个苹果
 * ```
 */
function getString(localString: string): string;
function getString(localString: string, branch: string): string;
function getString(localeString: string, options: GetStringOptions): string;
function getString(
  ...inputs: [string] | [string, string | GetStringOptions]
): string {
  if (inputs.length === 1) {
    return _getString(inputs[0]);
  }
  const option = inputs[1];
  if (typeof option === "string") {
    return _getString(inputs[0], { branch: option });
  }
  return _getString(inputs[0], option);
}

function _getString(
  localeString: string,
  options: GetStringOptions = {},
): string {
  const localStringWithPrefix = `${config.addonRef}-${localeString}`;
  const { branch, args } = options;
  const locale = addon.data.locale?.current;
  if (!locale) {
    return localStringWithPrefix;
  }
  const pattern = locale.formatMessagesSync([
    { id: localStringWithPrefix, args },
  ])[0];
  if (!pattern) {
    return localStringWithPrefix;
  }
  if (branch && pattern.attributes) {
    const attribute = pattern.attributes.find((attr) => attr.name === branch);
    if (attribute) {
      return attribute.value;
    }
  }
  return pattern.value ?? localStringWithPrefix;
}

function getLocaleID(id: string): string {
  return `${config.addonRef}-${id}`;
}
