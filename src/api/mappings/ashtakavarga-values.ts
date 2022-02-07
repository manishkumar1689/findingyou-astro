import { loopShift, loopShiftInner, toSignValues } from "../helpers";
import { Graha } from "../models/Graha";
import { Chart } from "../models/Chart";
import { SignValueGrid, SignValueSet } from "../interfaces";

/* 
    AV = Asthaka Varga
    BAV Bhinna Ashtaka Varga = AV value of a single Graha in house/sign
                               Each GRAHA has a BAV score in each sign
    SAV Sarva Ashtaka Varga  = All BAV summed up for each house/sign
                               Each SIGN has one SAV score
    
    FOR graha = 1 to 9        // ex: ashtakavarga.su      --- graha (from Su to ASC) 
      for fromGraha = 1 to 9  // ex: ashtakavarga.su.key  --- Assign bindu array scores to houses/signs 
        fromGrahaSign = sign of subGraha in chart
        for sign = 1 to 12    // ex: ashtakavarga.su.bindu[sign] --- Assign bindu array scores to houses/signs
          grahaBAVarray(sign) = ashtakavarga.su.bindu[sign] (0 or 1)
       count (inclusively) from the sign of each of the other Grahas points from bindu array
    BAV of each Graha = the sum of points given in each sign
    SAV = the sum of all BAV (of all Grahas+ASC) for each sign
*/
const ashtakavargaValues = [
  {
    key: "su",
    values: [
      /* AV of Sun - counted from each of the Grahas in rows below */
      { key: "su", bindu: [1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 1, 0], ex: false },
      { key: "mo", bindu: [0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0], ex: false },
      { key: "ma", bindu: [1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 1, 0], ex: false },
      { key: "me", bindu: [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 1, 1], ex: false },
      { key: "ju", bindu: [0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0], ex: false },
      { key: "ve", bindu: [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1], ex: false },
      { key: "sa", bindu: [1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 1, 0], ex: false },
      { key: "as", bindu: [0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1], ex: false },
      { key: "ra", bindu: [], ex: false },
      { key: "ke", bindu: [], ex: false },
    ],
  },
  {
    key: "mo",
    values: [
      { key: "su", bindu: [0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0], ex: false },
      { key: "mo", bindu: [1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0], ex: false },
      { key: "ma", bindu: [0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1, 0], ex: false },
      { key: "me", bindu: [1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0], ex: false },
      {
        key: "ju",
        bindu: [1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0],
        ex: true,
        vm: [1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1],
      },
      { key: "ve", bindu: [0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0], ex: false },
      { key: "sa", bindu: [0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0], ex: false },
      { key: "as", bindu: [0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0], ex: false },
      { key: "ra", bindu: [], ex: false },
      { key: "ke", bindu: [], ex: false },
    ],
  },
  {
    key: "ma",
    values: [
      { key: "su", bindu: [0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 0], ex: false },
      { key: "mo", bindu: [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0], ex: false },
      { key: "ma", bindu: [1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0], ex: false },
      { key: "me", bindu: [0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0], ex: false },
      { key: "ju", bindu: [0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1], ex: false },
      { key: "ve", bindu: [0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1], ex: false },
      { key: "sa", bindu: [1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 0], ex: false },
      { key: "as", bindu: [1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0], ex: false },
      { key: "ra", bindu: [], ex: false },
      { key: "ke", bindu: [], ex: false },
    ],
  },
  {
    key: "me",
    values: [
      { key: "su", bindu: [0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1], ex: false },
      { key: "mo", bindu: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0], ex: false },
      { key: "ma", bindu: [1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 1, 0], ex: false },
      { key: "me", bindu: [1, 0, 1, 0, 1, 1, 0, 0, 1, 1, 1, 1], ex: false },
      { key: "ju", bindu: [0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1], ex: false },
      { key: "ve", bindu: [1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0], ex: false },
      { key: "sa", bindu: [1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 1, 0], ex: false },
      { key: "as", bindu: [1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0], ex: false },
      { key: "ra", bindu: [], ex: false },
      { key: "ke", bindu: [], ex: false },
    ],
  },
  {
    key: "ju",
    values: [
      { key: "su", bindu: [1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0], ex: false },
      { key: "mo", bindu: [0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0], ex: false },
      { key: "ma", bindu: [1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0], ex: false },
      { key: "me", bindu: [1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0], ex: false },
      { key: "ju", bindu: [1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0], ex: false },
      { key: "ve", bindu: [0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0], ex: false },
      { key: "sa", bindu: [0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 1], ex: false },
      { key: "as", bindu: [1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0], ex: false },
      { key: "ra", bindu: [], ex: false },
      { key: "ke", bindu: [], ex: false },
    ],
  },
  {
    key: "ve",
    values: [
      { key: "su", bindu: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1], ex: false },
      { key: "mo", bindu: [1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1], ex: false },
      {
        key: "ma",
        bindu: [0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1],
        ex: true,
        vm: [0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1],
      },
      { key: "me", bindu: [0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0], ex: false },
      { key: "ju", bindu: [0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0], ex: false },
      { key: "ve", bindu: [1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0], ex: false },
      { key: "sa", bindu: [0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0], ex: false },
      { key: "as", bindu: [1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0], ex: false },
      { key: "ra", bindu: [], ex: false },
      { key: "ke", bindu: [], ex: false },
    ],
  },
  {
    key: "sa",
    values: [
      { key: "su", bindu: [1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0], ex: false },
      { key: "mo", bindu: [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0], ex: false },
      { key: "ma", bindu: [0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1], ex: false },
      { key: "me", bindu: [0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1], ex: false },
      { key: "ju", bindu: [0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1], ex: false },
      { key: "ve", bindu: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1], ex: false },
      { key: "sa", bindu: [0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0], ex: false },
      { key: "as", bindu: [1, 0, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0], ex: false },
      { key: "ra", bindu: [], ex: false },
      { key: "ke", bindu: [], ex: false },
    ],
  },
  {
    key: "as",
    values: [
      { key: "su", bindu: [0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1], ex: false },
      { key: "mo", bindu: [0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 1], ex: false },
      { key: "ma", bindu: [1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0], ex: false },
      { key: "me", bindu: [1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0], ex: false },
      { key: "ju", bindu: [0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0], ex: false },
      { key: "ve", bindu: [1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0], ex: false },
      { key: "sa", bindu: [1, 0, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0], ex: false },
      { key: "as", bindu: [0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0], ex: false },
      { key: "ra", bindu: [0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 1], ex: false },
      { key: "ke", bindu: [0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 1], ex: false },
    ],
  },
  {
    key: "ra",
    values: [
      { key: "su", bindu: [1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0], ex: false },
      { key: "mo", bindu: [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 0], ex: false },
      { key: "ma", bindu: [0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1], ex: false },
      { key: "me", bindu: [0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1], ex: false },
      { key: "ju", bindu: [1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0], ex: false },
      { key: "ve", bindu: [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1], ex: false },
      { key: "sa", bindu: [0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1], ex: false },
      { key: "as", bindu: [0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 1], ex: false },
      { key: "ra", bindu: [], ex: false },
      { key: "ke", bindu: [], ex: false },
    ],
  },
  {
    key: "ke",
    values: [
      { key: "su", bindu: [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0], ex: false },
      { key: "mo", bindu: [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0], ex: false },
      { key: "ma", bindu: [0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1], ex: false },
      { key: "me", bindu: [1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0], ex: false },
      { key: "ju", bindu: [0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1], ex: false },
      { key: "ve", bindu: [0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1], ex: false },
      { key: "sa", bindu: [0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1], ex: false },
      { key: "as", bindu: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ex: false },
      { key: "ra", bindu: [], ex: false },
      { key: "ke", bindu: [], ex: false },
    ],
  },
];

const getAshtakavargaBodyRow = (graha, tableKey = "", binduSet = "default") => {
  let values = [];
  const tableSet = ashtakavargaValues.find((tv) => tv.key === tableKey);
  if (tableSet) {
    if (tableSet.values instanceof Array) {
      const gv = tableSet.values.find((rv) => rv.key === graha.key);

      if (gv) {
        const binduVals = binduSet === "vm" && gv.ex === true ? gv.vm : gv.bindu;
        const innerVals = loopShiftInner(
          toSignValues(binduVals),
          graha.sign - 1
        );
        values = loopShift(
          innerVals,
          innerVals.findIndex((p) => p.sign === 1)
        );
      }
    }
  }
  return values;
}

const getAshtakavargaBodyRowTotals = (graha: Graha, bodies: Graha[], binduSet = "default") => {
  const keys = bodies.map(gr => gr.key);
  let row = [];
  keys.forEach((key, keyIndex) => {
    const matchedGraha = bodies.find((gr) => gr.key === key);
    const br = getAshtakavargaBodyRow(matchedGraha, graha.key, binduSet);
    if (keyIndex === 0) {
      row = br;
    } else {
      row = row.map((item, itemIndex) => {
        item.value = item.value + br[itemIndex].value;
        return item;
      });
    }
  });
  return row;
}

export const getAshtakavargaBodyTable = (bodies: Graha[] = [], binduSet = "default") => {
   return bodies
        .map((gr) => {
          const values = getAshtakavargaBodyRowTotals(gr, bodies, binduSet);
          return {
            sign: gr.sign,
            key: gr.key,
            values,
          };
        })
        .filter((row) => row.values.length > 0);
}

export const getAshtakavargaBodyValues = (bodies: Graha[] = [], binduSet = "default") => {
  return bodies
       .map((gr) => {
         const values = bodies.map(gr2 => {
            return {
              key: gr2.key,
              values: getAshtakavargaBodyRow(gr, gr2.key, binduSet)
            };
         });
         return { 
           key: gr.key,
           values
         }
       })
       .filter((row) => row.values.length > 0);
}

export const buildAsktakavargaSignSet = (chart: Chart): SignValueSet[] => {
  const grahaKeys = [ "sa", "ju", "ma", "su", "ve", "me", "mo", "as"]
  const bodies = grahaKeys.map(key => chart.graha(key));
  const table = getAshtakavargaBodyTable(bodies);
  return Array.from(Array(12)).map((_,i) => i + 1).map(sign => {
    const values = grahaKeys.map(gk => {
      const row = table.find(row => row.key === gk);
      const item = row instanceof Object && row.values instanceof Array? row.values.find(r => r.sign === sign) : null;
      const hasItem = item instanceof Object
      return hasItem ? { key: gk, value: item.value } : { key: "", value: 0 };
    });
    return { sign,  values };
  });
}

export const buildAsktakavargaSignValueSet = (chart: Chart): SignValueGrid[] => {
  const grahaKeys = [ "sa", "ju", "ma", "su", "ve", "me", "mo", "as"]
  const bodies = grahaKeys.map(key => chart.graha(key));
  const gridValues = getAshtakavargaBodyValues(bodies);
  const startSignIndex = chart.firstHouseSign - 1;
  const houses = Array.from(Array(12)).map((_, i) => {
    const refSignIndex = (startSignIndex + i) % 12;
    const values = gridValues.map(g1 => {
      const { key, values } = g1;
      return {
        key,
        values: values.map(g2 => {
          return {
            key: g2.key,
            value: g2.values[refSignIndex].value
          }
        }).filter(item => item.value > 0).map(item => item.key)
      };
    });
    return { 
      house: (i + 1),
      sign: refSignIndex + 1,
      values
    }
  });
  return houses;
}

export default ashtakavargaValues;
