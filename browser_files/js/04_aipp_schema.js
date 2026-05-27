const AIPP_CD_BASIS_OPTIONS=["constant","time","pressure"];
const AIPP_PRESSURE_UNITS=["MPa","kPa","Pa"];
const AIPP_TIME_UNITS=["s","ms"];
const AIPP_CD_TEMPLATES={constant:{basis:"constant",Cd_value:0.7},time:{basis:"time",time_units:"s",time_array:[0.0,0.01],Cd_array:[0.75,0.5],continuity:"interpolate"},pressure:{basis:"pressure",pressure_units:"MPa",pressure_array:[25,50],Cd_array:[0.75,0.5],continuity:"discrete"}};
function makeDischargeCoefficientTemplate(basis){if(!AIPP_CD_TEMPLATES[basis])basis="constant";return deepCopy(AIPP_CD_TEMPLATES[basis]);}
function normalizeUnit(s){return String(s||"").trim().replaceAll(" ","").toLowerCase();}
function canonicalPressureUnit(s){const u=normalizeUnit(s);if(u==="mpa")return"MPa";if(u==="kpa")return"kPa";if(u==="pa")return"Pa";return null;}
function canonicalTimeUnit(s){const u=normalizeUnit(s);if(u==="s")return"s";if(u==="ms")return"ms";return null;}
function canonicalCdUnit(s){const u=normalizeUnit(s);if(u===""||u==="cd"||u==="1"||u==="dimensionless"||u==="unitless")return"Cd";return null;}
function orderedKeysForObject(title,obj){const keys=Object.keys(obj);if(title==="discharge_coefficient"){const pref=["basis","Cd_value","time_units","pressure_units","continuity","time_array","pressure_array","Cd_array"];const out=[];for(const k of pref)if(keys.includes(k))out.push(k);for(const k of keys.sort())if(!out.includes(k))out.push(k);return out;}return keys.sort();}
function parseQuantityString(s,allowedUnits,defaultUnit){const txt=String(s||"").trim();const m=txt.match(/^\s*([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s*([A-Za-z]+)\s*$/);let value=0,unit=defaultUnit;if(m){value=Number(m[1]);const raw=m[2];for(const u of allowedUnits){if(normalizeUnit(u)===normalizeUnit(raw)){unit=u;break;}}}return{value:value,unit:unit};}
function formatQuantity(value,unit){return String(value)+" "+unit;}
function getEventSuggestions(){const out=["SimStart"];const info=getAssemblyInfo(fullJson);const assembly=info.assembly;if(!assembly)return out;if(Array.isArray(assembly.orifices)){for(let i=0;i<assembly.orifices.length;i++){out.push("O"+(i+1)+"_opened");out.push("O"+(i+1)+"_closed");}}if(Array.isArray(assembly.chambers)){for(let c=0;c<assembly.chambers.length;c++){const pyros=assembly.chambers[c].pyro;if(Array.isArray(pyros)){for(let p=0;p<pyros.length;p++){out.push("C"+(c+1)+"P"+(p+1)+"_ignited");out.push("C"+(c+1)+"P"+(p+1)+"_extinguished");}}}}return out;}
