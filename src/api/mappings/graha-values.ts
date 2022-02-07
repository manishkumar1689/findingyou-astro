const grahaValues = [
  {
    num: 0,
    jyNum: 1,
    subkey: "a_01",
    key: "su",
    nature: ["m"],
    gender: "m",
    bhuta: "",
    guna: "sat",
    caste: 2,
    dhatu: 2,
    dosha: ["2_2"],
    friends: ["mo", "ma", "ju"],
    neutral: ["me"],
    enemies: ["ve", "sa"],
    ownSign: [5],
    exalted: 1,
    exaltedDegree: 10,
    mulaTrikon: 5,
    mulaTrikonDegrees: [0, 10],
    debilitated: 7,
    charaKarakaMode: "forward",
  },
  {
    num: 1,
    jyNum: 2,
    subkey: "a_02",
    key: "mo",
    nature: ["b", "m"],
    gender: "f",
    bhuta: "",
    guna: "sat",
    caste: 3,
    dhatu: 1,
    dosha: ["2_1", "2_3"],
    friends: ["su", "me"],
    neutral: ["ma", "ju", "ve", "sa"],
    enemies: [],
    ownSign: [4],
    exalted: 2,
    exaltedDegree: 3,
    mulaTrikon: 2,
    mulaTrikonDegrees: [4, 30],
    debilitated: 8,
    charaKarakaMode: "forward",
  },
  {
    num: 2,
    jyNum: 4,
    subkey: "a_04",
    key: "me",
    nature: ["b", "m"],
    gender: "n",
    bhuta: "prithvi",
    guna: "raj",
    caste: 3,
    dhatu: 3,
    dosha: ["2_1", "2_2", "2_3"],
    friends: ["su", "ve"],
    neutral: ["ma", "ju", "sa"],
    enemies: ["mo"],
    ownSign: [3, 6],
    exalted: 6,
    exaltedDegree: 15,
    mulaTrikon: 6,
    mulaTrikonDegrees: [16, 20],
    debilitated: 12,
    yearLength: 87.9691,
    charaKarakaMode: "forward",
  },
  {
    num: 3,
    jyNum: 6,
    subkey: "a_06",
    key: "ve",
    nature: ["b"],
    gender: "f",
    bhuta: "jala",
    guna: "raj",
    caste: 1,
    dhatu: 2,
    dosha: ["2_3", "2_1"],
    friends: ["me", "sa"],
    neutral: ["ma", "ju"],
    enemies: ["su", "mo"],
    ownSign: [2, 7],
    exalted: 12,
    exaltedDegree: 27,
    mulaTrikon: 7,
    mulaTrikonDegrees: [0, 15],
    debilitated: 6,
    yearLength: 224.701,
    charaKarakaMode: "forward",
  },
  {
    num: 4,
    jyNum: 3,
    subkey: "a_03",
    key: "ma",
    nature: ["m"],
    gender: "m",
    bhuta: "agni",
    guna: "tam",
    caste: 2,
    dhatu: 1,
    dosha: ["2_2"],
    friends: ["su", "mo", "ju"],
    neutral: ["ve", "sa"],
    enemies: ["me"],
    ownSign: [1, 8],
    exalted: 10,
    exaltedDegree: 28,
    mulaTrikon: 1,
    mulaTrikonDegrees: [0, 12],
    debilitated: 4,
    yearLength: 686.971,
    charaKarakaMode: "forward",
  },
  {
    num: 5,
    jyNum: 5,
    subkey: "a_05",
    key: "ju",
    nature: ["b"],
    gender: "m",
    bhuta: "akasha",
    guna: "sat",
    caste: 1,
    dhatu: 3,
    dosha: ["2_3"],
    friends: ["su", "mo", "ma"],
    neutral: ["sa"],
    enemies: ["me", "ve"],
    ownSign: [9, 12],
    exalted: 4,
    exaltedDegree: 5,
    mulaTrikon: 9,
    mulaTrikonDegrees: [0, 10],
    debilitated: 10,
    yearLength: 4332.5029764,
    charaKarakaMode: "forward",
  },
  {
    num: 6,
    jyNum: 7,
    subkey: "a_07",
    key: "sa",
    nature: ["m"],
    gender: "n",
    bhuta: "vayu",
    guna: "tam",
    caste: 4,
    dhatu: 1,
    dosha: ["2_1"],
    friends: ["me", "ve"],
    neutral: ["ju"],
    enemies: ["su", "mo", "ma"],
    ownSign: [10, 11],
    exalted: 7,
    exaltedDegree: 20,
    mulaTrikon: 11,
    mulaTrikonDegrees: [0, 20],
    debilitated: 1,
    yearLength: 10758.97600962,
    charaKarakaMode: "forward",
  },
  {
    num: 101,
    jyNum: 8,
    subkey: "a_08",
    key: "ra",
    nature: ["m"],
    gender: "n",
    bhuta: "",
    guna: "tam",
    caste: 5,
    dhatu: 1,
    dosha: ["2_1"],
    friends: [],
    neutral: [],
    enemies: [],
    ownSign: [11, 6],
    exalted: 2,
    exaltedDegree: 20,
    mulaTrikon: 11,
    mulaTrikonDegrees: [0, 20],
    debilitated: 8,
    charaKarakaMode: "reverse",
  },
  {
    num: 102,
    jyNum: 9,
    subkey: "a_09",
    key: "ke",
    calc: "opposite",
    nature: ["m"],
    gender: "n",
    bhuta: "",
    guna: "tam",
    caste: 5,
    dhatu: 3,
    dosha: ["2_2"],
    friends: [],
    neutral: [],
    enemies: [],
    ownSign: [8, 12],
    exalted: 8,
    exaltedDegree: 20,
    mulaTrikon: 8,
    mulaTrikonDegrees: [0, 20],
    debilitated: 2,
  },
  {
    num: 7,
    subkey: "a_10",
    key: "ur",
    friends: [],
    neutral: [],
    enemies: [],
    ownSign: [11],
    yearLength: 30687.649644,
  },
  {
    num: 8,
    subkey: "a_11",
    key: "ne",
    friends: [],
    neutral: [],
    enemies: [],
    ownSign: [12],
    yearLength: 60191.914560000005,
  },
  {
    num: 9,
    subkey: "a_12",
    key: "pl",
    friends: [],
    neutral: [],
    enemies: [],
    ownSign: [8],
    yearLength: 90558.151068,
  },
];

export default grahaValues;

export const naturalBenefics = ["mo", "ve", "ju"];
export const naturalMalefics = ["su", "ma", "sa"];
export const naturalNeutral = ["me"];

export const functionalHouseNatures = [
  { house: 1, nature: "b", index: 0 },
  { house: 2, nature: "n", set: 2, index: 0 },
  { house: 3, nature: "m", index: 0 },
  { house: 4, nature: "n", set: 1, index: 0 },
  { house: 5, nature: "b", index: 1 },
  { house: 6, nature: "m", index: 1 },
  { house: 7, nature: "n", set: 1, index: 1 },
  { house: 8, nature: "n", set: 2, index: 2 },
  { house: 9, nature: "b", index: 2 },
  { house: 10, nature: "n", set: 1, index: 2 },
  { house: 11, nature: "m", index: 2 },
  { house: 12, nature: "n", set: 2, index: 0 },
];

export const aspectGroups = [
  [
    { key: "conjunction", div: 1, fac: 1, cg: "red" },
    { key: "opposition", div: 2, fac: 1, cg: "red" },
    { key: "trine", div: 3, fac: 1, cg: "blue" },
    { key: "square", div: 4, fac: 1, cg: "red" },
  ],
  [{ key: "sextile", div: 6, fac: 1, cg: "green" }],
  [
    { key: "sesqui-square", div: 3, fac: 3, cg: "red" },
    { key: "inconjunction", div: 12, fac: 5, cg: "black" },
    { key: "semi-square", div: 8, fac: 1, cg: "red" },
  ],
  [
    { key: "semi-sextile", div: 2, fac: 1, cg: "grey" },
    { key: "quintile", div: 5, fac: 1, cg: "grey" },
    { key: "bi-quintile", div: 5, fac: 2, cg: "grey" },
  ],
  [
    { key: "virgintile", div: 20, fac: 1, cg: "grey" },
    { key: "quindecile", div: 24, fac: 11, cg: "grey" },
    { key: "undecile", div: 11, fac: 1, cg: "grey" },
    { key: "dectile", div: 10, fac: 1, cg: "grey" },
    { key: "novile", div: 9, fac: 1, cg: "grey" },
    { key: "bi-novile", div: 9, fac: 2, cg: "grey" },
    { key: "quad-novile", div: 9, fac: 4, cg: "grey" },
    { key: "tri-decile", div: 10, fac: 3, cg: "grey" },
    { key: "tri-septile", div: 7, fac: 3, cg: "grey" },
    { key: "bi-septile", div: 7, fac: 2, cg: "grey" },
    { key: "septile", div: 7, fac: 1, cg: "grey" },
  ],
];

export interface OrbGrahaSet {
  group: number;
  orbs: number[];
  keys: string[];
}

export const orbGrahaMatches: OrbGrahaSet[] = [
  { group: 1, orbs: [12, 5, 3, 1, 0.5], keys: ["su", "mo"] },
  { group: 2, orbs: [7, 5, 2, 1, 0.5], keys: ["me", "ve", "ma"] },
  { group: 3, orbs: [5, 2, 1, 0.5], keys: ["ju", "sa"] },
  { group: 4, orbs: [3, 2, 1, 1, 0.5], keys: ["ur", "ne", "pl"] },
  { group: 6, orbs: [1, 0, 0, 0, 0], keys: ["ra", "ke"] },
  { group: 7, orbs: [7, 5, 2, 1, 0.5], keys: ["as", "ds", "mc", "ic"] },
];

export const rulerSignsMap = (): Map<string, number[]> => {
  const mp = new Map<string, number[]>();
  grahaValues.forEach((gr) => {
    if (gr instanceof Object) {
      const { ownSign, jyNum } = gr;
      if (jyNum) {
        if (jyNum > 0 && jyNum <= 9 && ownSign instanceof Array) {
          mp.set(gr.key, ownSign);
        }
      }
    }
  });
  return mp;
};

export const grahaUnicodeSymbols = {
  as: "Asc",
  su: "☉",
  mo: "☾",
  me: "☿",
  ve: "♀",
  ma: "♂",
  ju: "♃",
  sa: "♄",
  ur: "♅",
  ne: "♆",
  pl: "♇",
  ra: "☊",
  ke: "☋",
};

export const directionalStrengthMap = {
  su: 10,
  mo: 4,
  ma: 10,
  me: 1,
  ju: 1,
  ve: 4,
  sa: 7,
};

export const directionalStrengthToTransitionMap = {
  su: "mc",
  mo: "ic",
  ma: "mc",
  me: "rise",
  ju: "rise",
  ve: "ic",
  sa: "set",
};

export const hasDikBala = (key = "su", type = "rise") => {
  return Object.keys(directionalStrengthToTransitionMap).includes(key)
    ? directionalStrengthToTransitionMap[key] === type
    : false;
};