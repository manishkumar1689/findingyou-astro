import {
  asPerc,
  julToDateFormat,
  percDec,
  shortenName,
  smartCastFloat,
  smartCastInt,
  toStringDuration,
} from "../converters";
import { toWords } from "../helpers";
import { Chart, Subject, Tag } from "./Chart";
import { GeoLoc } from "./GeoLoc";

interface KeyPair {
  key: string;
  pair: Array<number>;
}

interface KeyPairMax extends KeyPair {
  max: number;
}

const _mapKeyPair = (row = null, addMax = false) => {
  let key = "";
  let pair = [0, 0];
  let max = 0;
  if (row instanceof Object) {
    Object.entries(row).forEach((entry) => {
      const [k, v] = entry;
      if (typeof v === "string" && k === "key") {
        key = v;
      } else if (v instanceof Array && k === "pair" && v.length === 2) {
        pair = v.map(smartCastFloat);
      } else if (addMax && typeof v === "number") {
        max = v;
      }
    });
  }
  return addMax ? { key, pair, max } : { key, pair };
};

const mapKeyPair = (row = null) => {
  return _mapKeyPair(row, false) as KeyPair;
};

const mapKeyPairMax = (row = null) => {
  return _mapKeyPair(row, true) as KeyPairMax;
};

class GeoPlace extends GeoLoc {
  place: string;
  constructor(inData = null) {
    super(inData);
    if (inData instanceof Object && Object.keys(inData).includes("place")) {
      this.place = inData.place;
    }
  }
}

const defaultSubject = {
  name: "",
  type: "",
  gender: "",
  eventType: "",
  roddenScale: "",
  roddenValue: -1,
};

const mapSubject = (row = null) => {
  const obj = Object.assign({}, defaultSubject);
  const keys = Object.keys(obj);
  if (row instanceof Object) {
    Object.entries(row).forEach((entry) => {
      const [k, v] = entry;
      if (keys.includes(k)) {
        obj[k] = v;
      }
    });
  }
  return obj;
};

class MatchResultSet {
  scores: Array<KeyPair> = [];
  operator = "and";
  min = 0;
  results: Array<MatchResultSet> = [];
  percent = 0;
  type = "";
  matched = false;

  constructor(inData = null) {
    if (inData instanceof Object) {
      Object.entries(inData).forEach((entry) => {
        const [key, val] = entry;
        if (typeof val === "number" && ["min", "percent"].includes(key)) {
          this[key] = val;
        } else if (
          typeof val === "string" &&
          ["operator", "type"].includes(key)
        ) {
          this[key] = val;
        } else if (val instanceof Array) {
          switch (key) {
            case "results":
              this.results = val.map((result) => new MatchResultSet(val));
              break;
            case "scores":
              this.scores = val.map(mapKeyPair);
              break;
          }
        }
      });
    }
  }
}

class SubtotalItem {
  type = "";
  scores: Array<KeyPair> = [];
  percent = 0;

  constructor(inData = null) {
    if (inData instanceof Object) {
      Object.entries(inData).forEach((entry) => {
        const [key, val] = entry;
        if (typeof val === "number" && key === "percent") {
          this.percent = val;
        } else if (typeof val === "string" && key === "type") {
          this.type = val;
        } else if (val instanceof Array && key === "scores") {
          this.scores = val.map(mapKeyPair);
        }
      });
    }
  }
}

class PairInfo {
  jds: Array<number> = [0, 0];
  tzOffsets: Array<number> = [0, 0];
  midGeo: GeoLoc;
  locations: Array<GeoPlace> = [];
  subjects: Array<Subject> = [];
  tags: Array<Tag> = [];
  startYear = 0;
  endYear = 0;
  span = 0;
  relType = "";

  constructor(inData = null) {
    if (inData instanceof Object) {
      Object.entries(inData).forEach((entry) => {
        const [key, val] = entry;
        if (
          typeof val === "number" &&
          ["startYear", "endYear", "span"].includes(key)
        ) {
          this[key] = val;
        } else if (typeof val === "string" && key === "relType") {
          this.relType = val;
        } else if (
          val instanceof Array &&
          ["locations", "tags", "jds", "subjects", "tzOffsets"].includes(key)
        ) {
          switch (key) {
            case "locations":
              this.locations = val.map((row) => new GeoPlace(row));
              break;
            case "jds":
              this.jds = val.map(smartCastFloat);
              break;
            case "tzOffsets":
              this.tzOffsets = val.map(smartCastInt);
              break;
            case "tags":
              this.tags = val.map((row) => new Tag(row));
              break;
            case "subjects":
              this.subjects = val.map(mapSubject);
              break;
          }
        }
      });
    }
  }

  getSubject(index: number): Subject {
    return index < this.subjects.length ? this.subjects[index] : defaultSubject;
  }

  get subject1(): Subject {
    return this.getSubject(0);
  }

  get subject2(): Subject {
    return this.getSubject(1);
  }

  getShortName(index: number) {
    return shortenName(this.getSubject(index).name);
  }

  get shortName1() {
    return this.getShortName(0);
  }

  get shortName2() {
    return this.getShortName(1);
  }

  getNameGender(index: number) {
    const sub = this.getSubject(index);
    return `${shortenName(sub.name)} (${sub.gender})`;
  }

  get relInfo() {
    const tagLabels = this.tags
      .filter((tg) => tg.slug !== this.relType)
      .map((tg) => tg.name)
      .join(", ");
    return `${this.relType}: ${tagLabels}`;
  }

  fullNameGenderDob(index: number) {
    const sub = this.getSubject(index);
    const { name, gender } = sub;
    const jd = index < this.jds.length ? this.jds[index] : -1;
    const tzO = index < this.tzOffsets.length ? this.tzOffsets[index] : 0;
    const fd = julToDateFormat(jd, tzO, "euro1", {
      time: true,
      seconds: false,
    });
    return `${name} (${gender}): ${fd}`;
  }

  get fullNameGenderDob1() {
    return this.fullNameGenderDob(0);
  }

  get fullNameGenderDob2() {
    return this.fullNameGenderDob(1);
  }

  get duration() {
    const yearLen = this.endYear - this.startYear;
    return yearLen > 0 ? yearLen : this.span;
  }
}

export class ProtocolSearchResult {
  results: Array<MatchResultSet> = [];
  subtotals: Array<SubtotalItem> = [];
  totals: Array<KeyPairMax> = [];
  info: PairInfo;
  c1Id = "";
  c2Id = "";
  tagOptions = [];

  constructor(inData = null, tagOptions = []) {
    if (tagOptions instanceof Array) {
      this.tagOptions = tagOptions;
    }
    if (inData instanceof Object) {
      Object.entries(inData).forEach((entry) => {
        const [key, val] = entry;
        if (val instanceof Array) {
          switch (key) {
            case "results":
              this.results = val.map((result) => new MatchResultSet(val));
              break;
            case "subtotals":
              this.subtotals = val.map((row) => new SubtotalItem(row));
              break;
            case "totals":
              this.totals = val.map(mapKeyPairMax);
              break;
          }
        } else if (val instanceof Object && key === "info") {
          this.info = new PairInfo(val);
        } else if (typeof val === "string") {
          switch (key) {
            case "c1Id":
            case "c2Id":
              this[key] = val;
              break;
          }
        }
      });
    }
  }

  updateInfo(inData: any) {
    if (inData instanceof Object) {
      Object.entries(inData).forEach((entry) => {
        const [k, v] = entry;
        if (v instanceof Array) {
          switch (k) {
            case "tags":
              this.info.tags = v;
              break;
          }
        } else if (typeof v === "number") {
          switch (k) {
            case "startYear":
            case "endYear":
            case "span":
              this.info[k] = v;
              break;
          }
        } else if (typeof v === "string") {
          switch (k) {
            case "relType":
              this.info[k] = v;
              break;
          }
        }
      });
    }
  }

  updateChart(chart: Chart) {
    let index = -1;
    if (chart._id === this.c1Id) {
      index = 0;
    } else if (chart._id === this.c2Id) {
      index = 1;
    }
    if (index >= 0) {
      this.info.subjects[index] = chart.subject;
      const loc = this.info.locations[index];
      this.info.locations[index] = new GeoPlace({
        ...loc,
        ...chart.geo,
      });
    }
  }

  get subtotalsByPane() {
    const subs = this.subtotals
      .filter((st) => st.scores.length > 0)
      .map((st, si) => {
        const scores = st.scores.filter(
          (sc) => sc.pair.length === 2 && sc.pair[1] > 0
        );
        const numScores = scores.length;
        const total = scores
          .map((sc) => sc.pair[0] / sc.pair[1])
          .reduce((a, b) => a + b, 0);
        const percent = (total / numScores) * 100;
        const details = scores.map((sc, sci) => {
          const { key, pair } = sc;
          const label = toWords(key);
          const percVal = asPerc(pair[0] / pair[1], 2);
          const rowKey = [key, this.c1Id, this.c2Id, si, sci].join("-");
          return {
            key,
            label,
            percVal,
            rowKey,
            points: pair[0],
            max: pair[1],
          };
        });
        return {
          type: st.type,
          label: toWords(st.type),
          key: [st.type, si].join("-"),
          percent,
          percVal: percDec(st.percent),
          details,
        };
      });
    return subs;
  }

  get subject1() {
    return this.info.subject1;
  }

  get subject2() {
    return this.info.subject2;
  }
  get nameGender1() {
    return this.info.getNameGender(0);
  }

  get nameGender2() {
    return this.info.getNameGender(1);
  }

  get rodden1() {
    return this.info.subject1.roddenValue;
  }

  get rodden2() {
    return this.info.subject2.roddenValue;
  }

  get fullNameGenderDob1() {
    return this.info.fullNameGenderDob1;
  }

  get fullNameGenderDob2() {
    return this.info.fullNameGenderDob2;
  }

  get names() {
    return [this.info.shortName1, this.info.shortName2].join(" / ");
  }

  get relInfo() {
    return this.info.relInfo;
  }

  get id() {
    return [this.c1Id, this.c2Id].join("/");
  }

  get endWho() {
    return this.matchTagByGroup("end_who");
  }

  get endHow() {
    return this.matchTagByGroup("end_how");
  }

  get happiness() {
    return this.matchTagByGroup("happiness");
  }

  get quality() {
    return this.matchTagByGroup("quality");
  }

  get qualityNames() {
    return this.matchTagsByGroup("quality")
      .map((tg) => tg.name)
      .join(", ");
  }

  get duration() {
    const { startYear, endYear, span } = this.info;
    if (endYear > 0 && startYear > 0 && endYear > startYear) {
      return endYear - startYear;
    } else {
      return span;
    }
  }

  get durationString() {
    return toStringDuration(this.duration);
  }

  matchTagKeysByGroup(groupKey: string) {
    const tagRow = this.tagOptions.find((optSet) => optSet.key === groupKey);
    return tagRow instanceof Object ? tagRow.options.map((tg) => tg.slug) : [];
  }

  matchTagByGroup(groupKey: string) {
    const keys = this.matchTagKeysByGroup(groupKey);
    const tag = this.info.tags.find((tg) => keys.includes(tg.slug));
    return tag instanceof Object ? tag : { name: "", slug: "" };
  }

  matchTagsByGroup(groupKey: string) {
    const keys = this.matchTagKeysByGroup(groupKey);
    return this.info.tags.filter((tg) => keys.includes(tg.slug));
  }
}
