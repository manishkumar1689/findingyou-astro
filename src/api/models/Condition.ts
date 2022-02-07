import { smartCastFloat } from "../converters";
import { KeyName, KeyNameMax } from "../interfaces";
import { isNumeric, notEmptyString } from "../validators";

export class Condition {
  isTrue = true;
  fromMode = "";
  toMode = "";
  c1Key = "";
  c2Key = "";
  varga1 = 1;
  varga2 = 1;
  context = "";
  orb = -1;
  aspectQuality = "";
  lordRev = false; // reverse lordship order from A => B to B <= A
  isSet = false;
  kutaRange = [-1, -1];
  hasConditions = true;
  hasChildren = false;

  constructor(inData = null) {
    if (inData instanceof Object) {
      Object.entries(inData).forEach((entry) => {
        const [key, val] = entry;
        switch (typeof val) {
          case "string":
            switch (key) {
              case "fromMode":
              case "toMode":
              case "c1Key":
              case "c2Key":
              case "context":
              case "aspectQuality":
                this[key] = val;
                break;
              case "orb":
                this.orb = smartCastFloat(val);
                break;
            }
            break;
          case "number":
            switch (key) {
              case "varga1":
              case "varga2":
              case "orb":
                this[key] = val;
                break;
            }
            break;
          case "boolean":
            switch (key) {
              case "lordRev":
              case "isTrue":
                this[key] = val;
                break;
            }
            break;
        }
        if (key === "kutaRange" && val instanceof Array && val.length === 2) {
          this.kutaRange = val;
        }
      });
    }
  }

  hasContext() {
    return this.context.length > 1 && this.context !== "-";
  }

  singleMode() {
    return this.fromMode === "single";
  }

  get isValid() {
    return (
      notEmptyString(this.fromMode, 2) &&
      notEmptyString(this.c1Key, 1) &&
      this.hasContext &&
      notEmptyString(this.toMode, 2) &&
      notEmptyString(this.c2Key, 1)
    );
  }
}

export class ConditionSet {
  conditionRefs: Array<ConditionRef> = [];
  operator = "and";
  min = 0; // min. that must be true
  isSet = true;

  constructor(conditionRef = null, operatorRef = "and") {
    const isConditionClass = this.isValidConditionReference(conditionRef);

    if (!isConditionClass && conditionRef instanceof Array) {
      this.operator = operatorRef;
      if (conditionRef instanceof Array) {
        const cr = conditionRef
          .map(this.mapConditionRefs)
          .filter(this.isValidConditionReference);
        this.conditionRefs = cr;
      }
    } else {
      if (isConditionClass) {
        this.conditionRefs = [conditionRef];
      } else if (conditionRef instanceof Array) {
        this.conditionRefs = conditionRef.filter(
          this.isValidConditionReference
        );
      }
    }
    this.operator = operatorRef;
  }

  add(condRef: Condition | ConditionSet, operator = "") {
    this.conditionRefs.push(condRef);
    if (operator.length > 1) {
      this.operator = operator;
    }
  }

  update(index = 0, condRef: Condition | ConditionSet, operator = "") {
    if (index >= 0 && index < this.length) {
      this.conditionRefs[index] = condRef;
    }
    if (operator.length > 1) {
      this.operator = operator;
    }
  }

  mapConditionRefs(condRef = null) {
    if (condRef instanceof Object) {
      const { isSet } = condRef;
      if (isSet) {
        const { conditionRefs, operator } = condRef;
        if (conditionRefs instanceof Array) {
          return new ConditionSet(conditionRefs, operator);
        }
      } else {
        return new Condition(condRef);
      }
    }
  }

  hasConditionRefs() {
    return this.conditionRefs.length > 0;
  }

  get hasChildren() {
    return (
      this.hasConditionRefs() && this.conditionRefs.every((cr) => cr.isValid)
    );
  }

  isValidConditionReference(condRef = null) {
    return condRef instanceof Condition || condRef instanceof ConditionSet;
  }

  get hasConditions() {
    return this.conditionRefs.some((cr) => !cr.isSet || cr.hasConditions);
  }

  get length() {
    return this.conditionRefs.length;
  }

  get lastIndex() {
    return this.getLastIndex();
  }

  get isValid() {
    return this.conditionRefs.every(
      (cr) => (cr.isSet && cr.hasChildren) || cr.isValid
    );
  }

  getLastIndex() {
    return this.conditionRefs.length - 1;
  }
}

type ConditionRef = Condition | ConditionSet;

export class Score {
  key = "emotional";
  value = 0;
  name = "";
  maxScore = 0;

  constructor(key = "emotional", value = 0, name = "", maxScore = 0) {
    if (typeof key === "string") {
      this.key = key;
    }
    if (typeof value === "number") {
      this.value = value;
    }
    if (typeof name === "string" && name.length > 1) {
      this.name = name;
    }
    if (typeof maxScore === "number" && maxScore > 0) {
      this.maxScore = maxScore;
    }
  }
}

export class RuleSet {

  _id = "";

  active = false; // predictive only

  name = "";

  notes = "";

  text = "";

  type = ""; // predictive only

  conditionSet: ConditionSet = new ConditionSet();

  scores: Array<Score> = [];

  private catKeys: string[] = [];

  constructor(inData = null, categories: KeyNameMax[] = []) {
    if (categories instanceof Array) {
      this.catKeys = categories.map((cat) => cat.key);
    }
    if (inData instanceof Object) {
      const { _id, active, type, name, notes, text, scores, conditionSet } = inData;
      if (typeof _id === "string") {
        this._id = _id;
      }
      if (typeof type === "string") {
        this.type = type;
      }
      if (typeof active === "boolean") {
        this.active = active;
      }
      if (typeof name === "string") {
        this.name = name;
      }
      if (typeof notes === "string") {
        this.notes = notes;
      }
      if (typeof text === "string") {
        this.text = text;
      }
      if (scores instanceof Array) {
        this.scores = scores
          .filter((sc) => sc instanceof Object)
          .filter(
            (sc) => this.catKeys.length < 1 || this.catKeys.includes(sc.key)
          )
          .map((sc) => {
            const { key, value, name, maxScore } = sc;
            const nameStr = notEmptyString(name)? name : "";
            const maxInt = maxScore > 0? maxScore : 0;
            return new Score(key, value, nameStr, maxInt);
          });
      }

      if (conditionSet instanceof Object) {
        const { conditionRefs, operator } = conditionSet;
        this.conditionSet = new ConditionSet(conditionRefs, operator);
      }
    }
  }

  get isValid() {
    return this.conditionSet.isValid && notEmptyString(this.name, 1);
  }

  setScores(scoreSet = null, categoryOpts: KeyNameMax[] = []) {
    if (scoreSet instanceof Object) {
      this.scores = Object.entries(scoreSet).map((entry) => {
        const [key, val] = entry;
        const value =
          typeof val === "number"
            ? val
            : typeof val === "string"
            ? parseFloat(val)
            : 0;
        const row = categoryOpts.find(ct => ct.key === key);
        const hasCategory = row instanceof Object;
        const name = hasCategory? notEmptyString(row.name)? row.name : key : key;
        const maxScore = hasCategory? row.maxScore : 0;
        return new Score(key, value, name, maxScore);
      });
    }
    return this.scores;
  }

  matchConditionSet(parents: Array<number> = []) {
    let cs = this.conditionSet;
    if (parents instanceof Array) {
      if (parents.length > 1) {
        parents.slice(1, parents.length).forEach((itemIndex) => {
          if (itemIndex < cs.conditionRefs.length) {
            const inner = cs.conditionRefs[itemIndex];
            if (inner instanceof ConditionSet) {
              cs = inner;
            }
          }
        });
      }
    }
    return cs;
  }

  addCondition(parents: Array<number> = []) {
    const cs = this.matchConditionSet(parents);
    if (cs instanceof ConditionSet) {
      cs.conditionRefs.push(new Condition());
    }
  }

  addConditionSet(parents: Array<number> = [], operator = "and") {
    const cs = this.matchConditionSet(parents);
    if (cs instanceof ConditionSet) {
      cs.conditionRefs.push(new ConditionSet([], operator));
    }
  }

  updateCondition(inData = null, indices: Array<number> = []) {
    const lastIndex = indices.length - 1;
    const parents = indices.slice(0, lastIndex);
    const index = indices[lastIndex];
    const cs = this.matchConditionSet(parents);
    if (
      index < cs.conditionRefs.length &&
      cs.conditionRefs[index] instanceof Condition
    ) {
      cs.conditionRefs[index] = new Condition(inData);
    } else {
      cs.conditionRefs.push(new Condition(inData));
    }
  }

  removeCondition(index = 0) {
    if (index >= 0 && index < this.conditionSet.length) {
      this.conditionSet.conditionRefs.splice(index, 1);
    }
  }

  setName(name: string) {
    this.name = name;
  }

  setNotes(str: string) {
    this.notes = str.trim();
  }

  setText(str: string) {
    this.text = str.trim();
  }

  getScore(key: string) {
    let value = 0;
    const score = this.scores.find((sc) => sc.key === key);
    if (score instanceof Score) {
      value = score.value;
    }
    return value;
  }

  get hasConditions() {
    return this.conditionSet.conditionRefs.length > 0;
  }
}

export interface SimpleUser {
  _id: string;
  identifier: string;
  nickName: string;
  fullName: string;
  active: boolean;
  roles: string[];
}

const defaultSimpleUser = {
  _id: "",
  identifier: "",
  nickName: "",
  fullName: "",
  active: false,
  roles: [],
};

export class RulesCollection {
  type = "";
  percent: number;
  rules: Array<RuleSet> = [];

  constructor(inData = null, categories: KeyNameMax[] = []) {
    if (inData instanceof Object) {
      const { _id, type, rules, percent } = inData;
      if (notEmptyString(type)) {
        this.type = type;
      }
      if (isNumeric(percent)) {
        this.percent =
          typeof percent === "number" ? percent : parseFloat(percent);
      }
      if (rules instanceof Object) {
        this.rules = rules
          .filter((r) => r instanceof Object)
          .map((r) => new RuleSet(r, categories));
      }
    }
  }

  addRule(rule: RuleSet) {
    this.rules.push(rule);
  }

  editRule(index: number, rule: RuleSet) {
    if (index >= 0 && index < this.rules.length) {
      this.rules[index] = rule;
    }
  }

  getRule(index: number) {
    if (index >= 0 && index < this.rules.length) {
      return this.rules[index];
    }
  }

  get length() {
    return this.rules.length;
  }

  removeRule(index: number) {
    if (index >= 0 && index < this.rules.length) {
      this.rules.splice(index, 1);
    }
  }
}

export class Protocol {
  _id?: string;
  user: string; // user id
  name = "";
  notes = "";
  categories: Array<KeyNameMax> = [
    { key: "generic", name: "Generic", maxScore: 10 },
  ];
  collections: Array<RulesCollection> = [];
  settings: Map<string, any> = new Map();
  userRecord: SimpleUser = defaultSimpleUser;

  constructor(inData = null) {
    if (inData instanceof Object) {
      const {
        _id,
        user,
        name,
        notes,
        categories,
        collections,
        settings,
      } = inData;
      if (notEmptyString(_id, 16)) {
        this._id = _id;
      }
      if (notEmptyString(user, 16)) {
        this.user = user;
      } else if (user instanceof Object) {
        const keys = Object.keys(user);
        if (
          keys.includes("_id") &&
          keys.includes("identifier") &&
          keys.includes("nickName") &&
          keys.includes("roles")
        ) {
          this.user = user._id;
          this.userRecord = user;
        }
      }
      if (notEmptyString(name)) {
        this.name = name;
      }
      if (notEmptyString(notes)) {
        this.notes = notes;
      }
      if (categories instanceof Object) {
        this.assignCategories(categories);
      }
      if (collections instanceof Object) {
        this.collections = collections
          .filter((c) => c instanceof Object)
          .map((c) => new RulesCollection(c, categories));
      }
      if (settings instanceof Array) {
        settings.forEach((item) => {
          const { key, value } = item;
          if (notEmptyString(key)) {
            this.settings.set(key, value);
          }
        });
      }
    }
  }

  addCategory(category: KeyName) {
    this.categories.push(category);
  }

  private assignCategories(categories: any[] = []) {
    categories
      .filter((c) => c instanceof Object)
      .filter((c) => {
        const keys = Object.keys(c);
        return keys.includes("key") && keys.includes("name");
      })
      .forEach((c) => {
        const { key, name, maxScore } = c;
        if (key !== "generic") {
          this.categories.push({
            key,
            name,
            maxScore,
          });
        }
      });
  }

  editCategory(index: number, category: KeyName) {
    if (index >= 0 && index < this.categories.length) {
      this.categories[index] = category;
    }
  }

  removeCategory(index: number) {
    if (index >= 0 && index < this.categories.length) {
      this.categories.splice(index, 1);
    }
  }

  addCollection(collection: RulesCollection) {
    this.collections.push(collection);
  }

  editCollection(index: number, collection: RulesCollection) {
    if (index >= 0 && index < this.collections.length) {
      this.collections[index] = collection;
    }
  }

  getCollection(index: number) {
    if (index >= 0 && index < this.collections.length) {
      return this.collections[index];
    }
  }

  get length() {
    return this.collections.length;
  }

  removeCollection(index: number) {
    if (index >= 0 && index < this.collections.length) {
      this.collections.splice(index, 1);
    }
  }

  getSettings() {
    return [...this.settings.entries()].map((entry) => {
      const [key, value] = entry;
      return {
        key,
        value,
      };
    });
  }

  toObject() {
    return {
      categories: this.categories,
      name: this.name,
      collections: this.collections,
      notes: this.notes,
      user: this.user,
      settings: this.getSettings(),
    };
  }
}
