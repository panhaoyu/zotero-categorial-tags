import { CategorialTag } from "./categorialTag";

/**
 * 同一分类名下的一组分类标签。
 */
export class Category {
  readonly name: string;
  readonly tags: CategorialTag[];
  readonly itemCount: number;

  constructor(name: string, tags: CategorialTag[]) {
    this.name = name;
    this.tags = [...tags].sort((a, b) => b.itemCount - a.itemCount);
    this.itemCount = this.tags.reduce((total, tag) => total + tag.itemCount, 0);
  }
}
