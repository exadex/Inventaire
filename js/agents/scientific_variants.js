(function(root,factory){const api=factory();if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ExadexScientificVariants=api;})(typeof window!=="undefined"?window:globalThis,function(){
  "use strict";
  const families={insulin:["insulin","insuline"],transferrin:["transferrin","transferrine"],albumin:["albumin","albumine"],heparin:["heparin","heparine","héparine"],trypsin:["trypsin","trypsine"],collagen:["collagen","collagene","collagène"]};
  const normalize=value=>String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
  function variants(value){const key=normalize(value),family=Object.values(families).find(values=>values.map(normalize).some(term=>key===term||key.split(" ").includes(term)));if(!family)return[key].filter(Boolean);const normalized=family.map(normalize),matched=normalized.find(term=>key===term||key.split(" ").includes(term));return[...new Set(normalized.map(term=>key===matched?term:key.replace(new RegExp(`\\b${matched}\\b`,"g"),term)))];}
  function canonical(value){const key=normalize(value),entry=Object.entries(families).find(([,values])=>values.map(normalize).includes(key));return entry?.[0]||key;}
  return{families,variants,canonical};
});
