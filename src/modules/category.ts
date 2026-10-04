import { CategorialTag } from "./categorialTag";

/**
 * A group of categorial tags sharing the same category name.
 */
export class Category {
  readonly name: string;
  readonly tags: CategorialTag[];
  readonly itemCount: number;

  constructor(name: string, tags: CategorialTag[]) {
    tags = tags.sort((i, j) => j.itemCount - i.itemCount);
    this.name = name;
    this.tags = tags;
    this.itemCount = this.tags
      .map((tag) => tag.itemCount)
      .reduce((i, j) => i + j, 0);
  }
}
