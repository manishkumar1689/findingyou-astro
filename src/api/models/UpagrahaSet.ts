import { BodyTransition } from "./BodyTransition";
import { GeoLoc } from "./GeoLoc";
import { UpagrahaValue } from "./UpagrahaValue";
import { mapUpagrahaValue } from "../mappers";

export class UpagrahaSet {
  values: Array<UpagrahaValue> = [];
  geo = new GeoLoc([0, 0, 0]);
  weekDay = 0;
  eighth = 0;
  periodHours = 0;
  rise = new BodyTransition();
  set = new BodyTransition();
  nextRise = new BodyTransition();
  prevRise = new BodyTransition();
  prevSet = new BodyTransition();
  [key: string]: any;

  constructor(inData: any = null) {
    if (inData instanceof Object) {
      Object.entries(inData).forEach((entry) => {
        const [k, v] = entry;
        switch (k) {
          case "values":
            if (v instanceof Array) {
              this.values = v.map(mapUpagrahaValue);
            }
            break;
          case "geo":
            this.geo = new GeoLoc(v);
            break;
          case "weekDay":
          case "eighth":
          case "periodHours":
          case "startJs":
            this[k] = v;
            break;
          case "set":
          case "prevSet":
          case "rise":
          case "prevRise":
          case "nextRise":
            this[k] = new BodyTransition(v);
            break;
        }
      });
    }
  }
}
