import pinyin from "pinyin";
import FuzzySearch from "fuzzy-search";

export class TagFilter {
  private readonly lowerCaseTags: string[];
  private readonly pinyinTags: string[][];
  private readonly rawSearcher: FuzzySearch<string>;
  private readonly pinyinSearcher: FuzzySearch<string[]>;

  constructor(tags: string[]) {
    this.lowerCaseTags = tags.map(tag => tag.toLowerCase());
    this.pinyinTags = tags.map(tag => pinyin(tag, { style: pinyin.STYLE_NORMAL }).flat());
    this.rawSearcher = new FuzzySearch(this.lowerCaseTags, [], { caseSensitive: false });
    this.pinyinSearcher = new FuzzySearch(this.pinyinTags, [], { caseSensitive: false });
  }

  public filterTags(input: string): boolean[] {
    const filterValue = input.toLowerCase();
    const resultFromOriginal = this.rawSearcher.search(filterValue).map(tag => this.lowerCaseTags.indexOf(tag));
    const resultFromPinyin = this.pinyinSearcher.search(filterValue).map(tag => this.pinyinTags.indexOf(tag));
    const resultIndexes = Array.from(new Set([...resultFromOriginal, ...resultFromPinyin]));
    return this.lowerCaseTags.map((_, index) => resultIndexes.includes(index));
  }
}