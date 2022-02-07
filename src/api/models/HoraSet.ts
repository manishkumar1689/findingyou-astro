export class HoraSet {
  jd = 0;
  ruler = "";
  index = 0;
  weekDay = 0;
  [key: string]: any;

  constructor(inData: any = null) {
    if (inData instanceof Object) {
      Object.entries(inData).forEach(entry => {
        const [k, v] = entry;
        switch (k) {
          case "jd":
          case "weekday":
          case "index":
            if (typeof v === "number") {
              this[k] = v;
            }
            break;
          case "ruler":
            if (typeof v === "string") {
              this[k] = v;
            }
            break;
        }
      });
    }
  }
}
