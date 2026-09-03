"use strict";
P2.codec = {
  minSafeIntegralToken:-2147483648,maxSafeIntegralToken:4294967295,
  isPlainObject(v){if(v===null||typeof v!=="object")return false;const p=Object.getPrototypeOf(v);return p===Object.prototype||p===null;},
  transform(v,stack=new Set()){if(typeof v==="number"&&!Number.isFinite(v))return{numeric_encoding:"special",value:Number.isNaN(v)?"nan":v===Infinity?"positive_infinity":"negative_infinity"};if(v===null||typeof v!=="object")return v;if(stack.has(v))throw new TypeError("Circular structure is not supported.");stack.add(v);let o;if(Array.isArray(v))o=v.map(x=>this.transform(x,stack));else if(this.isPlainObject(v)){o={};for(const k of Object.keys(v)){const x=v[k];if(x!==undefined&&typeof x!=="function"&&typeof x!=="symbol")o[k]=this.transform(x,stack);}}else{stack.delete(v);throw new TypeError(`Unsupported object type: ${v.constructor?.name||"unknown"}`);}stack.delete(v);return o;},
  numberToken(v){if(Object.is(v,-0))return"-0.0";if(Number.isInteger(v)&&(v<this.minSafeIntegralToken||v>this.maxSafeIntegralToken))return v.toExponential(16);return JSON.stringify(v);},
  stringify(value){const v=this.transform(value),s=x=>{if(x===null)return"null";if(typeof x==="number")return this.numberToken(x);if(typeof x==="string"||typeof x==="boolean")return JSON.stringify(x);if(Array.isArray(x))return`[${x.map(s).join(",")}]`;if(this.isPlainObject(x))return`{${Object.keys(x).map(k=>`${JSON.stringify(k)}:${s(x[k])}`).join(",")}}`;throw new TypeError("Unsupported value");};return s(v);},
  encode(value){return Array.from(new TextEncoder().encode(this.stringify(value)));},
  decode(values){return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(Uint8Array.from(values)));},
  looksLikeControl(values){if(!Array.isArray(values)||values.length<2)return false;try{const v=this.decode(values);return v&&typeof v==="object"&&!Array.isArray(v)&&typeof v.type==="string";}catch(_){return false;}}
};
