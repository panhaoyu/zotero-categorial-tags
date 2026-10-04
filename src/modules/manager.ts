import { Category } from "./category";
import { CategorialTag } from "./categorialTag";
import { getItemTags } from "./zoteroUtils";
import { logger } from "../utils/logger";

const CACHE_UPDATE_DELAY = 500;
const LIBRARY_POLL_INTERVAL = 100;
const LIBRARY_POLL_TIMEOUT = 10000;

/**
 * 加载并缓存当前选中库的全部分类标签，
 * 并通过挂钩 Zotero 标签 API 保持缓存同步。
 */
export class Manager {
  private categories: Category[] = [];
  private tags: CategorialTag[] = [];
  private tagIndex = new Map<string | number, CategorialTag>();
  private restoreFunctions: Array<() => void> = [];
  private registered = false;
  private updateTimer?: ReturnType<typeof setTimeout>;

  /**
   * 加载初始缓存并挂钩 Zotero 标签 API。
   */
  async register(): Promise<void> {
    if (this.registered) return;
    await this.updateCache();
    this.patchZotero();
    this.registered = true;
  }

  /**
   * 恢复 Zotero 原始标签 API，并停止待处理的刷新。
   */
  unregister(): void {
    if (!this.registered) return;
    if (this.updateTimer !== undefined) {
      clearTimeout(this.updateTimer);
      this.updateTimer = undefined;
    }
    for (const restore of this.restoreFunctions.reverse()) {
      restore();
    }
    this.restoreFunctions = [];
    this.registered = false;
  }

  /**
   * 标签变动后刷新缓存。
   */
  async onTagChanged(): Promise<void> {
    await this.updateCache();
  }

  /**
   * 更新并缓存全部分类标签与分类。
   */
  async updateCache(): Promise<void> {
    const libraryId = await this.waitForLibrary();
    const tagJsons = await Zotero.Tags.getAll(libraryId);
    const categorialTags = (
      await Promise.all(
        tagJsons
          .filter((tagJson) => {
            const tagName = tagJson.tag;
            return tagName.startsWith("#") && tagName.includes("/");
          })
          .map(async (tagJson) => {
            const tagId = Zotero.Tags.getID(tagJson.tag);
            if (tagId === false) {
              logger.warn(
                `Skip tag because its id was not found: ${tagJson.tag}`,
              );
              return undefined;
            }
            const itemIds = await Zotero.Tags.getTagItems(libraryId, tagId);
            const items = itemIds
              .map((itemId) => Zotero.Items.get(itemId))
              .filter((item): item is Zotero.Item => item !== false);
            return new CategorialTag(tagId, tagJson, items);
          }),
      )
    ).filter((tag): tag is CategorialTag => tag !== undefined);

    const categoryMap = new Map<string, CategorialTag[]>();
    const tagIndex = new Map<string | number, CategorialTag>();

    for (const tag of categorialTags) {
      tagIndex.set(tag.fullName, tag);
      tagIndex.set(tag.tagId, tag);
      const categoryTags = categoryMap.get(tag.categoryName);
      if (categoryTags) {
        categoryTags.push(tag);
      } else {
        categoryMap.set(tag.categoryName, [tag]);
      }
    }

    this.tags = categorialTags;
    this.tagIndex = tagIndex;
    this.categories = Array.from(categoryMap.entries())
      .map(([name, tags]) => new Category(name, tags))
      .sort((a, b) => b.itemCount - a.itemCount);
  }

  getTag(idOrName: string | number): CategorialTag | undefined {
    return this.tagIndex.get(idOrName);
  }

  getTagsOfItem(item: Zotero.Item): CategorialTag[] {
    return getItemTags(item)
      .map((tag) => this.getTag(tag.tag))
      .filter((tag): tag is CategorialTag => tag !== undefined)
      .sort((a, b) => b.itemCount - a.itemCount);
  }

  getAllTags(): CategorialTag[] {
    return this.tags;
  }

  getAllCategories(): Category[] {
    return this.categories;
  }

  /**
   * 等待用户选中某个库（例如 Zotero 启动完成后）。
   */
  private async waitForLibrary(): Promise<number> {
    const start = Date.now();
    let libraryId = this.getSelectedLibraryId();
    while (libraryId === undefined) {
      if (Date.now() - start > LIBRARY_POLL_TIMEOUT) {
        throw new Error("Timed out waiting for a selected library");
      }
      await new Promise((resolve) =>
        setTimeout(resolve, LIBRARY_POLL_INTERVAL),
      );
      libraryId = this.getSelectedLibraryId();
    }
    return libraryId;
  }

  private getSelectedLibraryId(): number | undefined {
    if (typeof ZoteroPane === "undefined") {
      return undefined;
    }
    return ZoteroPane.getSelectedLibraryID() || undefined;
  }

  /**
   * 安排一次缓存刷新，合并短时间内的连续变动。
   */
  private scheduleUpdate(): void {
    if (this.updateTimer !== undefined) {
      clearTimeout(this.updateTimer);
    }
    this.updateTimer = setTimeout(() => {
      this.updateTimer = undefined;
      this.onTagChanged().catch((error) => {
        logger.error(`Failed to update the tag cache: ${String(error)}`);
      });
    }, CACHE_UPDATE_DELAY);
  }

  /**
   * 挂钩 Zotero 标签 API，使缓存跟随标签变动。
   */
  private patchZotero(): void {
    const scheduleUpdate = this.scheduleUpdate.bind(this);

    const originalCreate = Zotero.Tags.create;
    Zotero.Tags.create = async (
      ...args: Parameters<typeof originalCreate>
    ): Promise<number> => {
      const result = await originalCreate.apply(Zotero.Tags, args);
      await this.onTagChanged();
      return result;
    };
    this.restoreFunctions.push(() => {
      Zotero.Tags.create = originalCreate;
    });

    const originalRemoveFromLibrary = Zotero.Tags.removeFromLibrary;
    Zotero.Tags.removeFromLibrary = async (
      ...args: Parameters<typeof originalRemoveFromLibrary>
    ): Promise<void> => {
      const result = await originalRemoveFromLibrary.apply(Zotero.Tags, args);
      await this.onTagChanged();
      return result;
    };
    this.restoreFunctions.push(() => {
      Zotero.Tags.removeFromLibrary = originalRemoveFromLibrary;
    });

    const originalRename = Zotero.Tags.rename;
    Zotero.Tags.rename = async (
      ...args: Parameters<typeof originalRename>
    ): Promise<void> => {
      const result = await originalRename.apply(Zotero.Tags, args);
      await this.onTagChanged();
      return result;
    };
    this.restoreFunctions.push(() => {
      Zotero.Tags.rename = originalRename;
    });

    const originalAddTag = Zotero.Item.prototype.addTag;
    Zotero.Item.prototype.addTag = function (
      this: Zotero.Item,
      ...args: Parameters<typeof originalAddTag>
    ): boolean {
      const result = originalAddTag.apply(this, args);
      scheduleUpdate();
      return result;
    };
    this.restoreFunctions.push(() => {
      Zotero.Item.prototype.addTag = originalAddTag;
    });

    const originalRemoveTag = Zotero.Item.prototype.removeTag;
    Zotero.Item.prototype.removeTag = function (
      this: Zotero.Item,
      ...args: Parameters<typeof originalRemoveTag>
    ): boolean {
      const result = originalRemoveTag.apply(this, args);
      scheduleUpdate();
      return result;
    };
    this.restoreFunctions.push(() => {
      Zotero.Item.prototype.removeTag = originalRemoveTag;
    });

    const originalReplaceTag = Zotero.Item.prototype.replaceTag;
    Zotero.Item.prototype.replaceTag = function (
      this: Zotero.Item,
      ...args: Parameters<typeof originalReplaceTag>
    ): boolean {
      const result = originalReplaceTag.apply(this, args);
      scheduleUpdate();
      return result;
    };
    this.restoreFunctions.push(() => {
      Zotero.Item.prototype.replaceTag = originalReplaceTag;
    });

    const originalRemoveAllTags = Zotero.Item.prototype.removeAllTags;
    Zotero.Item.prototype.removeAllTags = function (
      this: Zotero.Item,
      ...args: Parameters<typeof originalRemoveAllTags>
    ): void {
      originalRemoveAllTags.apply(this, args);
      scheduleUpdate();
    };
    this.restoreFunctions.push(() => {
      Zotero.Item.prototype.removeAllTags = originalRemoveAllTags;
    });

    const originalSetTags = Zotero.Item.prototype.setTags;
    Zotero.Item.prototype.setTags = function (
      this: Zotero.Item,
      ...args: Parameters<typeof originalSetTags>
    ): void {
      originalSetTags.apply(this, args);
      scheduleUpdate();
    };
    this.restoreFunctions.push(() => {
      Zotero.Item.prototype.setTags = originalSetTags;
    });
  }
}

export const tagManager = new Manager();
