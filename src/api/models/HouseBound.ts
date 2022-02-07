import { isNumeric } from "../validators";
import { XYPos } from "../interfaces";
import houseBounds from "../mappings/house-bounds";

export class HouseBound {
  num = 0;
  bounds: Array<XYPos> = [];
  outerBounds: Array<XYPos> = [];
  dir = "";
  pos = "";

  constructor(data: any = null) {
    if (data instanceof Object) {
      const { num, bounds, outerBounds, dir, pos } = data;
      if (isNumeric(num) && bounds instanceof Array) {
        this.num = parseInt(num);
        this.bounds = bounds;
        if (outerBounds instanceof Array) {
          this.outerBounds = outerBounds;
        }
        this.dir = dir;
        this.pos = pos;
      }
    }
  }

  inside(point: XYPos, type = "inner") {
    const { x, y } = point;
    let inside = false;
    const bs = this.matchBounds(type);
    const bl = bs.length;
    for (let i = 0, j = bl - 1; i < bl; j = i++) {
      const xi = bs[i].x;
      const yi = bs[i].y;
      const xj = bs[j].x;
      const yj = bs[j].y;
      const intersect =
        yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) {
        inside = !inside;
      }
    }
    return inside;
  }

  get middle(): XYPos {
    return this.calcMiddle("inner");
  }

  get middleOuter(): XYPos {
    return this.calcMiddle("outer");
  }

  get outerDir(): string {
    const invert = [12, 1, 2, 9, 10, 11].includes(this.num);
    const isVertical = Math.floor((this.num - 3) / 3) % 2 === 0;
    if (isVertical) {
      return invert ? "bottom-to-top" : "top-to-bottom";
    } else {
      return invert ? "right-to-left" : "left-to-right";
    }
  }

  matchBounds(type = "inner") {
    switch (type) {
      case "outer":
        return this.outerBounds;
      default:
        return this.bounds;
    }
  }

  calcMiddle(type = "inner"): XYPos {
    const bs = this.matchBounds(type);
    const size = bs.length;
    const midX = bs.map((b) => b.x).reduce((a, b) => a + b, 0) / size;
    const midY = bs.map((b) => b.y).reduce((a, b) => a + b, 0) / size;
    return {
      x: midX,
      y: midY,
    };
  }

  get classNames(): Array<string> {
    return [this.orientation, this.direction, this.pos];
  }

  get outerClassNames(): Array<string> {
    return [this.orientation, this.direction];
  }

  get direction(): string {
    return this.dir;
  }

  get orientation(): string {
    switch (this.dir) {
      case "left-to-right":
      case "right-to-left":
        return "horizontal";
      default:
        return "vertical";
    }
  }
}

export const houseBoundItems = () => {
  return houseBounds.map((row) => new HouseBound(row));
};
