import pinyin from "pinyin";
import FuzzySearch from "fuzzy-search";

/**
 * 标签及其拼音表示，用作搜索索引项。
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
 * 基于模糊匹配与拼音的标签过滤器。
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
   * 返回与输入匹配的所有标签名，保持搜索结果顺序并去重。
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
