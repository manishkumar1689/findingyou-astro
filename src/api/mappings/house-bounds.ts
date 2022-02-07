const housePositions = [
  {
    num: 1,
    bounds: [
      { x: 50, y: 0 },
      { x: 50, y: 50 },
      { x: 25, y: 25 },
      { x: 75, y: 25 },
    ],
    outerBounds: [
      { x: 100 * (1 / 3), y: 0 },
      { x: 100 * (3 / 8), y: 100 * (1 / 8) },
      { x: 100 * (5 / 8), y: 100 * (1 / 8) },
      { x: 100 * (2 / 3), y: 0 },
    ],
    dir: "top-to-bottom",
    pos: "mid-top",
  },
  {
    num: 2,
    bounds: [
      { x: 0, y: 0 },
      { x: 25, y: 25 },
      { x: 50, y: 0 },
    ],
    outerBounds: [
      { x: 0, y: 0 },
      { x: 100 * (1 / 8), y: 100 * (1 / 8) },
      { x: 100 * (3 / 8), y: 100 * (1 / 8) },
      { x: 100 * (1 / 3), y: 0 },
    ],
    dir: "right-to-left",
    pos: "top-left",
  },
  {
    num: 3,
    bounds: [
      { x: 0, y: 0 },
      { x: 25, y: 25 },
      { x: 0, y: 50 },
    ],
    outerBounds: [
      { x: -5, y: 100 * (1 / 3) },
      { x: 100 * (1 / 8), y: 100 * (3 / 8) },
      { x: 100 * (1 / 8), y: 100 * (1 / 8) },
      { x: -5, y: 0 },
    ],
    dir: "top-to-bottom",
    pos: "left-top",
  },
  {
    num: 4,
    bounds: [
      { x: 0, y: 50 },
      { x: 50, y: 50 },
      { x: 25, y: 25 },
      { x: 25, y: 75 },
    ],
    outerBounds: [
      { x: -5, y: 100 * (2 / 3) },
      { x: 100 * (1 / 8), y: 100 * (5 / 8) },
      { x: 100 * (1 / 8), y: 100 * (3 / 8) },
      { x: -5, y: 100 * (1 / 3) },
    ],
    dir: "top-to-bottom",
    pos: "mid-left",
  },
  {
    num: 5,
    bounds: [
      { x: 0, y: 50 },
      { x: 25, y: 75 },
      { x: 0, y: 100 },
    ],
    outerBounds: [
      { x: -5, y: 100 },
      { x: 100 * (1 / 8), y: 100 * (7 / 8) },
      { x: 100 * (1 / 8), y: 100 * (5 / 8) },
      { x: -5, y: 100 * (2 / 3) },
    ],
    dir: "top-to-bottom",
    pos: "left-bottom",
  },
  {
    num: 6,
    bounds: [
      { x: 0, y: 100 },
      { x: 25, y: 75 },
      { x: 50, y: 100 },
    ],
    outerBounds: [
      { x: 100 * (1 / 3), y: 100 },
      { x: 100 * (3 / 8), y: 100 * (7 / 8) },
      { x: 100 * (1 / 8), y: 100 * (7 / 8) },
      { x: 0, y: 100 },
    ],
    dir: "left-to-right",
    pos: "bottom-left",
  },
  {
    num: 7,
    bounds: [
      { x: 50, y: 50 },
      { x: 50, y: 100 },
      { x: 25, y: 75 },
      { x: 75, y: 75 },
    ],
    outerBounds: [
      { x: 100 * (2 / 3), y: 100 },
      { x: 100 * (5 / 8), y: 100 * (7 / 8) },
      { x: 100 * (3 / 8), y: 100 * (7 / 8) },
      { x: 100 * (1 / 3), y: 100 },
    ],
    dir: "bottom-to-top",
    pos: "mid-bottom",
  },
  {
    num: 8,
    bounds: [
      { x: 50, y: 100 },
      { x: 75, y: 75 },
      { x: 100, y: 100 },
    ],
    outerBounds: [
      { x: 100, y: 100 },
      { x: 100 * (7 / 8), y: 100 * (7 / 8) },
      { x: 100 * (5 / 8), y: 100 * (7 / 8) },
      { x: 100 * (2 / 3), y: 100 },
    ],
    dir: "left-to-right",
    pos: "bottom-right",
  },
  {
    num: 9,
    bounds: [
      { x: 100, y: 100 },
      { x: 75, y: 75 },
      { x: 100, y: 50 },
    ],
    outerBounds: [
      { x: 100, y: 100 * (2 / 3) },
      { x: 100 * (7 / 8), y: 100 * (5 / 8) },
      { x: 100 * (7 / 8), y: 100 * (7 / 8) },
      { x: 100, y: 100 },
    ],
    dir: "bottom-to-top",
    pos: "right-bottom",
  },
  {
    num: 10,
    bounds: [
      { x: 75, y: 25 },
      { x: 50, y: 50 },
      { x: 100, y: 50 },
      { x: 75, y: 75 },
    ],
    outerBounds: [
      { x: 100, y: 100 * (1 / 3) },
      { x: 100 * (7 / 8), y: 100 * (3 / 8) },
      { x: 100 * (7 / 8), y: 100 * (5 / 8) },
      { x: 100, y: 100 * (2 / 3) },
    ],
    dir: "bottom-to-top",
    pos: "mid-right",
  },
  {
    num: 11,
    bounds: [
      { x: 100, y: 50 },
      { x: 75, y: 25 },
      { x: 100, y: 0 },
    ],
    outerBounds: [
      { x: 100, y: 0 },
      { x: 100 * (7 / 8), y: 100 * (1 / 8) },
      { x: 100 * (7 / 8), y: 100 * (3 / 8) },
      { x: 100, y: 100 * (1 / 3) },
    ],
    dir: "bottom-to-top",
    pos: "right-top",
  },
  {
    num: 12,
    bounds: [
      { x: 50, y: 0 },
      { x: 75, y: 25 },
      { x: 100, y: 0 },
    ],
    outerBounds: [
      { x: 100 * (2 / 3), y: 0 },
      { x: 100 * (7 / 8), y: 100 * (1 / 8) },
      { x: 100 * (5 / 8), y: 100 * (1 / 8) },
      { x: 100, y: 0 },
    ],
    dir: "right-to-left",
    pos: "top-right",
  },
];

export default housePositions;
