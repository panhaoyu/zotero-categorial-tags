import pinyin from "pinyin"; // 使用拼音库
import FuzzySearch from "fuzzy-search"; // 使用模糊搜索库

export class TagFilter {
  private tags: string[];
  private lowerCaseTags: string[];
  private pinyinTags: string[][];

  constructor(tags: string[]) {
    this.tags = tags;
    this.lowerCaseTags = tags.map(tag => tag.toLowerCase()); // 预处理成小写
    this.pinyinTags = tags.map(tag => pinyin(tag, { style: pinyin.STYLE_NORMAL }).flat()); // 转换为拼音
  }

  public filterTags(input: string): boolean[] {
    const filterValue = input.toLowerCase();

    // 使用模糊搜索支持任意位置非连续字符检索
    const searcher = new FuzzySearch(this.lowerCaseTags, [], { caseSensitive: false });
    const resultFromOriginal = searcher.search(filterValue).map(tag => this.lowerCaseTags.indexOf(tag));

    // 支持拼音检索
    const pinyinSearcher = new FuzzySearch(this.pinyinTags, [], { caseSensitive: false });
    const resultFromPinyin = pinyinSearcher.search(filterValue).map(tag => this.pinyinTags.indexOf(tag));

    // 合并去重
    const resultIndexes = Array.from(new Set([...resultFromOriginal, ...resultFromPinyin]));

    return this.lowerCaseTags.map((_, index) => resultIndexes.includes(index));
  }

  public getOriginalTags(): string[] {
    return this.tags;
  }
}
