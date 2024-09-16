export class TagFilter {
  private tags: string[];
  private lowerCaseTags: string[];

  constructor(tags: string[]) {
    this.tags = tags;
    this.lowerCaseTags = tags.map(tag => tag.toLowerCase()); // 预处理成小写
  }

  public filterTags(input: string): boolean[] {
    const filterValue = input.toLowerCase();
    return this.lowerCaseTags.map(tag => tag.includes(filterValue));
  }

  public getOriginalTags(): string[] {
    return this.tags;
  }
}