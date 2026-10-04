import pinyin from "pinyin";
import FuzzySearch from "fuzzy-search";

/**
 * A tag together with its pinyin representation, used as search index entry.
 */
export interface TagWithPinyin {
  tag: string;
  pinyin: string;
}

interface PinyinCombination {
  full: string;
  initials: string;
}

/**
 * Fuzzy and pinyin based tag filter.
 */
export class TagFilter {
  private readonly tagsWithPinyin: TagWithPinyin[];
  private readonly searcher: FuzzySearch<TagWithPinyin>;

  constructor(tags: string[]) {
    this.tagsWithPinyin = tags.flatMap((tag) => {
      const pinyinArrays = pinyin(tag, {
        style: pinyin.STYLE_NORMAL,
        heteronym: true,
      });
      return this.generateCombinations(pinyinArrays).map((combination) => ({
        tag,
        pinyin: `${combination.full} ${combination.initials}`,
      }));
    });
    this.searcher = new FuzzySearch(this.tagsWithPinyin, ["pinyin", "tag"], {
      caseSensitive: false,
      sort: true,
    });
  }

  private generateCombinations(pinyinArrays: string[][]): PinyinCombination[] {
    let combinations: PinyinCombination[] = [{ full: "", initials: "" }];
    for (const chars of pinyinArrays) {
      const newCombinations: PinyinCombination[] = [];
      for (const combination of combinations) {
        for (const char of chars) {
          newCombinations.push({
            full: combination.full + char,
            initials: combination.initials + (char[0] ?? ""),
          });
        }
      }
      combinations = newCombinations;
    }
    return combinations;
  }

  /**
   * Return the names of all tags matching the given input,
   * keeping the search result order and removing duplicates.
   */
  public filterTags(input: string): string[] {
    if (!input) return [];
    const seen = new Set<string>();
    const results = this.searcher.search(input);
    return results.reduce<string[]>((acc, { tag }) => {
      if (!seen.has(tag)) {
        seen.add(tag);
        acc.push(tag);
      }
      return acc;
    }, []);
  }
}
