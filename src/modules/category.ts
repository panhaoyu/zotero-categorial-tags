import { CategorialTag } from "./categorialTag";

export class Category {
  readonly name: string;
  readonly tags: CategorialTag[];
  readonly itemCount: number;

  constructor(name: string, tags: CategorialTag[]) {
    tags = tags.sort((i, j) => j.itemCount - i.itemCount);
    this.name = name;
    this.tags = tags;
    this.itemCount = this.tags.map(i => i.itemCount).reduce((i, j) => i + j, 0);
  }
}