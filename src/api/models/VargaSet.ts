import { KeyNumber } from "../interfaces";

export class VargaSet {
  num = 0;
  key = "";
  values: Array<KeyNumber> = [];
  constructor(inData: any = null) {
    if (inData instanceof Object) {
      Object.entries(inData).forEach(entry => {
        const [k, v] = entry;
        switch (k) {
          case "num":
            if (typeof v === "number") {
              this.num = v;
            }
            break;
          case "key":
            if (typeof v === "string") {
              this.key = v;
            }
            break;
          case "values":
            if (v instanceof Array) {
              this.values = v
                .filter(item => item instanceof Object)
                .map(item => {
                  const { num, key, value } = item;
                  return {
                    num,
                    key,
                    format: "deg",
                    value
                  };
                });
            }
            break;
        }
      });
    }
  }
}
