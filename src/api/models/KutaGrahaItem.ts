import { NakshatraItem, RashiObj } from "../interfaces";
import rashiValues from "../mappings/rashi-values";
import { Graha } from "./Graha";

export class KutaGrahaItem {
  key: string;
  gender: string;
  rashi: RashiObj;
  nakshatra: NakshatraItem;
  nakshatra28Num?: number;
  lng: number;
  moonWaxing: boolean;

  constructor(
    graha: Graha,
    gender: string,
    nakshatra: NakshatraItem,
    moonWaxing: boolean
  ) {
    this.key = graha.key;
    this.gender = gender;
    const rashi = rashiValues.find((rs) => rs.num === graha.sign);
    if (rashi instanceof Object) {
      this.rashi = rashi;
    }
    if (graha.nakshatra instanceof Object) {
      this.nakshatra = nakshatra;
    }
    this.lng = graha.longitude;
    this.nakshatra28Num = graha.nakshatra28;
    this.moonWaxing = moonWaxing;
  }

  get nakshatraNum(): number {
    return parseInt(this.nakshatra.key.split("_").pop(), 10);
  }
  get nakshatraIndex(): number {
    return parseInt(this.nakshatra.key.split("_").pop(), 10) - 1;
  }

  get sign(): number {
    return this.rashi.num;
  }

  get signIndex(): number {
    return this.rashi.num - 1;
  }
}
