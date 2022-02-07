import { Graha } from "../models/Graha";

export interface House {
  readonly num: number;
  lng: number;
}

export interface LngLat {
  readonly lat: number;
  readonly lng: number;
}

export interface LtDvPair {
  lt: string;
  dv: string;
}

export interface NameNumber {
  readonly key?: string;
  readonly format?: string;
  readonly name: string;
  readonly value: number;
}

export interface NameValue {
  readonly key?: string;
  readonly format?: string;
  readonly name: string;
  readonly value: any;
}

export interface KeyNumber {
  readonly num?: string;
  readonly key: string;
  readonly format?: string;
  readonly value: number;
}

export interface KeyPosValue {
  readonly key: string;
  longitude: number;
  x: number;
  y: number;
}

export interface PredictiveOption {
  varga: number;
  component: string;
}

export interface DictKeyMatch {
  readonly dictKey: string;
  readonly key: string;
}

export interface IconPosition {
  top: string;
  left: string;
  transform?: string;
}

export interface DayObj {
  readonly num: number;
  readonly key: string;
  readonly en: string;
}

export interface GrahaObj {
  readonly num: number;
  readonly jyNum: number;
  readonly key: string;
  readonly name: string;
  readonly icon: string;
}

export interface XYPos {
  readonly x: number;
  readonly y: number;
}

export interface RashiObj {
  num?: number;
  key: string;
  icon?: string;
  element: string;
  mobility: string;
  en?: string;
  ruler?: string;
}

export interface KeyObject {
  key: string;
  value: any;
}

export interface KeyLabel {
  key: string;
  label: string;
}

export interface KeyName {
  key: string;
  name: string;
  value?: number;
  parents?: string[];
  single?: boolean;
  double?: boolean;
  itemKey?: string;
}

export interface SlugName {
  slug: string;
  name: string;
  vocab?: string;
  parents?: string[];
  value?: number;
}

export const defaultPairedTag = {
  slug: "",
  name: "",
  vocab: "",
};

export interface TagOptionSet {
  key: string;
  name: string;
  options: SlugName[];
  parent?: string;
}

export interface KeyNameMax {
  key: string;
  name: string;
  maxScore?: number;
}

export interface KeyNumValue {
  key: string;
  value: number;
}

export interface KeyNumLabel extends KeyNumValue {
  label: string;
}

export interface CompatibiltyOptionSet {
  key: string;
  name: string;
  charts: Array<number>;
  options?: Array<KeyName>;
}

export interface ContextOption {
  key: string;
  name: string;
  isAspect: boolean;
  c2groups: Array<string>;
  collections?: Array<string>;
  isKuta: boolean;
  isDasha?: boolean;
  pIndex?: number;
}

export interface CustomOrbRow {
  key: string;
  orbs: Array<KeyNumValue>;
}

export interface Translation {
  lang: string;
  text: string;
  type: string;
  alpha: string;
  weight?: number;
}

export interface Version {
  lang: string; // language or lang/locale
  langCode?: string; // lang-only component
  locale?: string; // optional locale suffix
  text: string;
  active: boolean;
  approved: boolean;
  weight?: number;
  modifiedAt?: Date;
  createdAt?: Date;
}

export interface Lexeme {
  key: string;
  lang: string;
  name: string;
  original?: string;
  unicode?: string;
  translations?: Translation[];
}

export interface Snippet {
  key: string;
  published: boolean;
  format?: string;
  notes?: string;
  values: Version[];
  modifiedAt?: string;
  createdAt?: string;
}

export interface LanguageItem {
  key: string;
  name: string;
  native: string;
  inApp: boolean;
  inDict: boolean;
  appWeight?: number;
  dictWeight?: number;
}

export interface Setting {
  key: string;
  value: any;
  type: string;
  weight: number;
  createdAt?: Date;
  modifiedAt?: Date;
}

export interface PaymentOption {
  key: string;
  name: string;
  amount: number;
  curr: string;
  isFallback?: boolean;
  ccodes?: string[];
  period: string;
  duration: number;
  maxRepeats: number;
  subKey?: string;
  roleKey?: string;
}

export interface PreferenceOption {
  key: string;
  prompt: string;
  type: string;
  options?: any[];
  domain?: string;
  subdomain?: number;
  inverted?: false;
  rules?: any[];
  versions?: any;
}

export interface Flag {
  key: string;
  type: string;
  prompt?: string;
  isRating?: boolean;
  defaultValue?: any;
  defaultStringValue?: string;
  optionString?: "";
  options?: string[];
  range?: number[];
}

export interface Role {
  key: string;
  name: string;
  overrides?: string[];
  adminAccess: boolean;
  appAccess: boolean;
  permissions: string[];
  payOpts?: PaymentOption[];
}

export interface CountryOption {
  name: string;
  fullName?: string;
  l2: string;
  l3: string;
  num: number;
}

export interface AyanamshaItem {
  num: number;
  key: string;
  value: number;
  name: string;
}

export const DefaultAyanamshaItem: AyanamshaItem = {
  num: 27,
  key: "true_citra",
  value: 23.3,
  name: "True Citra",
};

export interface VariantValSet {
  num: number; // ayanamsha ref
  sign: number;
  house: number;
  nakshatra: number;
  relationship: string;
  charaKaraka: number;
}

export interface SphutaSet {
  num: number; // ayanamsha ref
  items: Array<KeyNumValue>;
}

export interface LookupRow {
  key: string;
  name: string;
  enabled: boolean;
  weight?: number;
  value?: number;
}

export interface DataSet {
  label: string;
  borderColor: string;
  borderWidth: number;
  backgroundColor: string;
  data: Array<number>;
}

export interface ChartData {
  labels: Array<string>;
  datasets: Array<DataSet>;
}

export const defaultChartData: ChartData = {
  labels: [],
  datasets: [],
};

export interface KakshyaItem {
  key: string;
  lord: string;
  lng: number;
  hasBindu: boolean;
  sign: number;
  num: number;
}

export interface KakshyaRow {
  jd: number;
  mediumDate?: string;
  items: KakshyaItem[];
}

export interface GreekRow {
  key: string;
  name: string;
  c1: number;
  c2?: number;
  mid?: number;
}

export interface BinduSet {
  key: string;
  bindu: Array<number>;
  ex: boolean;
  vm?: Array<number>;
}

export interface KeyValueSet {
  key: string;
  values: Array<number>;
}

export interface SignValue {
  sign: number;
  value: number;
  house?: number;
}

export interface SignValueSet {
  sign: number;
  house?: number;
  values: KeyNumValue[];
}

export interface KeyValueKeys {
  key: string;
  values: string[];
}

export interface SignValueGrid {
  sign: number;
  house?: number;
  values: KeyValueKeys[];
}

export interface SignSet {
  sign: number;
  value: number;
  house?: number;
  title?: string;
  style?: string;
  grahas: Array<Graha>;
}

export interface GrahaStyle {
  graha: Graha;
  style: string;
  inSign?: number;
  index?: number;
}

export interface AshtakaCell {
  sign: number;
  key: string;
  set: string;
  values: Array<SignValue>;
}

export interface GrahaVal {
  key: string;
  value: number;
  style: string;
}

export interface AshtakaSub {
  key: string;
  values: Array<GrahaVal>;
  total: number;
  style?: string;
}

export interface AshtakaCellSet {
  sign: number;
  values: Array<AshtakaSub>;
  total: number;
  style?: string;
}
export interface StartEnd {
  start: number;
  end: number;
}

export interface StartEndDateString {
  start: string;
  end: string;
}

export interface Cell {
  row: number;
  column: number;
}

export interface NakshatraItem {
  key: string;
  key28?: string;
  offset27?: number;
  ruler?: string;
  goal?: string;
  gender?: string;
  yoni?: number | string;
  pada?: number;
  aksharas?: Array<string>;
  nadi?: string;
  degreeRange?: StartEnd;
  label?: string;
  yoniLabel?: string;
}

export interface GrahaItem {
  graha: Graha;
  set: number;
  key: string;
  classNames: Array<string>;
}

export interface SurfaceTSData {
  geo: LngLat;
  ascendant: number;
  tzOffset: number;
}

export interface SignHouse {
  house: number;
  sign: number;
  key?: string;
}

export interface KeyKeys {
  key: string;
  keys: Array<string>;
}

export interface MfScores {
  fm: number;
  mf: number;
  sameSign?: number;
}

export interface ItemMatchOverride {
  num: number;
  index: number;
  score: number;
}

export interface KutaScoreMatch {
  standard: number;
  match: number;
  overrides?: Array<ItemMatchOverride>;
}

export interface SignMatchProtocol {
  signMatches: Array<number[]>;
  scores: MfScores;
}

export interface VashyaDegreeRange {
  degreeRange: Array<number>;
  vashya: number;
}

export interface DictMatch {
  key: string;
  dict: string;
}

export interface RangeMatchProtocol {
  ranges: Array<VashyaDegreeRange>;
  score: any;
}

export interface AspectCell {
  k1: string;
  k2?: string;
  s1?: string;
  s2?: string;
  value: string;
  target?: number;
  orb: number;
  absOrb: number;
  maxOrb?: number;
  deg: number;
  lng1: number;
  lng2: number;
  dir?: string;
  aspectDegree?: string;
  aspectColor?: string;
  group?: number;
}

export interface Nak28Cell {
  num: number;
  long: string;
  short: string;
  classNames: string[];
  key: string;
  title: string;
}

export interface AspectFracIndex {
  frac: number;
  index: number;
}

export interface KeySet {
  key: string;
  set: number;
}
