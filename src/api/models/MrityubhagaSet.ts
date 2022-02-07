export class MrityubhagaItem {
  lng = 0;
  sign = 0;
  signLng = 0;
  degree = 0;
  active = false;
  graha = "";
  degrees: Array<number> = [];

  constructor(inData: any = null) {
    if (inData instanceof Object) {
      Object.entries(inData).forEach(entry => {
        const [k, v] = entry;
        switch (k) {
          case "lng":
          case "sign":
          case "signLng":
          case "degree":
            if (typeof v === "number") {
              this[k] = v;
            }
            break;
          case "graha":
            if (typeof v === "string") {
              this[k] = v;
            }
            break;
          case "degrees":
            if (v instanceof Array) {
              this[k] = v;
            }
            break;
        }
      });
    }
  }
}

export class MrityubhagaSet {
  standardRange: Array<MrityubhagaItem> = [];
  altRange: Array<MrityubhagaItem> = [];

  constructor(inData: any = null) {
    if (inData instanceof Object) {
      Object.entries(inData).forEach(entry => {
        const [k, v] = entry;
        switch (k) {
          case "standardRange":
          case "altRange":
            if (v instanceof Array) {
              this[k] = v.map(item => new MrityubhagaItem(item));
            }
            break;
        }
      });
    }
  }
}
