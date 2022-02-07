import { BodyTransition } from "./BodyTransition";

export class TransitionSet {
  num = 0;
  key = "";
  rise: BodyTransition = new BodyTransition();
  set: BodyTransition = new BodyTransition();
  mc: BodyTransition = new BodyTransition();
  ic: BodyTransition = new BodyTransition();

  constructor(inData: any = null) {
    if (inData instanceof Object) {
      Object.entries(inData).forEach((entry) => {
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
          case "rise":
          case "set":
          case "mc":
          case "ic":
            this[k] = new BodyTransition(v);
            break;
        }
      });
    }
  }
}
