import { Arudha } from "./Arudha";

export class Rashi {
  num = 0;
  key = "";
  icon = "";
  element = "";
  mobility = "";
  houseNum = 0;
  lordInHouse = 0;
  houseDifference = 0;
  arudhaInhouse = 0;
  arudha = new Arudha();
  [key: string]: any;

  constructor(inData: any) {
    if (inData instanceof Object) {
      Object.entries(inData).forEach(entry => {
        const [k, v] = entry;
        switch (k) {
          case "arudha":
            this.arudha = new Arudha(v);
            break;
          default:
            this[k] = v;
            break;
        }
      });
    }
  }
}
