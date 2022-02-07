/*
    māsa मास (masa__0) the 12 months
    Dictionary Key: masa__ + key

    Calculation of ruler (needed for Shad Bala / Kala / Masa Bala):
    Sign = the sideaeal sign corresponding to the māsa (month).
    SunSignIngressDay = The day Sun entered sign
    MasaGrahaRuler = Graha ruling the Indian Weekday of SunSignIngressDay
*/

const masaValues = [
  { key: 1, sign: 1 }, // vaiśākha	वैशाख
  { key: 2, sign: 2 }, // jyeṣṭhta	ज्येष्ठ
  { key: 3, sign: 3 }, // āṣāḍa	आषाड
  { key: 4, sign: 4 }, // śrāvaṇa	श्रावण
  { key: 5, sign: 5 }, // bhādra	भाद्र
  { key: 6, sign: 6 }, // aśvina	अश्विन
  { key: 7, sign: 7 }, // kārtika	कार्तिक
  { key: 8, sign: 8 }, // mārgaśīrṣa	मार्गशीर्ष
  { key: 9, sign: 9 }, // pauṣa	पौष
  { key: 10, sign: 10 }, // māgha	माघ
  { key: 11, sign: 11 }, // phālguna	फाल्गुण
  { key: 12, sign: 12 }, // caitra	चैत्र
];

export default masaValues;
