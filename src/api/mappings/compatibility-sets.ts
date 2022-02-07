export const defaultCompatibilityCategoryOpts = [
  { key: "generic", name: "Generic", maxScore: 10 },
  { key: "emotional", name: "Emotional", maxScore: 10 },
  { key: "activity", name: "Activity", maxScore: 10 },
  { key: "sexual", name: "Sexual", maxScore: 10 },
  { key: "communication", name: "Communication", maxScore: 10 },
  { key: "material_success", name: "Material Success", maxScore: 10 },
];

const coreDegreeGroups = [
  "graha",
  "num_grahas",
  "lordship",
  "cara_karakas",
  "bm",
  "special",
];

export const contextTypes = [
  {
    key: "in_house",
    name: "in house",
    isAspect: false,
    c2groups: ["houses"],
    isKuta: false,
    pIndex: 0
  },
  {
    key: "in_sign",
    name: "in sign",
    isAspect: false,
    c2groups: ["signs"],
    isKuta: false,
    pIndex: 1
  },
  {
    key: "has_dignity",
    name: "has dignity",
    isAspect: false,
    c2groups: ["dignities"],
    isKuta: false,
    pIndex: 2
  },
  {
    key: "nakshatra",
    name: "in nakṣatra",
    isAspect: false,
    c2groups: ["nakshatras"],
    isKuta: false,
    pIndex: -1
  },
  {
    key: "has_dignity_bala_type",
    name: "has dignity/bala",
    isAspect: false,
    c2groups: ["dignities"],
    isKuta: false,
    pIndex: -1
  },
  {
    key: "state_compare",
    name: "state compare",
    isAspect: false,
    c2groups: ["p_karana", "p_yoga", "p_tithi", "p_vara"],
    isKuta: false,
    pIndex: -1
  },
  {
    key: "conjunction",
    name: "in conjunction with",
    isAspect: true,
    c2groups: coreDegreeGroups,
    isKuta: false,
    pIndex: 20
  },
  {
    key: "opposition",
    name: "in opposition with",
    isAspect: true,
    c2groups: coreDegreeGroups,
    isKuta: false,
    pIndex: 21
  },
  {
    key: "square",
    name: "in square with",
    isAspect: true,
    c2groups: coreDegreeGroups,
    isKuta: false,
    pIndex: 22
  },
  {
    key: "trine",
    name: "in trine with",
    isAspect: true,
    c2groups: coreDegreeGroups,
    isKuta: false,
    pIndex: 23
  },
  {
    key: "sextile",
    name: "in sextile with",
    isAspect: true,
    c2groups: coreDegreeGroups,
    isKuta: false,
    pIndex: 24
  },
  {
    key: "quincunx",
    name: "in quincunx with",
    isAspect: true,
    c2groups: coreDegreeGroups,
    isKuta: false,
    pIndex: 25
  },
  {
    key: "hard_aspect",
    name: "in hard aspect to",
    isAspect: true,
    c2groups: coreDegreeGroups,
    isKuta: false,
    pIndex: 26
  },
  {
    key: "soft_aspect",
    name: "in soft aspect to",
    isAspect: true,
    c2groups: coreDegreeGroups,
    isKuta: false,
    pIndex: 27
  },
  {
    key: "any_aspect",
    name: "in any aspect with",
    isAspect: true,
    c2groups: coreDegreeGroups,
    isKuta: false,
    pIndex: 28
  },
  {
    key: "decl_parallel",
    name: "in parallel with",
    isAspect: true,
    c2groups: coreDegreeGroups,
    isKuta: false,
  },
  {
    key: "incontra_parallel",
    name: "in c.-parallel with",
    isAspect: true,
    c2groups: coreDegreeGroups,
    isKuta: false,
  },
  {
    key: "same_sign",
    name: "in Same Sign as",
    isAspect: true,
    c2groups: coreDegreeGroups,
    isKuta: false,
    pIndex: 8
  },
  {
    key: "graha_yuti",
    name: "in yuti with",
    isAspect: false,
    c2groups: coreDegreeGroups,
    isKuta: false,
    pIndex: 9
  },
  {
    key: "sends_graha_drishti",
    name: "sends g.dṛṣṭi to",
    isAspect: false,
    c2groups: coreDegreeGroups,
    isKuta: false,
    pIndex: 10
  },
  {
    key: "receives_graha_drishti",
    name: "gets g.dṛṣṭi from",
    isAspect: false,
    c2groups: coreDegreeGroups,
    isKuta: false,
    pIndex: 11
  },
  {
    key: "only_receives_drishti",
    name: "Only gets g.dṛṣṭi from",
    isAspect: false,
    c2groups: coreDegreeGroups,
    isKuta: false,
    pIndex: 12
  },
  {
    key: "mutual_graha_drishti",
    name: "mutual g.dṛṣṭi with",
    isAspect: false,
    c2groups: coreDegreeGroups,
    isKuta: false,
    pIndex: 13
  },
  {
    key: "rashi_drishti",
    name: "in rāśi dṛṣṭi with",
    isAspect: true,
    c2groups: coreDegreeGroups,
    isKuta: false,
    pIndex: -1
  },
  {
    key: "shubha_kartari_yoga",
    name: "has śubha kartari yoga",
    isAspect: true,
    c2groups: ["graha", "funcmb", "natmb"],
    isKuta: false,
    pIndex: 15
  },
  {
    key: "papa_kartari_yoga",
    name: "has pāpa kartari yoga",
    isAspect: true,
    c2groups: ["graha", "funcmb", "natmb"],
    isKuta: false,
    pIndex: 16
  },
  {
    key: "all_ashtakutas",
    name: "Aṣṭakūṭas",
    isAspect: false,
    c2groups: ["all"],
    isKuta: true,
    pIndex: -1
  },
  {
    key: "all_dvadashakutas",
    name: "Dvadaśakūṭas",
    isAspect: false,
    c2groups: ["all"],
    isKuta: true,
    pIndex: -1
  },
  {
    key: "dvadasha_other_kutas",
    name: "Dvadaśa + other kutas",
    isAspect: false,
    c2groups: ["all"],
    isKuta: true,
    pIndex: -1
  },
  {
    key: "varna_kuta",
    name: "Varṇa Kūṭa",
    isAspect: false,
    c2groups: ["all"],
    isKuta: true,
    pIndex: -1
  },
  {
    key: "vashya_kuta",
    name: "Vaśya Kūṭa",
    isAspect: false,
    c2groups: ["all"],
    isKuta: true,
    pIndex: -1
  },
  {
    key: "graha_maitri",
    name: "Graha Maitri",
    isAspect: false,
    c2groups: ["all"],
    isKuta: true,
    pIndex: -1
  },
  {
    key: "rashi_ruta",
    name: "Rāśi Kūṭa",
    isAspect: false,
    c2groups: ["all"],
    isKuta: true,
    pIndex: -1
  },
  {
    key: "dina_tara_kuta",
    name: "Dina (Tara) Kūṭa",
    isAspect: false,
    c2groups: ["all"],
    isKuta: true,
    pIndex: -1
  },
  {
    key: "yoni_kuta",
    name: "Yoni Kūṭa",
    isAspect: false,
    c2groups: ["all"],
    isKuta: true,
    pIndex: -1
  },
  {
    key: "gana_kuta",
    name: "Gana Kūṭa",
    isAspect: false,
    c2groups: ["all"],
    isKuta: true,
    pIndex: -1
  },
  {
    key: "nadi_kuta",
    name: "Nādī Kūṭa",
    isAspect: false,
    c2groups: ["all"],
    isKuta: true,
    pIndex: -1
  },
  {
    key: "rajju_kuta",
    name: "Rajju Kūṭa",
    isAspect: false,
    c2groups: ["all"],
    isKuta: true,
    pIndex: -1
  },
  {
    key: "vedha_kuta",
    name: "Vedha Kūṭa",
    isAspect: false,
    c2groups: ["all"],
    isKuta: true,
    pIndex: -1
  },
  {
    key: "mahendra",
    name: "Mahendra",
    isAspect: false,
    c2groups: ["all"],
    isKuta: true,
    pIndex: -1
  },
  {
    key: "stri_dirgha",
    name: "Strī Dīrghā",
    isAspect: false,
    c2groups: ["all"],
    isKuta: true,
    pIndex: -1
  },
  {
    key: "gotra_kuta",
    name: "Gotra Kūṭa",
    isAspect: false,
    c2groups: ["all"],
    isKuta: true,
    pIndex: -1
  },
  {
    key: "vihamga_kuta",
    name: "Vihaṃga Kūṭa",
    isAspect: false,
    c2groups: ["all"],
    isKuta: true,
    pIndex: -1
  },
  {
    key: "yonyanukulya_kuta",
    name: "Yonyānukulya Kūṭa",
    isAspect: false,
    c2groups: ["all"],
    isKuta: true,
    pIndex: -1
  },
  {
    key: "naksatra_bhuta_kuta",
    name: "Nakṣatra Bhūta Kūṭa",
    isAspect: false,
    c2groups: ["all"],
    isKuta: true,
    pIndex: -1
  },
  {
    key: "rashi_bhuta_kuta",
    name: "Rāśi Bhūta Kūṭa",
    isAspect: false,
    c2groups: ["all"],
    isKuta: true,
    pIndex: -1
  },
  {
    key: "aya_vyaya_kuta",
    name: "Āya-Vyaya kūṭa",
    isAspect: false,
    c2groups: ["all"],
    isKuta: true,
    pIndex: -1
  },
  {
    key: "rna_dhana_kuta",
    name: "Ṛṇa-Dhana kūṭa",
    isAspect: false,
    c2groups: ["all"],
    isKuta: true,
    pIndex: -1
  },
  {
    key: "vainashika_kuta",
    name: "Vaināśika Kūṭa",
    isAspect: false,
    c2groups: ["all"],
    isKuta: true,
    pIndex: -1
  },
];

export const aspectQualities = [
  {
    key: "applying_aspect",
    name: "Applying aspect",
    isAspect: true,
    isKuta: false,
  },
  {
    key: "separating_aspect",
    name: "Separating Aspect",
    isAspect: true,
    isKuta: false,
  },
];

export const pairedChartRatings = [
  {
    key: "both__gte_aa",
    name: "both charts have AA Rodden score",
  },
  { key: "both_gte_a", name: "both have A rating or better" },
  { key: "both_gte_b", name: "both have B rating or better" },
  { key: "both_gte_c", name: "both have C rating or better" },
  { key: "both_any", name: "both can have any Rodden rating " },
];

export const aspectConfigOptions = [
  {
    key: "whole_sign",
    name: "`Use whole Sign/House aspects`",
    options: [
      {
        key: "linear",
        name: "Use within sign/house linear ratio for score",
      },
      {
        key: "hartdefouw_7_5_rule",
        name:
          "Use within Hart de Fouw 7.5 degree rule with sign/house linear ratio for score",
      },
    ],
  },
  {
    key: "bhava_chalit",
    name: "Use Bhava Chalit Houses instead of Whole Sign/House",
    options: [
      {
        key: "linear",
        name: "Use within house linear ratio for score",
      },
    ],
  },
  {
    key: "orb",
    name: "Use Orbed Aspects not limited by sign boundaries",
    options: [
      {
        key: "linear",
        name: "Use within orb linear ratio for score",
      },
      {
        key: "tajik_diptamsha_orbs",
        name: "Use Tajik Dīptāṃśa Orbs",
      },
      {
        key: "custom_orbs",
        name: "Use Custom Orb Settings",
      },
    ],
  },
];

export const singleModeOnlyContexts = ["has_dignity_bala_type"];
