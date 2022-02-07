import { Chart } from "./models/Chart";
import { Graha } from "./models/Graha";
import rashiValues from "./mappings/rashi-values";
import induValues from "./mappings/indu-values";
import nakshatraValues from "./mappings/nakshatra-values";
import { AyanamshaItem } from "./interfaces";

const matchInduVal = (houseNum: number) => {
  const matchedGraha = rashiValues.find((r) => r.num === houseNum);
  let indu = {
    graha: "",
    value: 0,
    houseNum: 0,
  };
  if (matchedGraha) {
    const induRow = induValues.find((v) => v.graha === matchedGraha.ruler);
    if (induRow) {
      indu = { ...induRow, houseNum };
    }
  }
  return indu;
};

const degreeToSign = (deg: number) => Math.floor(deg / 30) + 1;

const addCycleInclusive = (one, two, radix) => {
  return ((one - 1 + two) % radix) + 1;
};

const subtractCycleInclusive = (one, two, radix) => {
  return ((one - 1 - two + radix) % radix) + 1;
};

const calcVarnadaLagna = (data: Map<string, any>, chart) => {
  const lagnaSign = degreeToSign(chart.lagna);
  const horaSign = degreeToSign(data.get("horaLagna"));
  const lagnaEven = lagnaSign % 2 === 0;
  const horaEven = horaSign % 2 === 0;
  const lagnaSign2 = lagnaEven ? 12 - lagnaSign + 1 : lagnaSign;
  const horaSign2 = horaEven ? 12 - horaSign + 1 : horaSign;
  const bothSame = lagnaEven === horaEven;
  const ascendantWithinDegree = chart.lagna % 30;
  const varnadaSignMultiplier = bothSame
    ? addCycleInclusive(horaSign2, lagnaSign2, 12)
    : subtractCycleInclusive(lagnaSign2, horaSign2, 12);
  return (varnadaSignMultiplier - 1) * 30 + ascendantWithinDegree;
};

export const matchNakshatra = (deg: number) => {
  let row = { index: -1, num: 0, percent: 0, ruler: "" };
  const naks = nakshatraValues.filter((nk) => nk.key !== "n28_22");
  const nkVal = deg / (360 / naks.length);
  const index = Math.floor(nkVal);
  const percent = (nkVal % 1) * 100;
  if (index < naks.length) {
    const nkRow = naks[index];
    if (nkRow) {
      row = { index, num: index + 1, percent, ...nkRow };
    }
  }
  return row;
};

const relativeAngle = (sunLng: number, moonLng: number, multiplier = 1) => {
  const mn = ((moonLng - sunLng) * multiplier) % 360;
  return mn < 0 ? 360 + mn : mn;
};

const matchBodyLng = (key: string, bodies: Array<Graha>, retVal = -1) => {
  const graha = bodies.find((b) => b.key === key);
  if (graha) {
    return graha.longitude;
  }
  return retVal;
};

const matchTithiNum = (bodies: Array<Graha>, multiplier = 1) => {
  const sunMoonAngle = relativeAngle(
    matchBodyLng("su", bodies, 0),
    matchBodyLng("mo", bodies, 0),
    multiplier
  );
  const tithiVal = sunMoonAngle / (360 / 30);
  return Math.floor(tithiVal) + 1;
};

export const calcSphutaData = (
  chart: Chart,
  ayanamshaItem: AyanamshaItem,
  vargaNum = 1
) => {
  const bodies: Array<Graha> = [...chart.bodies, chart.ascendantGraha];
  bodies.forEach((b) => {
    b.setAyanamshaItem(ayanamshaItem);
    b.setVarga(vargaNum);
  });
  const data: Map<string, any> = new Map();

  data.set("houseSign", Math.floor(chart.lagna / 30) + 1);

  const moon = bodies.find((b) => b.key === "mo");
  const sun = bodies.find((b) => b.key === "su");
  const rahu = bodies.find((b) => b.key === "ra");
  const sriLagna =
    ((moon.nakshatra.percent / 100) * 360 + chart.ascendant) % 360;
  data.set("sriLagna", sriLagna);

  const houseSignPlusNine = ((data.get("houseSign") - 1 + (9 - 1)) % 12) + 1;
  const lagnaInduRow = matchInduVal(houseSignPlusNine);

  const moonSignPlusNine = ((moon.sign - 1 + (9 - 1)) % 12) + 1;

  const moonInduRow = matchInduVal(moonSignPlusNine);

  const induLagnaSign =
    ((lagnaInduRow.value + moonInduRow.value + moon.sign) % 12) - 1;
  const induLagna = ((induLagnaSign - 1) * 30 + moon.withinSign + 360) % 360;
  data.set("induLagna", induLagna);
  const sunLngAtSunRise = chart
    .getSphutaValues(0)
    .find((sp) => sp.key === "sunLngAtSunRise");

  if (sunLngAtSunRise) {
    const sunAtSunRise = chart.buildGraha("su", sunLngAtSunRise.value, 0);
    sunAtSunRise.setAyanamshaItem(ayanamshaItem);
    sunAtSunRise.setVarga(vargaNum);
    const ghatiLagna = (chart.ghatiVal * 30 + sunAtSunRise.longitude) % 360;
    data.set("ghatiLagna", ghatiLagna);

    const bhava = chart.ghatiVal / 5;

    data.set("bhavaLagna", (sunAtSunRise.longitude + bhava * 30) % 360);
    //data.ghatiAsDegree = indianTimeData.ghatiVal * 6;

    data.set(
      "horaLagna",
      (sunAtSunRise.longitude + chart.progress * 720) % 360
    );
  }

  data.set("varnadaLagna", calcVarnadaLagna(data, chart));

  const yogiSphuta = chart.calcYogiSphuta();
  data.set("yogiSphuta", yogiSphuta);

  const yogiSphutaNk = matchNakshatra(yogiSphuta);
  data.set("yogi", yogiSphutaNk.ruler);
  const avayogiSphuta = (yogiSphuta + 560 / 3) % 360;
  data.set("avayogiSphuta", avayogiSphuta);

  const avayogiSphutaNk = matchNakshatra(avayogiSphuta);
  data.set("avayogi", avayogiSphutaNk.ruler);
  data.set("bijaSphuta", chart.calcBijaSphuta());
  data.set("ksetraSphuta", chart.calcKsetraSphuta());
  // The tithi of result of = ceiling(mod(mod((Moon's degree-Sun's degree)*5,360)/12,15),1)

  data.set("santanaTithi", matchTithiNum(bodies, 5));

  // prāṅasphuta    -> my chart= 156.55     -> formula= ((Lagna's degree x 5)+Gulika's degree) / mod 360
  const gulika = chart.upagrahas.find((row) => row.key === "gu");
  data.set("pranaSphuta", (chart.lagna * 5 + gulika.value) % 360);

  // formula= ((Moon's degree x 8)+Gulika's degree) / mod 360
  //
  data.set("dehaSphuta", (moon.longitude * 8 + gulika.value) % 360);

  const mrtuSphuta = (gulika.value * 7 + sun.longitude) % 360;
  data.set("mrtuSphuta", mrtuSphuta);

  // trisphuta      -> my chart= 178.52     -> formula= Prāṅasphuta + Dehasphuta + Mṛtusphuta / mod 360
  const triSphuta = (chart.lagna + moon.longitude + gulika.value) % 360;
  data.set("triSphuta", triSphuta);

  // catusphuta     -> my chart= 251.73     -> formula= Trisphuta + Sun's degree / mod 360
  const catuSphuta = (triSphuta + sun.longitude) % 360;
  data.set("catuSphuta", catuSphuta);

  // pañcasphuta    -> my chart= 18.35      -> formula= Catusphuta + Rahu's degree / mod 360
  const pancaSphuta = (catuSphuta + rahu.longitude) % 360;
  data.set("pancaSphuta", pancaSphuta);

  // bṛghu bindu    -> my chart= 189.5      -> formula= Version1=(Moon degree+Rahu degree) / 2, counting from Rahu --- Version2=(Moon degree+Rahu degree) / 2 (shortest distance) less 180
  const brghuBindu = ((moon.longitude + rahu.longitude) / 2) % 360;
  data.set("brghuBindu", brghuBindu);

  const keys = [
    "sriLagna",
    "induLagna",
    "ghatiLagna",
    "bhavaLagna",
    "horaLagna",
    "varnadaLagna",
    "yogiSphuta",
    "yogi",
    "avayogiSphuta",
    "avayogi",
    "bijaSphuta",
    "ksetraSphuta",
    "pranaSphuta",
    "dehaSphuta",
    "mrtuSphuta",
    "triSphuta",
    "catuSphuta",
    "pancaSphuta",
    "brghuBindu",
  ];
  return keys.map((key) => {
    const value = data.get(key);
    return { key, value };
  });
};
