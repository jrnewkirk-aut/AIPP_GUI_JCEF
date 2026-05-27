const AIPP_CD_BASIS_OPTIONS=["constant","time","pressure"];
const AIPP_PRESSURE_UNITS=["MPa","kPa","Pa"];
const AIPP_TIME_UNITS=["s","ms"];
const AIPP_CD_TEMPLATES={constant:{basis:"constant",Cd_value:0.7},time:{basis:"time",time_units:"s",time_array:[0.0,0.01],Cd_array:[0.75,0.5],continuity:"interpolate"},pressure:{basis:"pressure",pressure_units:"MPa",pressure_array:[25,50],Cd_array:[0.75,0.5],continuity:"discrete"}};
function makeDischargeCoefficientTemplate(basis){if(!AIPP_CD_TEMPLATES[basis])basis="constant";return deepCopy(AIPP_CD_TEMPLATES[basis]);}
function orderedKeysForObject(title,obj){const keys=Object.keys(obj);if(title==="discharge_coefficient"){const preferred=["basis","Cd_value","time_units","pressure_units","continuity","time_array","pressure_array","Cd_array"];const ordered=[];for(const k of preferred)if(keys.includes(k))ordered.push(k);for(const k of keys.sort())if(!ordered.includes(k))ordered.push(k);return ordered;}return keys.sort();}
function normalizeUnit(s){return String(s||"").trim().replaceAll(" ","").toLowerCase();}
function canonicalPressureUnit(s){const u=normalizeUnit(s);if(u==="mpa")return"MPa";if(u==="kpa")return"kPa";if(u==="pa")return"Pa";return null;}
function canonicalTimeUnit(s){const u=normalizeUnit(s);if(u==="s")return"s";if(u==="ms")return"ms";return null;}
function canonicalCdUnit(s){const u=normalizeUnit(s);if(u===""||u==="cd"||u==="1"||u==="dimensionless"||u==="unitless")return"Cd";return null;}
