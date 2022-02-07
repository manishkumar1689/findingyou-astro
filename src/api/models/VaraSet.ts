import { toDateTime } from "../converters";

export class VaraSet {
  num = 0;
  name = "";
  ruler = "";
  en = "";
  sunRise = new Date();
  dayLength = 0;
  percent = 0;

  constructor(inData: any = null) {
    if (inData instanceof Object) {
      Object.entries(inData).forEach((entry) => {
        const [k, v] = entry;
        switch (k) {
          case "num":
          case "percent":
          case "dayLength":
            if (typeof v === "number") {
              this[k] = v;
            }
            break;
          case "name":
          case "ruler":
          case "en":
            if (typeof v === "string") {
              this[k] = v;
            }
            break;
          case "sunRise":
            if (typeof v === "string") {
              this.sunRise = toDateTime(v);
            }
            break;
        }
      });
    }
  }
}
