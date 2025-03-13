import pinyin from "pinyin";
import FuzzySearch from "fuzzy-search";

interface TagWithPinyin {
  tag: string;
  pinyin: string;
}

export class TagFilter {
  private readonly tagsWithPinyin: TagWithPinyin[];
  private readonly searcher: FuzzySearch<TagWithPinyin>;

  constructor(tags: string[]) {
    this.tagsWithPinyin = tags.flatMap(tag => {
      const pinyinArrays = pinyin(tag, {
        style: pinyin.STYLE_NORMAL,
        heteronym: true
      });
      return this.generateCombinations(pinyinArrays).map(p => ({
        tag,
        pinyin: `${p.full} ${p.initials}`
      }));
    });
    this.searcher = new FuzzySearch(this.tagsWithPinyin, ["pinyin", "tag"], {
      caseSensitive: false,
      sort: true
    });
  }

  private generateCombinations(pinyinArrays: string[][]): Array<{ full: string, initials: string }> {
    let combinations = [{ full: "", initials: "" }];
    for (const chars of pinyinArrays) {
      const newCombinations = [];
      for (const combo of combinations) {
        for (const char of chars) {
          newCombinations.push({
            full: combo.full + char,
            initials: combo.initials + char[0]
          });
        }
      }
      combinations = newCombinations;
    }
    return combinations;
  }

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