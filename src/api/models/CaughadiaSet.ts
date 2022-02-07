import { toDateTime } from "../converters";

export class CaughadiaSet {
  num = 0;
  name = "";
  ruler = "";
  night = "";
  res = "";
  result = "";
  startJd = 0;
  startDt = new Date();
  active = false;

  constructor(inData: any = null) {
    if (inData instanceof Object) {
      Object.entries(inData).forEach((entry) => {
        const [k, v] = entry;
        switch (k) {
          case "startJd":
          case "num":
            if (typeof v === "number") {
              this[k] = v;
            }
            break;
          case "startDt":
            if (typeof v === "string") {
              this.startDt = toDateTime(v);
            }
            break;
          case "name":
          case "ruler":
          case "night":
          case "res":
          case "result":
            if (typeof v === "string") {
              this[k] = v;
            }
            break;
          case "active":
            if (typeof v === "boolean") {
              this[k] = v;
            }
            break;
        }
      });
    }
  }
}