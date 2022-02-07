import { Graha } from "./models/Graha";
import { Rashi } from "./models/Rashi";
import { UpagrahaValue } from "./models/UpagrahaValue";
import refValues from "./mappings/ref-values";
import grahaValues from "./mappings/graha-values";
import rashiValues from "./mappings/rashi-values";
import { House, KeyName, KeyNumValue, PreferenceOption } from "./interfaces";
import { User, Preference } from "./interfaces/users";
import { capitalize, degAsDms, snakeToWords, truncate } from "./converters";
import { Chart } from "./models/Chart";
import { ChartForm } from "./models/ChartForm";
import { DictionaryState } from "@/store/types";
import { notEmptyString } from "./validators";
import { applyDashaTransitClasses } from "./helpers";

export const mapGraha = (row: any) => new Graha(row);
export const mapRashi = (row: any) => new Rashi(row);
export const mapUpagrahaValue = (row: KeyNumValue) => new UpagrahaValue(row);

export const matchRashi = (num: number): Rashi => {
  const row = rashiValues.find((r) => r.num === num);
  return new Rashi(row);
};

export const matchReference = (key: string, attrs: any): Graha => {
  let row: any = refValues.find((r) => r.key === key);
  if (row instanceof Object && attrs instanceof Object) {
    row = refValues.find((r) => r.key === key);
  } else {
    row = grahaValues.find((r) => r.key === key);
  }
  if (row instanceof Object) {
    row = { ...row, ...attrs };
  }
  return new Graha(row);
};

export const longitudeMatchesHouseIndex = (
  deg: number,
  longitude: number
): boolean => longitude >= deg && longitude < deg + 30;

export const mapGrahaItem = (
  graha: Graha,
  index = 0,
  set = 1,
  prefix = "a",
  transitKeys = []
) => {
  const classNames = [
    graha.key,
    ["item", index].join("-"),
    ["set", set].join("-"),
  ];
  const key = [prefix, graha.key, index, set].join("-");
  if (transitKeys.length > 1) {
    applyDashaTransitClasses(transitKeys, graha, classNames);
  }
  return {
    graha,
    set,
    classNames,
    key,
  };
};

export const extractPayments = (user: User) => {
  const payItems = [];
  if (user.status instanceof Array) {
    user.status.forEach((status) => {
      if (status instanceof Object) {
        const { payments } = status;
        if (payments instanceof Array) {
          payments.forEach((pt) => {
            payItems.push(pt);
          });
        }
      }
    });
  }
  payItems.sort((a, b) => a.createdAt - b.createdAt);
  return payItems;
};

export const matchLastPayment = (user: User) => {
  const payments = extractPayments(user);
  if (payments.length > 0) {
    return payments.slice(-1)[0];
  }
};

export const matchLastPaymentDate = (user: User) => {
  const lp = matchLastPayment(user);
  if (lp instanceof Object) {
    return lp.createdAt;
  }
};

export const hasPayments = (user: User) => {
  return extractPayments(user).length > 0;
};

export const extractOptionKey = (
  option: PreferenceOption,
  preference: Preference
) => {
  let display = "";
  const opt = option.options.find((op) => op.value === preference.value);
  if (opt) {
    display = snakeToWords(opt.key);
  }
  return display;
};

export const extractKeyValueList = (preference: Preference) => {
  const str = preference.value.map((op) => `${op.key}: ${op.value}`).join(", ");
  return snakeToWords(str);
};

export const extractStringList = (preference: Preference, separator = ", ") => {
  let str = "";
  if (preference.value instanceof Array) {
    str = preference.value.join(separator);
  }
  return snakeToWords(str);
};

export const matchPrefence = (
  preference: Preference,
  preferenceOptions: Array<PreferenceOption>
) => {
  const option = preferenceOptions.find((po) => po.key === preference.key);
  const source = option instanceof Object ? option : {};
  let display: any = "";
  if (preference instanceof Object) {
    display = preference.value;
    switch (preference.type) {
      case "array_string":
        display = extractStringList(preference, ", ");
        break;
      case "range_number":
        display = extractStringList(preference, " to ");
        break;
      case "array_key_scale":
        if (preference.value instanceof Array) {
          display = extractKeyValueList(preference);
        }
        break;
      case "key_scale":
        display = extractOptionKey(option, preference);
        break;
      default:
        display =
          display instanceof Array
            ? display.join(", ")
            : display !== null
            ? display.toString()
            : "";
        break;
    }
  }
  return { ...source, ...preference, display };
};

export const buildChartForm = (chart: Chart) => {
  const { subject, datetime } = chart;
  const { name, gender, roddenValue, type, eventType } = subject;
  const { lat, lng, alt } = chart.geo;
  const formVars = {
    name,
    lat,
    lng,
    alt,
    datetime,
    gender,
    type,
    eventType,
    roddenValue,
  };
  return new ChartForm({ ...formVars, chart });
};

export const transformKeyNameOptions = (
  options: Array<KeyName>,
  firstLabel = "",
  maxNameLength = 0
) => {
  const name = notEmptyString(firstLabel) ? firstLabel : "please select...";
  const first = {
    key: -1,
    name,
  };
  return [
    first,
    ...options.map((rv) => {
      const name =
        maxNameLength > 8 ? truncate(rv.name, maxNameLength) : rv.name;
      return { key: rv.value, name: `${rv.key}: ${name}` };
    }),
  ];
};

export const genderOptions = (dictionary: DictionaryState) => {
  return ["-", "f", "m", "n"].map((key) => {
    let name = key;
    switch (key) {
      case "-":
        name = "Gender...";
        break;
      default:
        name = capitalize(
          dictionary.text("gender", key, {
            lang: "en",
            type: "standard",
          })
        );
        break;
    }
    return {
      key,
      name,
    };
  });
};

export const calcChalitDiff = (lng: number, refAscendant = 0) => {
  return 30 - (((Math.floor(lng / 30) * 30) % 30) - ((refAscendant % 30) - 15));
};

export const matchHouseSign = (
  house: House,
  refAscendant = 0,
  chalitBhava = false
): number => {
  const { lng } = house;
  const offset = chalitBhava ? calcChalitDiff(lng, refAscendant) : 0;
  return Math.floor(((lng + offset) % 360) / 30) + 1;
};

export const matchHouseDegToSignLabel = (
  house: House,
  refAscendant = 0,
  chalitBhava = false
): string => {
  const sign =
    matchHouseSign instanceof Function
      ? matchHouseSign(house, refAscendant, chalitBhava)
      : 1;
  const rashi = matchRashi(sign);
  const end = (house.lng + 30) % 360;
  const isWhole = house.lng % 1 === 0;
  const degFrom = isWhole
    ? [house.lng, "º"].join("")
    : degAsDms(house.lng, "raw", 2);
  const degTo = isWhole ? [end, "º"].join("") : degAsDms(end, "raw", 2);
  return [
    [rashi.en, rashi.num].join(": "),
    ["house", house.num].join(": "),
    [degFrom, degTo].join(" to "),
  ].join(" / ");
};
