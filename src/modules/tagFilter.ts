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
    this.tagsWithPinyin = tags.map(tag => ({
      tag: tag,
      pinyin: pinyin(tag, { style: pinyin.STYLE_NORMAL }).flat().join("")
    }));
    this.searcher = new FuzzySearch(this.tagsWithPinyin, ["tag", "pinyin"], { caseSensitive: false });
  }

  public filterTags(input: string): string[] {
    return this.searcher.search(input).map(result => result.tag);
  }
}
