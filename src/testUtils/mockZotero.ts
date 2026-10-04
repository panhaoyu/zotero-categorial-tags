/**
 * Test-only helpers to build mocked Zotero globals.
 */

export interface TagFixture {
  name: string;
  itemIds: number[];
}

export interface MockItem {
  id: number;
  addTag: jest.Mock;
  removeTag: jest.Mock;
  save: jest.Mock;
  getDisplayTitle: () => string;
  getTags: jest.Mock;
}

export interface MockZotero {
  Tags: {
    getAll: jest.Mock;
    getID: jest.Mock;
    getTagItems: jest.Mock;
    create: jest.Mock;
    removeFromLibrary: jest.Mock;
    rename: jest.Mock;
  };
  Items: {
    get: jest.Mock;
  };
  Item: {
    prototype: {
      addTag: jest.Mock;
      removeTag: jest.Mock;
      replaceTag: jest.Mock;
      removeAllTags: jest.Mock;
      setTags: jest.Mock;
    };
  };
  DB: {
    executeTransaction: jest.Mock;
  };
  getMainWindow: jest.Mock;
}

export interface MockZoteroOptions {
  libraryId?: number;
  items?: Map<number, Zotero.Item>;
}

/**
 * Install mocked `Zotero` / `ZoteroPane` globals and return the mocked Zotero.
 */
export function createMockZotero(
  fixtures: TagFixture[],
  options: MockZoteroOptions = {},
): MockZotero {
  const tagIds = new Map<string, number>();
  const tagItems = new Map<string, number[]>();
  fixtures.forEach((fixture, index) => {
    tagIds.set(fixture.name, index + 1);
    tagItems.set(fixture.name, fixture.itemIds);
  });

  const items = options.items ?? new Map<number, Zotero.Item>();
  const libraryId = "libraryId" in options ? options.libraryId : 1;

  const mock: MockZotero = {
    Tags: {
      getAll: jest.fn(async () =>
        fixtures.map((fixture) => ({ tag: fixture.name })),
      ),
      getID: jest.fn(
        (name: string): number | false => tagIds.get(name) ?? false,
      ),
      getTagItems: jest.fn(
        async (_libraryId: number, tagId: number): Promise<number[]> => {
          for (const [name, id] of tagIds) {
            if (id === tagId) {
              return tagItems.get(name) ?? [];
            }
          }
          return [];
        },
      ),
      create: jest.fn(async (): Promise<number> => 1),
      removeFromLibrary: jest.fn(async (): Promise<void> => undefined),
      rename: jest.fn(async (): Promise<void> => undefined),
    },
    Items: {
      get: jest.fn((id: number): Zotero.Item | false => items.get(id) ?? false),
    },
    Item: {
      prototype: {
        addTag: jest.fn(() => true),
        removeTag: jest.fn(() => true),
        replaceTag: jest.fn(() => true),
        removeAllTags: jest.fn(),
        setTags: jest.fn(),
      },
    },
    DB: {
      executeTransaction: jest.fn(async (callback: () => Promise<unknown>) => {
        return await callback();
      }),
    },
    getMainWindow: jest.fn(() => ({
      console: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        log: jest.fn(),
      },
    })),
  };

  (
    globalThis as unknown as {
      Zotero: MockZotero;
      ZoteroPane: { getSelectedLibraryID: () => number | undefined };
    }
  ).Zotero = mock;
  (
    globalThis as unknown as {
      ZoteroPane: { getSelectedLibraryID: () => number | undefined };
    }
  ).ZoteroPane = {
    getSelectedLibraryID: () => libraryId,
  };

  return mock;
}

/**
 * Create a mocked Zotero item.
 */
export function createMockItem(id: number, tags: string[] = []): MockItem {
  return {
    id,
    addTag: jest.fn(() => true),
    removeTag: jest.fn(() => true),
    save: jest.fn(async () => id),
    getDisplayTitle: () => `item-${id}`,
    getTags: jest.fn(() => tags.map((tag) => ({ tag }))),
  };
}

/**
 * Create a mocked item without a `getTags` method (e.g. notes, see #44).
 */
export function createMockItemWithoutGetTags(id: number): MockItem {
  const item = createMockItem(id, []);
  (item as unknown as { getTags?: unknown }).getTags = undefined;
  return item;
}
