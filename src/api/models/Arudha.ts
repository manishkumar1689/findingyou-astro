export class Arudha {
  house = 0;
  name = "";
  alt = "";

  constructor(inData: any = null) {
    if (inData instanceof Object) {
      const keys = Object.keys(inData);
      if (keys.includes("house")) {
        this.house = inData.house;
      }
      if (keys.includes("name")) {
        this.name = inData.name;
      }
      if (keys.includes("alt")) {
        this.alt = inData.alt;
      }
    }
  }
}
