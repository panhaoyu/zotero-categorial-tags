import type { ZoteroToolkit } from "zotero-plugin-toolkit/ztoolkit";
import type AddonClass from "../src/addon";

declare global {
  const _globalThis: {
    [key: string]: any;
    Zotero: _ZoteroTypes.Zotero;
    ZoteroPane: _ZoteroTypes.ZoteroPane;
    Zotero_Tabs: _ZoteroTypes.Zotero_Tabs;
    window: Window;
    document: Document;
    ztoolkit: ZoteroToolkit;
    addon: AddonClass;
  };

  const addon: AddonClass;

  const ztoolkit: ZoteroToolkit;

  const rootURI: string;

  const __env__: "production" | "development";

  interface Window {
    /**
     * Zotero 7+ 在主窗口上提供 `MozXULElement`，但 `zotero-types` 未声明该属性。
     */
    MozXULElement: {
      insertFTLIfNeeded(name: string): void;
    };
  }
}

export {};
