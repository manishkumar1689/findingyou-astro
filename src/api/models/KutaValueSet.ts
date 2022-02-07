import { notEmptyString } from "../validators";

export class KutaValueSet {
  key = "";
  head = "";
  c1Value = "-";
  c2Value = "-";
  tooltip = "";
  score = 0;
  max = 0;

  constructor(inData = null) {
    if (inData instanceof Object) {
      Object.entries(inData).forEach((entry) => {
        const [k, v] = entry;
        switch (k) {
          case "key":
          case "head":
          case "c1Value":
          case "c2Value":
          case "tooltip":
            if (typeof v === "string") {
              this[k] = v;
            }
            break;
          case "score":
          case "max":
            if (typeof v === "number") {
              this[k] = v;
            }
            break;
        }
      });
    }
  }

  get hasTooltip() {
    return notEmptyString(this.tooltip);
  }
}

export interface KutaCell {
  key: string;
  head?: string;
  grahaKey: string;
  c1Value?: string;
  c2Value?: string;
  score: number;
  max?: number;
}

export class KutaMultiSet {
  key = "";
  head = "";
  tooltip = "";
  cells: Array<KutaCell> = [];

  constructor(key: string, head: string, cells: Array<KutaCell>) {
    this.key = key;
    this.head = head;
    if (cells.length > 0) {
      this.cells = cells;
    }
  }

  get total() {
    return this.cells.map((c) => c.score).reduce((a, b) => a + b, 0);
  }

  get max() {
    return this.cells.map((c) => c.max).reduce((a, b) => a + b, 0);
  }
}
