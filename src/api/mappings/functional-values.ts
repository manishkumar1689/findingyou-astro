/*
    Lookup table for
    Functional Benefics, Malefics, Neutrals for each Lagna sign (Ascendant sign)

    Rules:
    Always Benefic: Lords of houses 1, 5, 9
    Always Malefic: Lords of houses 3, 6, 11
    Always Neutral: Lords of houses 4, 7, 10 (10  most neutral)
    Always Neutral: Lords of houses 2, 12, 8 (8 most neutral)
    Yoga karaka (highest benefic): rules Trikona house (1, 5, 9) and Kendra house (1, 4, 7, 10)
    Benefic: Benefic + Neutral (except Jupiter/Mercury owning 2 kendras = Kendradhi Dosha)
             (benefic + benefic never occurs, except Ketu for water sign Lagna, ruling Sc & Ps)
    Malefic: Malefic + Malefic / Malefic + Neutral
    Neutral: Neutral + Neutral / Benefic + Malefic?
*/

const functionalValues = [
  /* assuming that Rahu riles Aq & Vi, Ketu rules Sc & Ps */
  {
    lagnaSign: 1,
    yogaKaraka: [],
    funcBenefic: ["su", "ma", "ju"],
    funcNeutral: ["mo", "ke"],
    funcMalefic: ["ra", "me", "ve", "sa"],
  },
  {
    lagnaSign: 2,
    yogaKaraka: ["sa", "ra"],
    funcBenefic: ["me", "sa", "ra"],
    funcNeutral: ["su", "ma"],
    funcMalefic: ["mo", "ju", "ve", "ke"],
  },
  {
    lagnaSign: 3,
    yogaKaraka: [],
    funcBenefic: ["ve", "sa", "ra"],
    funcNeutral: ["mo", "me"],
    funcMalefic: ["su", "ma", "ju"],
  },
  {
    lagnaSign: 4,
    yogaKaraka: ["ma"],
    funcBenefic: ["mo", "ma", "ju", "ke"],
    funcNeutral: ["su", "sa"],
    funcMalefic: ["me", "ve"],
  },
  {
    lagnaSign: 5,
    yogaKaraka: ["ma"],
    funcBenefic: ["su", "ma", "ju"],
    funcNeutral: ["mo"],
    funcMalefic: ["me", "ve", "sa"],
  },
  {
    lagnaSign: 6,
    yogaKaraka: [],
    funcBenefic: ["me", "ve"],
    funcNeutral: ["su", "sa"],
    funcMalefic: ["mo", "ma", "ju"],
  },
  {
    lagnaSign: 7,
    yogaKaraka: ["sa"],
    funcBenefic: ["me", "ve", "sa"],
    funcNeutral: [],
    funcMalefic: ["su", "ma", "ju"],
  },
  {
    lagnaSign: 8,
    yogaKaraka: [],
    funcBenefic: ["mo", "ju", "ke"],
    funcNeutral: ["su", "ma"],
    funcMalefic: ["me", "ve", "sa"],
  },
  {
    lagnaSign: 9,
    yogaKaraka: [],
    funcBenefic: ["su", "ma"],
    funcNeutral: ["mo", "me", "ju"],
    funcMalefic: ["ve", "sa"],
  },
  {
    lagnaSign: 10,
    yogaKaraka: ["ve"],
    funcBenefic: ["ve", "me", "sa"],
    funcNeutral: ["su"],
    funcMalefic: ["ma", "ju"],
  },
  {
    lagnaSign: 11,
    yogaKaraka: ["ve"],
    funcBenefic: ["ve", "sa"],
    funcNeutral: ["su", "me"],
    funcMalefic: ["mo", "ma", "ju"],
  },
  {
    lagnaSign: 12,
    yogaKaraka: [],
    funcBenefic: ["mo", "ma", "ke"],
    funcNeutral: ["ju"],
    funcMalefic: ["su", "me", "ve", "sa"],
  },
];

export default functionalValues;
