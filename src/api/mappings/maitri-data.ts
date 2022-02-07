const maitriData = {
  natural: [
    {
      graha: "su",
      friends: ["mo", "ma", "ju"],
      neutral: ["me"],
      enemies: ["ve", "sa"],
    },
    {
      graha: "mo",
      friends: ["su", "me"],
      neutral: ["ma", "ju", "ve", "sa"],
      enemies: [],
    },
    {
      graha: "ma",
      friends: ["su", "mo", "ju"],
      neutral: ["ve", "sa"],
      enemies: ["me"],
    },
    {
      graha: "me",
      friends: ["su", "ve"],
      neutral: ["ma", "ju", "sa"],
      enemies: ["mo"],
    },
    {
      graha: "ju",
      friends: ["su", "mo", "ma"],
      neutral: ["sa"],
      enemies: ["me", "ve"],
    },
    {
      graha: "ve",
      friends: ["me", "sa"],
      neutral: ["ma", "ju"],
      enemies: ["su", "mo"],
    },
    {
      graha: "sa",
      friends: ["me", "ve"],
      neutral: ["ju"],
      enemies: ["su", "mo", "ma"],
    },
    { graha: "ra", friends: [], neutral: [], enemies: [] },
    { graha: "ke", friends: [], neutral: [], enemies: [] },
  ],
  temporary: {
    friend: [2, 3, 4, 10, 11, 12],
    enemy: [1, 5, 6, 7, 8, 9],
  },
  compound: {
    bestFriend: [{ natural: "friend", temporary: "friend" }],
    friend: [{ natural: "neutral", temporary: "friend" }],
    neutral: [
      { natural: "friend", temporary: "enemy" },
      { natural: "enemy", temporary: "friend" },
    ],
    enemy: [{ natural: "neutral", temporary: "enemy" }],
    archEnemy: [{ natural: "enemy", temporary: "enemy" }],
  },
  dict: {
    exalted: "8_uc",
    mulaTrikon: "7_mt",
    ownSign: "6_sv",
    bestFriend: "5_am",
    friend: "4_mi",
    neutral: "3_sa",
    enemy: "2_sh",
    archEnemy: "1_as",
    debilitated: "0_ni",
  },
};

export default maitriData;
