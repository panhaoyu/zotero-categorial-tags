import type { DialogHelper } from "zotero-plugin-toolkit";
import type { ZoteroToolkit } from "zotero-plugin-toolkit/ztoolkit";
import hooks from "./hooks";
import { createZToolkit } from "./utils/ztoolkit";

export type AddonEnvironment = "development" | "production";

export interface LocaleData {
  current: Localization;
}

export interface PrefsData {
  window?: Window;
}

export interface AddonData {
  alive: boolean;
  env: AddonEnvironment;
  ztoolkit: ZoteroToolkit;
  locale?: LocaleData;
  prefs: PrefsData;
  dialog?: DialogHelper;
}

export default class Addon {
  public data: AddonData;
  public hooks: typeof hooks;
  public api: Record<string, unknown>;

  constructor() {
    this.data = {
      alive: true,
      env: __env__,
      ztoolkit: createZToolkit(),
      prefs: {},
    };
    this.hooks = hooks;
    this.api = {};
  }
}
