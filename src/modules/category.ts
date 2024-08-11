import { CategorialTag } from "./categorialTag";

export class Category {
  name: string;
  tags: CategorialTag[];

  constructor(name: string, tags: CategorialTag[]) {
    this.name = name;
    this.tags = tags;
  }
}