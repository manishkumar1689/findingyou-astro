const widgetDefaults = [
  {
    category: "01_sphutas",
    panes: ["single"],
    widgets: [
      {
        key: "01_01",
        name: "GrahaTable",
        mode: "standard",
        active: ["single", "paired"],
        enabled: true,
        settings: { vargaNum: 1 },
      },
      {
        key: "01_02",
        name: "NavagrahasWidget",
        mode: "outer_planets",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "01_03",
        name: "AstronomicalDetails",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "01_04",
        name: "NavagrahasWidget",
        mode: "minor_planets",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "01_05",
        name: "FixedStars",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "01_06",
        name: "LagnasWidget",
        mode: "misc",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "01_07",
        name: "PrashnaMargaSphutas",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "01_08",
        name: "LagnaSphutaSet",
        active: ["single", "paired"],
        enabled: true,
        settings: { vargaNum: 1 },
      },
      {
        key: "01_09",
        name: "KrshnamurtiPaddhatiWidget",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
    ],
  },
  {
    category: "02_balas",
    panes: ["single", "paired"],
    widgets: [
      {
        key: "02_01",
        name: "PancakaMaitriWidget",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "02_02",
        name: "AshtakavargaTable",
        active: ["single", "paired"],
        enabled: true,
        settings: { vargaNum: 1 },
      },
      {
        key: "02_03",
        name: "Shadbala",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "02_04",
        name: "AvashthasWidget",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "02_05",
        name: "BhavabalaWidget",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "02_06",
        name: "VimshopakaBala",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "02_07",
        name: "VaishesikaṃshaBala",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "02_08",
        name: "IsthaKastaPhalas",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "02_09",
        name: "MrityubhagaTable",
        active: ["single"],
        enabled: true,
        settings: { vargaNum: 1 },
      },
    ],
  },
  {
    category: "03_drishtis",
    panes: ["single", "paired"],
    widgets: [
      {
        key: "03_01",
        name: "GrahaDrishti",
        mode: "graha_drsti_parasari",
        active: ["single"],
        enabled: true,
      },
      {
        key: "03_02",
        name: "GrahaDrishti",
        mode: "rashi_drsti_jaimini",
        active: [],
        enabled: false,
      },
      {
        key: "03_03",
        name: "GrahaDrishti",
        mode: "sphuta_drsti_tajik",
        active: [],
        enabled: false,
      },
      {
        key: "03_04",
        name: "GrahaDrishti",
        mode: "vedhas",
        active: [],
        enabled: false,
      },
      {
        key: "03_05",
        name: "GrahaDrishti",
        mode: "argalas",
        active: [],
        enabled: false,
      },
      {
        key: "03_06",
        name: "GrahaDrishti",
        mode: "sarvatobhadra_vedhas",
        active: [],
        enabled: false,
      },
      {
        key: "03_07",
        name: "GrahaDrishti",
        mode: "graha_naksatra_drsti",
        active: [],
        enabled: false,
      },
      {
        key: "03_08",
        name: "GrahaDrishti",
        mode: "graha_naksatra_latta",
        active: [],
        enabled: false,
      },
      {
        key: "03_09",
        name: "GrahaDrishti",
        mode: "western_aspectarian",
        active: [],
        enabled: false,
      },
      {
        key: "03_10",
        name: "GrahaDrishti",
        mode: "declination_parallels",
        active: [],
        enabled: false,
      },
    ],
  },
  {
    category: "04_cakras",
    panes: ["single", "paired"],
    widgets: [
      {
        key: "04_01",
        name: "SarvatobhadraCakra",
        active: ["single", "paired"],
        enabled: true,
        settings: { vargaNum: 1 },
      },
      {
        key: "04_02",
        name: "KotaCakraChart",
        active: ["single", "paired"],
        enabled: true,
        settings: { vargaNum: 1 },
      },
      {
        key: "04_03",
        name: "CakraSudarshanaChart",
        active: ["single"],
        enabled: true,
        settings: { vargaNum: 1 },
      },
      {
        key: "04_04",
        name: "SulaCakraChart",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "04_05",
        name: "TrisulaCakraChart",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "04_06",
        name: "SuryaKalanalaCakra",
        active: [],
        settings: { vargaNum: 1 },
      },
      {
        key: "04_07",
        name: "SarvaCancaCakra",
        active: [],
        settings: { vargaNum: 1 },
      },
    ],
  },
  {
    category: "05_pancha",
    panes: ["current", "single", "paired"],
    widgets: [
      {
        key: "05_01",
        name: "PanchangaTable",
        active: ["current"],
        enabled: true,
        settings: { vargaNum: 1 },
      },
      {
        key: "05_02",
        name: "CaughadiaTable",
        active: ["current"],
        enabled: true,
        settings: { vargaNum: 1 },
      },
      {
        key: "05_03",
        name: "PanchaPaksi",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "05_04",
        name: "MuhurtaTable",
        active: ["current"],
        enabled: true,
        settings: { vargaNum: 1 },
      },
      {
        key: "05_05",
        name: "TransitionsTable",
        active: ["current"],
        enabled: true,
      },
    ],
  },
  {
    category: "06_varga",
    panes: ["current", "single", "paired"],
    widgets: [
      {
        key: "06_01",
        name: "SingleChart",
        mode: "single",
        vargaNum: 1,
        active: ["current", "single", "paired"],
        enabled: true,
        settings: { singleMode: 1 },
      },
      {
        key: "06_02",
        name: "SingleChart",
        mode: "single",
        vargaNum: 2,
        active: [],
        enabled: true,
      },
      {
        key: "06_03",
        name: "SingleChart",
        mode: "single",
        vargaNum: 3,
        active: [],
        enabled: true,
      },
      {
        key: "06_04",
        name: "SingleChart",
        mode: "single",
        vargaNum: 4,
        active: [],
        enabled: true,
      },
      {
        key: "06_05",
        name: "SingleChart",
        mode: "single",
        vargaNum: 5,
        active: [],
        enabled: true,
      },
      {
        key: "06_06",
        name: "SingleChart",
        mode: "single",
        vargaNum: 6,
        active: [],
        enabled: true,
      },
      {
        key: "06_07",
        name: "SingleChart",
        mode: "single",
        vargaNum: 7,
        active: [],
        enabled: true,
      },
      {
        key: "06_08",
        name: "SingleChart",
        mode: "single",
        vargaNum: 8,
        active: [],
        enabled: true,
      },
      {
        key: "06_09",
        name: "SingleChart",
        mode: "single",
        vargaNum: 9,
        active: [],
        enabled: true,
      },
      {
        key: "06_10",
        name: "SingleChart",
        mode: "single",
        vargaNum: 10,
        active: [],
        enabled: true,
      },
      {
        key: "06_11",
        name: "SingleChart",
        mode: "single",
        vargaNum: 11,
        active: [],
        enabled: true,
      },
      {
        key: "06_12",
        name: "SingleChart",
        mode: "single",
        vargaNum: 12,
        active: [],
        enabled: true,
      },
      {
        key: "06_16",
        name: "SingleChart",
        mode: "single",
        vargaNum: 16,
        active: [],
        enabled: true,
      },
      {
        key: "06_20",
        name: "SingleChart",
        mode: "single",
        vargaNum: 20,
        active: [],
        enabled: true,
      },
      {
        key: "06_24",
        name: "SingleChart",
        mode: "single",
        vargaNum: 24,
        active: [],
        enabled: true,
      },
      {
        key: "06_27",
        name: "SingleChart",
        mode: "single",
        vargaNum: 27,
        active: [],
        enabled: true,
      },
      {
        key: "06_30",
        name: "SingleChart",
        mode: "single",
        vargaNum: 30,
        active: [],
        enabled: true,
      },
      {
        key: "06_40",
        name: "SingleChart",
        mode: "single",
        vargaNum: 40,
        active: [],
        enabled: true,
      },
      {
        key: "06_45",
        name: "SingleChart",
        mode: "single",
        vargaNum: 45,
        active: [],
        enabled: true,
      },
      {
        key: "06_60",
        name: "SingleChart",
        mode: "single",
        vargaNum: 60,
        active: [],
        enabled: true,
      },
    ],
  },
  {
    category: "07_yoga",
    panes: ["single", "paired"],
    widgets: [
      {
        key: "07_01",
        name: "NabhashaYogas",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "07_02",
        name: "ActiveYogas",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "07_03",
        name: "TajikYogas",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "07_04",
        name: "WesternCelestialPatterns",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
    ],
  },
  {
    category: "08_dasha",
    panes: ["single", "paired"],
    widgets: [
      {
        key: "08_01",
        name: "DashaTree",
        dasha: 120,
        active: ["single", "paired"],
        enabled: true,
        settings: { vargaNum: 1 },
      },
      {
        key: "08_02",
        name: "DashaTree",
        dasha: 108,
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "08_03",
        name: "DashaTree",
        dasha: 116,
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "08_04",
        name: "DashaTree",
        dasha: 60,
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "08_05",
        name: "DashaTree",
        dasha: 112,
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "08_06",
        name: "DashaTree",
        dasha: 105,
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "08_07",
        name: "DashaTree",
        dasha: 100,
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "08_08",
        name: "DashaTree",
        dasha: 84,
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "08_09",
        name: "DashaTree",
        dasha: 72,
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "08_10",
        name: "DashaTree",
        dasha: 36,
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
    ],
  },
  {
    category: "09_other",
    panes: ["single", "paired"],
    widgets: [
      {
        key: "06_01_2",
        name: "SingleChart",
        title: "Double Chart",
        vargaNum: 1,
        mode: "double",
        active: ["paired"],
        enabled: true,
      },
      {
        key: "10_09",
        name: "SingleChart",
        mode: "midpoint_outer",
        active: ["paired"],
        enabled: true,
        settings: { vargaNum: 1 },
      },
      {
        key: "10_14",
        name: "GreekLotTable",
        title: "Greek Lots",
        active: ["single", "paired"],
        enabled: true,
        settings: { vargaNum: 1 },
      },
    ],
  },
  {
    category: "10_comp",
    panes: ["paired"],
    widgets: [
      {
        key: "10_01",
        name: "Kuta",
        active: ["paired"],
        enabled: true,
        settings: { vargaNum: 1 },
      },
      {
        key: "10_02",
        name: "Dasakuta",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "10_03",
        name: "Dvadasakita",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "10_04",
        name: "Mangalika",
        mode: "kuja_dosa",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "10_05",
        name: "Mangalika",
        mode: "extended",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "10_06",
        name: "Synastry",
        mode: "outer",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "10_07",
        name: "AspectTable",
        mode: "aspectarian",
        active: ["paired"],
        enabled: true,
        settings: { vargaNum: 1 },
      },
      {
        key: "10_08",
        name: "SynastryYogas",
        mode: "betweencharts",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "10_09",
        name: "CompositeChart",
        mode: "midpoint_outer",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "10_10",
        name: "CompositeChart",
        mode: "timespace_double_outer",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "10_11",
        name: "CompositeChart",
        mode: "timespace_outer",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "10_12",
        name: "CompositeChart",
        mode: "TimeSpace_double_outer",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
      {
        key: "10_13",
        name: "DashaLordSandhiWidget",
        active: [],
        enabled: false,
        settings: { vargaNum: 1 },
      },
    ],
  },
];

export default widgetDefaults;
