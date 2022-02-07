import { smartCastFloat } from "./converters";
import {
  calcInclusiveNakshatras,
  calcInclusiveTwelfths,
  inclusiveCount,
  matchLord,
  matchNaturalGrahaMaitri,
  matchNaturalMaitri,
  matchRelations,
} from "./helpers";
import {
  DictMatch,
  KutaScoreMatch,
  RangeMatchProtocol,
  SignMatchProtocol,
  VashyaDegreeRange,
} from "./interfaces";
import { KutaGrahaItem } from "./models/KutaGrahaItem";
import { KutaValueSet } from "./models/KutaValueSet";
import { Dictionary } from "./models/Lexeme";
import { inRange, isNumeric, notEmptyString } from "./validators";

/**
 * Auxiliary builder class instantiated Kuta.vue and KutaBarChart.vue
 * Requires a dictionary object, a compatibilitySet Map with all options
 * and an itemOptions map
 */
export class KutaBuilder {
  private dictionary = new Dictionary([]);

  private compatabilitySet: Map<string, any> = new Map();

  private itemOptions: Map<string, string> = new Map();

  constructor(
    dict = null,
    compatabilitySet: Map<string, any> = new Map(),
    itemOptions: Map<string, string> = new Map()
  ) {
    if (dict instanceof Dictionary) {
      this.dictionary = dict;
    }
    if (compatabilitySet instanceof Map && compatabilitySet.size > 0) {
      this.compatabilitySet = compatabilitySet;
    }
    if (itemOptions instanceof Map && itemOptions.size > 0) {
      this.itemOptions = itemOptions;
    }
  }

  calcItem(key: string, dataSets: Array<KutaGrahaItem>): KutaValueSet {
    const result = new KutaValueSet({ key });
    if (this.compatabilitySet.has(key) && dataSets.length > 1) {
      const settings = this.compatabilitySet.get(key);
      if (settings instanceof Object) {
        const femaleIndex = dataSets.findIndex((ds) => ds.gender === "f");
        const maleIndex = dataSets.findIndex((ds) => ds.gender === "m");
        const hasFemale = femaleIndex >= 0;
        const femaleFirst = hasFemale && femaleIndex < maleIndex;
        const numSuffix = /_\d+$/.test(key)
          ? parseInt(key.split("_").pop(), 10)
          : 0;
        if (settings.matchType) {
          switch (key) {
            case "varna":
              this._calcVarna(settings, result, dataSets, femaleFirst);
              break;
            case "rashi":
              this._calcRashi(settings, result, dataSets);
              break;
            case "vashya":
              this._calcVashya(settings, result, dataSets, femaleFirst);
              break;
            case "grahamaitri":
              this._calcGrahamaitri(settings, result, dataSets);
              break;
            case "tara":
              this._calcTara(settings, result, dataSets);
              break;
            case "nadi":
              this._calcNadi(settings, result, dataSets);
              break;
            case "yoni":
              this._calcYoni(settings, result, dataSets);
              break;
            case "gana":
              this._calcGana(settings, result, dataSets);
              break;
            case "mahendra":
              this._calcMahendra(settings, result, dataSets, femaleFirst);
              break;
            case "vedha":
              this._calcVedha(settings, result, dataSets);
              break;
            case "rajju":
              this._calcRajju(settings, result, dataSets);
              break;
            case "stri":
              this._calcStri(settings, result, dataSets, femaleFirst);
              break;
            case "vainashika":
              this._calcVainashika(settings, result, dataSets, femaleFirst);
              break;
            case "yonyanukulya":
              this._calcYonyanukulya(settings, result, dataSets, femaleFirst);
              break;
            case "vihanga":
              this._calcVihanga(settings, result, dataSets);
              break;
            case "gotra":
              this._calcGotra(settings, result, dataSets);
              break;
            case "bhuta_nakshatras":
            case "bhuta_rashis":
              this._calcBhutaVariant(settings, result, dataSets);
              break;
            case "rnadhana_1":
            case "rnadhana_2":
            case "rnadhana_3":
              this._calcRnadhana(settings, result, dataSets);
              break;
            case "ayavyaya":
              this._calcAyavyaya(settings, result, dataSets, femaleFirst);
              break;
          }
        }
        if (result.max < 1) {
          result.max = settings.max;
        }
      }
    }
    return result;
  }

  _calcVarna(
    settings: any,
    result: KutaValueSet,
    dataSets: Array<KutaGrahaItem>,
    femaleFirst = true
  ) {
    const key = "varna";
    let score = 0;
    const [s1, s2] = dataSets;
    const female = femaleFirst ? s1 : s2;
    const male = femaleFirst ? s2 : s1;
    const femaleVal = settings.signs.find((sn) => sn.sign === female.rashi.num);
    const scoreSet = settings.score.find((sc) => sc.brideNum === femaleVal.num);
    const maleVal = settings.signs.find((sn) => sn.sign === male.rashi.num);
    const maleScoreIndex = maleVal.num - 1;
    score = scoreSet.groomScores[maleScoreIndex];
    const s1Num = femaleFirst ? femaleVal.num : maleVal.num;
    const s2Num = femaleFirst ? maleVal.num : femaleVal.num;
    result.c1Value = this.dictName(key, s1Num);
    result.c2Value = this.dictName(key, s2Num);
    result.score = score;
  }

  _calcRashi(
    settings: any,
    result: KutaValueSet,
    dataSets: Array<KutaGrahaItem>
  ) {
    const { signDifferences } = settings;
    const [s1, s2] = dataSets;
    const diffOneIndex = calcInclusiveTwelfths(s1.rashi.num, s2.rashi.num) - 1;
    const diffTwoIndex = calcInclusiveTwelfths(s2.rashi.num, s1.rashi.num) - 1;
    const score1 = signDifferences[diffOneIndex];
    const score2 = signDifferences[diffTwoIndex];
    result.c1Value = ["sign", s1.rashi.num, score1].join("/");
    result.c2Value = ["sign", s2.rashi.num, score2].join("/");
    result.score = (score1 + score2) / 2;
  }

  _calcTara(
    settings: any,
    result: KutaValueSet,
    dataSets: Array<KutaGrahaItem>
  ) {
    const [s1, s2] = dataSets;
    const taraValOne = calcInclusiveNakshatras(
      s1.nakshatraNum,
      s2.nakshatraNum
    );
    const taraValTwo = calcInclusiveNakshatras(
      s2.nakshatraNum,
      s1.nakshatraNum
    );
    const numTaras = 9;
    const taraMod1 = taraValOne % numTaras;
    const taraMod2 = taraValTwo % numTaras;
    const taraNum1 = taraMod1 === 0 ? numTaras : taraMod1;
    const taraNum2 = taraMod2 === 0 ? numTaras : taraMod2;
    const taraIndex1 = taraNum1 - 1;
    const taraIndex2 = taraNum2 - 1;
    const { scores } = settings;
    result.c1Value = this.dictName("tara", taraNum1);
    result.c2Value = this.dictName("tara", taraNum2);
    if (scores instanceof Array && scores.length > 8) {
      result.score = scores[taraIndex1] + scores[taraIndex2];
    }
  }

  _calcNadi(
    settings: any,
    result: KutaValueSet,
    dataSets: Array<KutaGrahaItem>
  ) {
    const [s1, s2] = dataSets;
    const { values, groups, calc } = settings;
    if (
      values instanceof Array &&
      values.length > 26 &&
      groups instanceof Array
    ) {
      const nadiOne = values[s1.nakshatraNum - 1];
      const nadiTwo = values[s2.nakshatraNum - 1];
      result.c1Value = this.dictName("nadi", [1, nadiOne].join("_"));
      result.c2Value = this.dictName("nadi", [1, nadiTwo].join("_"));
      const same = nadiOne === nadiTwo;
      const comparisonType = same ? "same" : "different";
      if (calc instanceof Array && calc.length > 0) {
        const calcItem = calc
          .filter((row) => row instanceof Object)
          .find(
            (row) =>
              row.mode === "value" &&
              row.action === "score" &&
              row.compare === comparisonType
          );
        if (calcItem) {
          result.score = calcItem.score;
        }
      }
    }
  }

  _calcYoni(
    settings: any,
    result: KutaValueSet,
    dataSets: Array<KutaGrahaItem>
  ) {
    const { nakshatraMatches, matchScores, calc } = settings;
    if (
      nakshatraMatches instanceof Array &&
      matchScores instanceof Object &&
      calc instanceof Array
    ) {
      const [s1, s2] = dataSets;
      let score = 0;
      if (
        s1.nakshatraIndex < nakshatraMatches.length &&
        s2.nakshatraIndex < nakshatraMatches.length &&
        s2.nakshatraIndex >= 0
      ) {
        const yoniOne = nakshatraMatches[s1.nakshatraIndex];
        const yoniTwo = nakshatraMatches[s2.nakshatraIndex];
        const yoniIndex1 = yoniOne.yoni - 1;
        const yoniIndex2 = yoniTwo.yoni - 1;
        const defProtocol = this.itemOptions.get("yoni");
        const scoreSet = matchScores[defProtocol];
        if (
          scoreSet instanceof Array &&
          yoniIndex1 < 14 &&
          yoniIndex2 < 14 &&
          yoniIndex1 >= 0 &&
          yoniIndex2 >= 0 &&
          scoreSet.length > 13
        ) {
          score = scoreSet[yoniIndex1][yoniIndex2];
          const matchesGender1 = s1.gender === yoniOne.gender;
          const matchesGender2 = s2.gender === yoniTwo.gender;
          if (s1.gender !== s2.gender) {
            const femaleMatches =
              s1.gender === "f" ? matchesGender1 : matchesGender2;
            const maleMatches =
              s1.gender === "m" ? matchesGender1 : matchesGender2;
            const matchCondition = {
              f: maleMatches,
              m: femaleMatches,
            };
            const calcItem = calc.find((ci) =>
              ci.matches.some(
                (m) => m.f === matchCondition.f && m.m === matchCondition.m
              )
            );
            if (calcItem) {
              if (calcItem.action === "add") {
                score += calcItem.add;
              }
            }
          }
        }
        result.c1Value = this.dictName("yoni", yoniOne.yoni);
        result.c2Value = this.dictName("yoni", yoniTwo.yoni);
        result.score = score;
      }
    }
  }

  _calcGana(
    settings: any,
    result: KutaValueSet,
    dataSets: Array<KutaGrahaItem>
  ) {
    const { nakshatraMatches, matchScores, calc } = settings;
    if (
      nakshatraMatches instanceof Array &&
      matchScores instanceof Object &&
      calc instanceof Array
    ) {
      const [s1, s2] = dataSets;
      let score = 0;
      if (s1.nakshatraIndex < nakshatraMatches.length) {
        const ganaOne = nakshatraMatches[s1.nakshatraIndex];
        const ganaTwo = nakshatraMatches[s2.nakshatraIndex];
        const ganaIndex1 = ganaOne - 1;
        const ganaIndex2 = ganaTwo - 1;
        const protocolKey = this.itemOptions.get("gana");
        const scoreKeys = Object.keys(matchScores);
        if (protocolKey && scoreKeys.includes(protocolKey)) {
          const scoreSet = matchScores[protocolKey];
          if (
            ganaIndex1 < 3 &&
            ganaIndex2 < 3 &&
            ganaIndex1 >= 0 &&
            ganaIndex2 >= 0 &&
            scoreSet.length > 2
          ) {
            score = scoreSet[ganaIndex1][ganaIndex2];
            if (s1.gender !== s2.gender) {
              const femaleGana = s1.gender === "f" ? ganaOne : ganaTwo;
              const maleGana = s1.gender === "m" ? ganaOne : ganaTwo;
              const calcItem = calc.find(
                (ci) => ci.f === femaleGana && ci.m === maleGana
              );
              if (calcItem) {
                if (calcItem.action === "add") {
                  score += calcItem.add;
                }
              }
            }
          }
        }
        result.c1Value = this.dictName("gana", ganaOne);
        result.c2Value = this.dictName("gana", ganaTwo);
        result.score = score;
      }
    }
  }

  _calcBhutaVariant(
    settings: any,
    result: KutaValueSet,
    dataSets: Array<KutaGrahaItem>
  ) {
    const { matches, scores, matchType } = settings;
    const [s1, s2] = dataSets;
    const useSign = ["sign", "signs"].includes(matchType);
    const index1 = useSign ? s1.signIndex : s1.nakshatraIndex;
    const index2 = useSign ? s2.signIndex : s2.nakshatraIndex;
    let score = 0;
    if (index1 < matches.length && index2 < matches.length && index2 >= 0) {
      const matchIndex1 = matches[index1] - 1;
      const matchIndex2 = matches[index2] - 1;
      const scoreRow = matchIndex1 < scores.length ? scores[matchIndex1] : null;
      if (scoreRow instanceof Object) {
        result.c1Value = this.dictName(scoreRow.element, null, "bhuta");
        score = scoreRow.values[matchIndex2];
        const scoreRow2 =
          matchIndex2 < scores.length ? scores[matchIndex2] : null;
        if (scoreRow2 instanceof Object) {
          result.c2Value = this.dictName(scoreRow2.element, null, "bhuta");
        }
      }
    }
    result.score = score;
  }

  _calcRnadhana(
    settings: any,
    result: KutaValueSet,
    dataSets: Array<KutaGrahaItem>
  ) {
    result.score = 0;
    const { calcType, formula, matches, scores } = settings;
    const [s1, s2] = dataSets;
    result.c1Value = s1.nakshatra.label;
    result.c2Value = s2.nakshatra.label;
    if (calcType === "difference") {
      const distance = calcInclusiveNakshatras(
        s1.nakshatraNum,
        s2.nakshatraNum
      );
      if (formula) {
        const expr = formula.replace(/\b(difference|distance)\b/, distance);
        const scoreIndex = eval(expr);
        result.score = scoreIndex < scores.length ? scores[scoreIndex] : 0;
      }
    } else if (calcType === "same_group" && matches instanceof Array) {
      const g1 = matches[s1.nakshatraIndex];
      const g2 = matches[s2.nakshatraIndex];
      const sameGroup = g1 === g2 && [1, 2, 3].includes(g1);
      const scoreOption = sameGroup ? g1 : 4;
      const scoreRow = scores.find((sr) => sr.option === scoreOption);
      if (scoreRow) {
        result.score = scoreRow.value;
      }
    }
  }

  _calcAyavyaya(
    settings: any,
    result: KutaValueSet,
    dataSets: Array<KutaGrahaItem>,
    femaleFirst = false
  ) {
    const [s1, s2] = dataSets;
    const female = femaleFirst ? s1 : s2;
    const male = femaleFirst ? s2 : s1;
    const incCountAya = inclusiveCount(
      female.nakshatraNum,
      male.nakshatraNum,
      27
    );
    const aya = ((incCountAya * 5) % 7) + 1;
    result.c1Value = s1.nakshatra.label;
    const incCountVyaya = inclusiveCount(
      male.nakshatraNum,
      female.nakshatraNum,
      27
    );
    const vyaya = ((incCountVyaya * 5) % 7) + 1;
    result.c2Value = s2.nakshatra.label;
    const diff = vyaya - aya;
    const { scores } = settings;
    let matchedRow = scores.find((sr) => sr.condition === "equal");
    let isEqual = false;
    if (matchedRow) {
      const maxDiff = smartCastFloat(matchedRow.tolerance);
      isEqual = Math.abs(diff) <= maxDiff;
      if (isEqual) {
        result.score = matchedRow.value;
      }
    }
    if (!isEqual) {
      const matchedCondition = diff > 0 ? "vyaya_greater" : "aya_greater";
      matchedRow = scores.find((sr) => sr.condition === matchedCondition);
      if (matchedRow) {
        result.score = matchedRow.value;
      }
    }
  }

  _applyVashyaDefouwScore(
    protocol: SignMatchProtocol,
    signIndex: number,
    otherSignNum: number,
    isFemale: boolean
  ) {
    const { signMatches, scores } = protocol;
    let score = 0;
    const signRow = signMatches[signIndex];

    if (signRow instanceof Array) {
      const hasScore = signRow.includes(otherSignNum);
      if (hasScore) {
        score = isFemale ? scores.fm : scores.mf;
      }
    }
    return score;
  }

  _applyClassicVashyaRangeMatch(
    protocol: RangeMatchProtocol,
    subject: KutaGrahaItem
  ): VashyaDegreeRange {
    return protocol.ranges.find((dr) => {
      let valid = false;
      if (dr.degreeRange instanceof Array) {
        const [min, max] = dr.degreeRange;
        valid = subject.lng >= min && subject.lng < max;
      }
      return valid;
    });
  }

  _calcVashya(
    settings: any,
    result: KutaValueSet,
    dataSets: Array<KutaGrahaItem>,
    femaleFirst
  ) {
    let score = 0;
    const { signMatches } = settings;
    const [s1, s2] = dataSets;
    const signIndex1 = s1.rashi.num - 1;
    const signIndex2 = s2.rashi.num - 1;
    let defProtocol = this.itemOptions.get("vashya");
    if (!defProtocol) {
      defProtocol = "classical__one";
    }
    let vashya1 = 0;
    let vashya2 = 0;
    const [protocolKey, protocolSubKey] = defProtocol.split("__");
    if (signMatches instanceof Object) {
      const protocols = Object.keys(signMatches);
      if (protocols.includes(protocolKey)) {
        const protocol = signMatches[protocolKey];
        const { matchType, max } = protocol;
        if (max) {
          result.max = max;
        }
        if (matchType === "signMatches") {
          score = this._applyVashyaDefouwScore(
            protocol,
            signIndex1,
            s2.rashi.num,
            femaleFirst
          );
          const score2 = this._applyVashyaDefouwScore(
            protocol,
            signIndex2,
            s1.rashi.num,
            !femaleFirst
          );
          // Divide by 2 if vashya is matched both ways
          if (score > 0 && score2 > 0) {
            score = (score + score2) / 2;
          } else if (score2 > 0) {
            score += score2;
          }
        } else if (matchType === "degreeRange") {
          const female = femaleFirst ? s1 : s2;
          const male = femaleFirst ? s2 : s1;
          const v1 = this._applyClassicVashyaRangeMatch(protocol, female);
          const v2 = this._applyClassicVashyaRangeMatch(protocol, male);
          if (protocol.score instanceof Object) {
            const scoreRows = protocol.score[protocolSubKey];
            const vashyaIndex1 = v1.vashya - 1;
            const vashyaIndex2 = v2.vashya - 1;
            vashya1 = femaleFirst ? v1.vashya : v2.vashya;
            vashya2 = femaleFirst ? v2.vashya : v1.vashya;
            if (vashyaIndex1 < scoreRows.length) {
              score = scoreRows[vashyaIndex1][vashyaIndex2];
            }
          }
        }
        if (protocolKey === "defouw") {
          result.c1Value = ["sign", s1.rashi.num, score].join("/");
          result.c2Value = ["sign", s2.rashi.num, score].join("/");
        } else {
          result.c1Value = this.dictName("vashya", vashya1);
          result.c2Value = this.dictName("vashya", vashya2);
        }
        result.score = score;
      }
    }
  }

  _calcGrahamaitri(
    settings: any,
    result: KutaValueSet,
    dataSets: Array<KutaGrahaItem>,
    femaleFirst = true
  ) {
    const [s1, s2] = dataSets;
    const [rel1, rel2] = matchNaturalGrahaMaitri(s1, s2);
    const protocolKey = this.itemOptions.get("grahamaitri");
    const { variants } = settings;
    const variantKeys = Object.keys(settings);
    if (protocolKey && variantKeys.includes(protocolKey)) {
      const femaleRel = femaleFirst ? rel1 : rel2;
      const maleRel = femaleFirst ? rel2 : rel1;
      const relMatch = { f: femaleRel, m: maleRel };
      const scores = settings[protocolKey];
      if (scores instanceof Array) {
        const scoreItem = scores.find(
          (sc) => sc.f === relMatch.f && sc.m === relMatch.m
        );
        if (scoreItem) {
          const { dignities } = settings.dictionary;
          result.c1Value = this.diginityName(dignities, rel1);
          result.c2Value = this.diginityName(dignities, rel2);
          result.score = scoreItem.score;
        }
      }
    }
  }

  _calcMahendra(
    settings: any,
    result: KutaValueSet,
    dataSets: Array<KutaGrahaItem>,
    femaleFirst = true
  ) {
    const [s1, s2] = dataSets;
    const female = femaleFirst ? s1 : s2;
    const male = femaleFirst ? s2 : s1;
    const { fmMatches } = settings;
    if (fmMatches instanceof Array) {
      if (fmMatches.length > 26 && female.nakshatraIndex < fmMatches.length) {
        const matchedRow = fmMatches[female.nakshatraIndex];
        const hasMatch = matchedRow.includes(male.nakshatraNum);
        result.c1Value = s1.nakshatra.label;
        result.c2Value = s2.nakshatra.label;
        if (hasMatch) {
          const protocolKey = this.itemOptions.get("mahendra");
          if (notEmptyString(protocolKey)) {
            const keys = Object.keys(settings);
            if (
              keys.includes(protocolKey) &&
              settings[protocolKey] instanceof Object
            ) {
              const { score, max } = settings[protocolKey];
              if (score) {
                result.score = score.match;
                result.max = max;
              }
            }
          }
        }
      }
    }
  }

  _calcVedhaSubScore(score: KutaScoreMatch, matchIndex = 0, nakshatraNum = 0) {
    let scoreVal = 0;
    const { match, standard, overrides } = score;
    if (matchIndex >= 0) {
      scoreVal = match;
      if (overrides instanceof Array) {
        const override = overrides.find(
          (ov) => ov.num === nakshatraNum && matchIndex === ov.index
        );
        if (override) {
          scoreVal = override.score;
        }
      }
    } else {
      scoreVal = standard;
    }
    return scoreVal;
  }

  _calcVedha(
    settings: any,
    result: KutaValueSet,
    dataSets: Array<KutaGrahaItem>
  ) {
    const [s1, s2] = dataSets;
    const { matches } = settings;
    if (matches instanceof Array) {
      if (
        matches.length > 26 &&
        s1.nakshatraIndex < matches.length &&
        s2.nakshatraIndex < matches.length &&
        s2.nakshatraIndex >= 0
      ) {
        const matchedRow1 = matches[s1.nakshatraIndex];
        const matchIndex1 = matchedRow1.indexOf(s2.nakshatraNum);
        const matchedRow2 = matches[s2.nakshatraIndex];
        const matchIndex2 = matchedRow2.indexOf(s1.nakshatraNum);
        const protocolKey = this.itemOptions.get("vedha");

        result.c1Value = s1.nakshatra.label;
        result.c2Value = s2.nakshatra.label;

        if (notEmptyString(protocolKey)) {
          const keys = Object.keys(settings);
          if (
            keys.includes(protocolKey) &&
            settings[protocolKey] instanceof Object
          ) {
            const { score, max } = settings[protocolKey];
            if (score) {
              let scoreVal = this._calcVedhaSubScore(
                score,
                matchIndex1,
                s1.nakshatraNum
              );
              scoreVal += this._calcVedhaSubScore(
                score,
                matchIndex2,
                s2.nakshatraNum
              );
              result.score = scoreVal / 2;
              result.max = max;
            }
          }
        }
      }
    }
  }

  _calcRajju(
    settings: any,
    result: KutaValueSet,
    dataSets: Array<KutaGrahaItem>
  ) {
    const [s1, s2] = dataSets;
    const { values } = settings;
    let itemScore = 0;
    if (values instanceof Array) {
      if (values.length > 26 && s1.nakshatraIndex < values.length) {
        const matchedRow1 = values[s1.nakshatraIndex];
        const matchedRow2 = values[s2.nakshatraIndex];
        if (matchedRow1 && matchedRow2 instanceof Object) {
          const body1 = matchedRow1.match;
          const dir1 = matchedRow1.dir;
          const body2 = matchedRow2.match;
          const dir2 = matchedRow2.dir;
          const dirLabel = (dir) => (dir === 1 ? "▲" : dir === -1 ? "▼" : "●");
          result.c1Value = this.dictName("rajju", body1) + " " + dirLabel(dir1);
          result.c2Value = this.dictName("rajju", body2) + " " + dirLabel(dir2);
          const sameBody = body1 === body2;
          const sameDir = dir1 === dir2;
          const bothUp = dir1 === 1 && dir2 === 1;
          const bothDown = dir1 === -1 && dir2 === -1;
          const oppositeDir =
            dir1 !== dir2 && [dir1, dir2].includes(0) === false;
          const protocolKey = this.itemOptions.get("rajju");
          const keys = Object.keys(settings);
          if (keys.includes(protocolKey)) {
            if (settings[protocolKey] instanceof Object) {
              const { scores, calc, max } = settings[protocolKey];
              if (max) {
                result.max = max;
              }
              if (scores instanceof Array) {
                const scoreRow = scores.find((sc) => {
                  const scKeys = Object.keys(sc);
                  let validRule = false;
                  const hasRuleSet = scKeys.includes("rule");
                  if (hasRuleSet) {
                    validRule = Object.entries(sc.rule).every((entry) => {
                      const [k, v] = entry;
                      switch (k) {
                        case "bodyRel":
                          return (
                            (v === "same" && sameBody) ||
                            (v === "different" && !sameBody)
                          );
                        case "eitherBody":
                          return body1 === v || body2 === v;
                        case "otherBodyRel":
                          return (
                            (sameBody && v === "same") ||
                            (!sameBody && v === "different") ||
                            v === "any"
                          );
                        case "dir":
                          return dir1 === v && dir2 === v;
                        case "dirRel":
                          return (
                            (oppositeDir && v === "opposite") ||
                            (sameDir && v === "same") ||
                            (bothUp && v === "bothUp") ||
                            (bothDown && v === "bothDown")
                          );
                      }
                    });
                  }
                  return validRule;
                });
                if (scoreRow) {
                  itemScore = scoreRow.score;
                }
                if (calc instanceof Array) {
                  const ruler1 = matchLord(s1);
                  const ruler2 = matchLord(s2);
                  const sameRulers = ruler1 === ruler2;
                  const signRulersRel1 = matchNaturalMaitri(ruler1, ruler2);
                  const signRulersRel2 = matchNaturalMaitri(ruler2, ruler1);
                  const pointSignAspect = calcInclusiveTwelfths(
                    s1.sign,
                    s2.sign
                  );
                  const matchedRule = calc.find((cc) => {
                    let valid = false;
                    if (cc instanceof Object) {
                      const { rule } = cc;
                      if (rule instanceof Object) {
                        valid = Object.entries(rule).every((entry) => {
                          const [k, v] = entry;
                          switch (k) {
                            case "bodyRel":
                              return v === "same" && sameBody;
                            case "signRulers":
                              return v === "same" && sameRulers;
                            case "dirRel":
                              return v === "opposite" && oppositeDir;
                            case "signRulersRelations":
                              return matchRelations(
                                signRulersRel1,
                                signRulersRel2,
                                v as string
                              );
                            case "pointSignAspect":
                              return pointSignAspect === 7;
                          }
                        });
                      }
                    }
                    return valid;
                  });
                  if (matchedRule) {
                    const { add } = matchedRule;
                    if (isNumeric(add)) {
                      itemScore += add;
                    }
                  }
                }
                result.score = itemScore;
              }
            }
          }
        }
      }
    }
  }

  _calcStri(
    settings: any,
    result: KutaValueSet,
    dataSets: Array<KutaGrahaItem>,
    femaleFirst = true
  ) {
    const [s1, s2] = dataSets;
    const [female, male] = femaleFirst ? [s1, s2] : [s2, s1];
    const protocolKey = this.itemOptions.get("stri");
    const keys = Object.keys(settings);
    const nakDiff = calcInclusiveNakshatras(
      female.nakshatraNum,
      male.nakshatraNum
    );
    let itemScore = 0;
    if (keys.includes(protocolKey)) {
      if (settings[protocolKey] instanceof Object) {
        const { scores, max, sameNakshatra, mfPada } = settings[protocolKey];
        result.max = max;
        if (scores instanceof Array && scores.length > 0) {
          const scoreRow = scores.find((sc) => inRange(nakDiff, sc.diffRange));
          if (scoreRow) {
            itemScore = scoreRow.score;
          }
        }
        if (
          nakDiff === 1 &&
          sameNakshatra instanceof Array &&
          sameNakshatra.length > 0
        ) {
          const snRow = sameNakshatra.find((sc) =>
            sc.nums.includes(female.nakshatraNum)
          );
          if (snRow) {
            itemScore += snRow.add;
          }
        }
        if (nakDiff === 1 && mfPada instanceof Array && mfPada.length > 0) {
          const padaDiff = female.nakshatra.pada - male.nakshatra.pada;
          const pdRow = mfPada.find((pd) => pd.diff === padaDiff);
          if (pdRow) {
            itemScore += pdRow.add;
          }
        }
      }
    }
    result.c1Value = s1.nakshatra.label;
    result.c2Value = s2.nakshatra.label;
    result.score = itemScore;
  }

  _calcGotra(
    settings: any,
    result: KutaValueSet,
    dataSets: Array<KutaGrahaItem>
  ) {
    const { matches, scores } = settings;
    if (matches instanceof Array && scores instanceof Array) {
      const [s1, s2] = dataSets;
      const nak28Index1 = s1.nakshatra28Num - 1;
      const nak28Index2 = s2.nakshatra28Num - 1;
      const gotraNum1 = matches[nak28Index1];
      const gotraNum2 = matches[nak28Index2];
      const sameGotra = gotraNum1 === gotraNum2;
      const scoreRow = scores.find(
        (sc) =>
          (sameGotra && sc.gotra === "same") ||
          (!sameGotra && sc.gotra === "different")
      );
      result.c1Value = this.dictName("gotra", gotraNum1);
      result.c2Value = this.dictName("gotra", gotraNum2);
      if (scoreRow) {
        result.score = scoreRow.score;
      }
    }
  }

  _calcVainashika(
    settings: any,
    result: KutaValueSet,
    dataSets: Array<KutaGrahaItem>,
    femaleFirst
  ) {
    const { matches, scores } = settings;
    if (matches instanceof Array && scores instanceof Array) {
      const [s1, s2] = dataSets;
      const female = femaleFirst ? s1 : s2;
      const male = femaleFirst ? s2 : s1;
      const hasMatch =
        matches.filter(
          (mr) => mr.f === female.nakshatraNum && mr.m === male.nakshatraNum
        ).length > 0;
      const scoreRow = scores.find((sc) => hasMatch === sc.match);
      result.c1Value = s1.nakshatra.label;
      result.c2Value = s2.nakshatra.label;
      if (scoreRow) {
        result.score = scoreRow.score;
      }
    }
  }

  _calcYonyanukulya(
    settings: any,
    result: KutaValueSet,
    dataSets: Array<KutaGrahaItem>,
    femaleFirst
  ) {
    const { matches, scores } = settings;
    if (matches instanceof Object && scores instanceof Object) {
      const protocolKey = this.itemOptions.get("yonyanukulya");
      const subType = protocolKey.split("_").pop();
      const scoreKey = subType === "mnf" ? "prashnaMarga_mnf" : "classical";
      const [s1, s2] = dataSets;
      const female = femaleFirst ? s1 : s2;
      const male = femaleFirst ? s2 : s1;
      const matchKeys = Object.keys(matches);
      if (matchKeys.includes(protocolKey)) {
        const genderMatches = matches[protocolKey];
        if (genderMatches instanceof Array) {
          const femaleNakGender = genderMatches[female.nakshatraIndex];
          const maleNakGender = genderMatches[male.nakshatraIndex];
          const scoreKeys = Object.keys(scores);
          const s1Gender = femaleFirst ? femaleNakGender : maleNakGender;
          const s2Gender = femaleFirst ? maleNakGender : femaleNakGender;
          result.c1Value = this.dictName(s1Gender, "", "gender");
          result.c2Value = this.dictName(s2Gender, "", "gender");
          if (scoreKeys.includes(scoreKey)) {
            const scoreRows = scores[scoreKey];
            if (scoreRows instanceof Array) {
              const scoreRow = scoreRows.find(
                (sr) => sr.f === femaleNakGender && sr.m === maleNakGender
              );
              if (scoreRow) {
                result.score = scoreRow.score;
              }
            }
          }
        }
      }
    }
  }

  _calcVihanga(
    settings: any,
    result: KutaValueSet,
    dataSets: Array<KutaGrahaItem>
  ) {
    const protocolKey = this.itemOptions.get("vihanga");
    const { matches, scores } = settings;
    if (matches instanceof Object && scores instanceof Object) {
      const matchKeys = Object.keys(matches);
      const scoreKeys = Object.keys(scores);
      const [s1, s2] = dataSets;
      const matchWaxWaneSetIndex = (subject: KutaGrahaItem): number =>
        subject.moonWaxing ? 0 : 1;
      let v1 = 0;
      let v2 = 0;
      if (matchKeys.includes(protocolKey)) {
        if (matches[protocolKey] instanceof Array) {
          if (matches[protocolKey].length === 2) {
            if (matches[protocolKey].every((row) => row instanceof Array)) {
              v1 =
                matches[protocolKey][matchWaxWaneSetIndex(s1)][
                  s1.nakshatraIndex
                ];
              v2 =
                matches[protocolKey][matchWaxWaneSetIndex(s2)][
                  s2.nakshatraIndex
                ];
            }
          } else if (matches[protocolKey].length > 26) {
            v1 = matches[protocolKey][s1.nakshatraIndex];
            v2 = matches[protocolKey][s2.nakshatraIndex];
          }
          result.c1Value = this.dictName("vihanga", v1);
          result.c2Value = this.dictName("vihanga", v2);
        }
      }
      if (scoreKeys.includes(protocolKey)) {
        const scoreSet = scores[protocolKey];
        if (scoreSet instanceof Object) {
          const scoreSetKeys = Object.keys(scoreSet);
          if (scoreSetKeys.includes("order")) {
            const { order, scores } = scoreSet;
            const deltas = [order.indexOf(v1), order.indexOf(v2)];
            deltas.sort((a, b) => b - a);
            const diff = (deltas[0] = deltas[1]);
            const scoreRow = scores.find((sc) => sc.diff === diff);
            if (scoreRow) {
              result.score = scoreRow.score;
            }
          } else if (scoreSetKeys.includes("rels")) {
            const { rels, scores } = scoreSet;
            if (rels instanceof Array) {
              let relType = "";
              if (v1 === v2) {
                relType = "same";
              } else {
                const relRow = rels.find((r) => r.num === v1);
                if (relRow) {
                  if (relRow.enemies.includes(v2)) {
                    relType = "enemies";
                  } else if (relRow.friends.includes(v2)) {
                    relType = "friends";
                  }
                }
              }
              if (relType.length > 2) {
                const scoreRow = scores.find((sc) => sc.type === relType);
                if (scoreRow) {
                  result.score = scoreRow.score;
                }
              }
            }
          }
        }
      }
    }
  }

  dictName(subcat: string, num = null, category = "kuta", lang = "en") {
    const hasSubKey = isNumeric(num) || notEmptyString(num);
    const key = hasSubKey ? [subcat, num].join("_") : subcat;
    const lex = this.dictionary.lexeme(category, key);
    let str = key;
    if (lex instanceof Object && lex.hasText()) {
      str = lex.text(lang);
    }
    return str;
  }

  diginityName(dignities: Array<DictMatch>, rel: string) {
    const dictRow = dignities.find((row) => row.key === rel);
    let dictKey = "";
    if (dictRow) {
      dictKey = dictRow.dict;
    }
    return this.dictName(dictKey, "", "dignity");
  }
}
