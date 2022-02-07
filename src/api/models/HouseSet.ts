import { smartCastFloat } from "../converters";
import { NameNumber, House } from "../interfaces";
import { isNumeric } from "../validators";
import { camelToTitle } from "../converters";

export class HouseSet {
  houses: Array<number> = [];
  ascendant = 0;
  mc = 0;
  vertex = 0;
  [key: string]: any;

  constructor(inData: any = null) {
    if (inData instanceof Object) {
      Object.entries(inData).forEach((entry) => {
        const [k, v] = entry;
        switch (k) {
          case "houses":
            if (v instanceof Array) {
              if (v.length > 0) {
                const first = v[0];
                this.houses = [first];
                for (let i = 1; i < 12; i++) {
                  this.houses.push((first + i * 30) % 360);
                }
              }
            }
            break;
          case "ascendant":
          case "mc":
          case "vertex":
            this[k] = smartCastFloat(v);
            break;
        }
      });
    }
  }

  houseValues(): Array<House> {
    return this.houses.map((lng, index) => {
      return {
        num: index + 1,
        lng,
      };
    });
  }

  numericValues(): Array<NameNumber> {
    return Object.entries(this)
      .filter((entry) => isNumeric(entry[1]))
      .map((entry) => {
        const [key, value] = entry;
        return {
          key,
          format: "deg",
          name: camelToTitle(key),
          value,
        };
      });
  }
}
