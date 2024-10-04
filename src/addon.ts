import { ColumnOptions, DialogHelper } from "zotero-plugin-toolkit";
import hooks from "./hooks";
import { createZToolkit } from "./utils/ztoolkit";

type Environment = "development" | "production";

interface Locale {
  current: any;
}

interface Prefs {
  window: Window;
  columns: Array<ColumnOptions>;
  rows: Array<Record<string, string>>;
}

interface Data {
  alive: boolean;
  env: Environment;
  ztoolkit: CustomZoteroToolkit;
  locale?: Locale;
  prefs?: Prefs;
  dialog?: DialogHelper;
}

export default class Addon {
  public data: Data;
  public hooks: typeof hooks;
  public api: Record<string, unknown>;

  constructor() {
    this.data = this.initializeData();
    this.hooks = hooks;
    this.api = {};
  }

  private initializeData(): Data {
    return {
      alive: true,
      env: __env__,
      ztoolkit: createZToolkit()
    };
  }
}
