import { config } from "../../package.json";

export { initLocale, getString, getLocaleID };

/**
 * Arguments accepted by fluent messages.
 */
export type LocalizationArgs = Record<string, string | number>;

/**
 * Options of `getString`.
 */
export interface GetStringOptions {
  branch?: string;
  args?: LocalizationArgs;
}

/**
 * Initialize locale data
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
 * Get locale string, see https://firefox-source-docs.mozilla.org/l10n/fluent/tutorial.html#fluent-translation-list-ftl
 * @param localString ftl key
 * @param options.branch branch name
 * @param options.args args
 * @example
 * ```ftl
 * # addon.ftl
 * addon-static-example = This is default branch!
 *     .branch-example = This is a branch under addon-static-example!
 * addon-dynamic-example =
    { $count ->
        [one] I have { $count } apple
       *[other] I have { $count } apples
    }
 * ```
 * ```js
 * getString("addon-static-example"); // This is default branch!
 * getString("addon-static-example", { branch: "branch-example" }); // This is a branch under addon-static-example!
 * getString("addon-dynamic-example", { args: { count: 1 } }); // I have 1 apple
 * getString("addon-dynamic-example", { args: { count: 2 } }); // I have 2 apples
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
