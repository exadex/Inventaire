(function (root, factory) {
  const api = factory();
  root.ExadexAgentsCore = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  const GENERIC = new Set(["tube","tubes","kit","kits","solution","solutions","boite","boites","flacon","flacons","plaque","plaques","reagent","reagents","reactif","reactifs","medium","milieu","milieux","buffer","tampon","produit","produits"]);
  const EMPTY_REFERENCES = new Set(["","n a","na","-","/","non renseigne","sans reference","aucune reference","non applicable"]);
  const clone = value => JSON.parse(JSON.stringify(value));
  const number = value => typeof value === "number" ? value : Number(String(value ?? "").replace(",", "."));
  const uid = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const normalize = value => String(value ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/(\d)\s*(ml|µl|ul|mg|g|kg|l)\b/g, "$1 $2")
    .replace(/[^a-z0-9µ]+/g, " ").trim().replace(/\s+/g, " ");
  const tokens = value => normalize(value).split(" ").filter(word => word && !GENERIC.has(word)).map(word => word.endsWith("s") && word.length > 4 ? word.slice(0, -1) : word);
  const tokenKey = value => [...new Set(tokens(value))].sort().join(" ");
  const normalizeMeaningfulReference = value => {
    if(value === null || value === undefined || typeof value === "object") return null;
    const result=normalize(value);
    return !result || EMPTY_REFERENCES.has(result) ? null : result;
  };
  const refs = item => {
    const source = item?.references;
    let values;
    if (Array.isArray(source)) values=source.map(row => row?.reference ?? row?.value ?? row);
    else if (source && typeof source === "object") values=Object.values(source).flatMap(row => Array.isArray(row) ? row : [row]).map(row => row?.reference ?? row?.value ?? null);
    else values=[item?.reference,item?.supplierReference];
    return [...new Set(values.map(normalizeMeaningfulReference).filter(Boolean))];
  };
  const supplier = item => normalize(item?.supplier || item?.fournisseur);
  const isAbsent = value => value === null || value === undefined || (typeof value === "string" && !value.trim());
  const primaryReferenceValue = item => item?.references?.primary?.reference ?? item?.reference ?? item?.supplierReference;
  const meaningfulPrimaryReference = item => normalizeMeaningfulReference(primaryReferenceValue(item));
  const normalizeContactReference = value => {
    if(value === null || value === undefined || typeof value === "object")return null;
    const result=String(value).trim().toLowerCase().replace(/\s+/g," ");
    return result||null;
  };
  const supplierValue = item => String(item?.references?.primary?.supplier ?? item?.supplier ?? item?.fournisseur ?? "").trim();
  const contactNames = contact => [contact?.company,contact?.society,...(Array.isArray(contact?.aliases)?contact.aliases:[])].map(normalize).filter(Boolean);
  function findContactForItem(item,contacts){
    if(item?.supplierContactId){
      const explicit=contacts.find(contact=>String(contact?.id)===String(item.supplierContactId));
      if(explicit)return explicit;
    }
    const name=normalize(supplierValue(item));
    return name?contacts.find(contact=>contactNames(contact).includes(name))||null:null;
  }
  function referenceValues(source){
    if(source === null || source === undefined)return[];
    if(typeof source!=="object")return[source];
    if(Array.isArray(source))return source.flatMap(referenceValues);
    const direct=["reference","supplierReference","value","code"].filter(key=>Object.prototype.hasOwnProperty.call(source,key)).flatMap(key=>referenceValues(source[key]));
    if(direct.length)return direct;
    return ["primary","secondary","references","items","values"].filter(key=>Object.prototype.hasOwnProperty.call(source,key)).flatMap(key=>referenceValues(source[key]));
  }
  const itemContactReferences = item => referenceValues(item?.references).concat([item?.reference,item?.supplierReference]).map(normalizeContactReference).filter(Boolean);
  function contactReferences(contact,items,contacts){
    const explicitKeys=["references","reference","supplierReference","productReferences"].filter(key=>Object.prototype.hasOwnProperty.call(contact||{},key));
    const values=explicitKeys.length
      ? explicitKeys.flatMap(key=>referenceValues(contact[key]))
      : items.filter(item=>findContactForItem(item,contacts)?.id===contact?.id).flatMap(itemContactReferences);
    return new Set(values.map(normalizeContactReference).filter(Boolean));
  }
  const locations = item => [...new Set([item?.location, ...(Array.isArray(item?.locations) ? item.locations : [])].filter(Boolean))];
  const snapshot = item => JSON.stringify({
    id: item?.id, quantity: item?.quantity, location: item?.location, locations: item?.locations,
    stockTracking: item?.stockTracking, aliquotTracking: item?.aliquotTracking, updatedAt: item?.updatedAt, version: item?.version
  });
  const similarity = (a, b) => {
    const A = new Set(tokens(a)), B = new Set(tokens(b));
    if (!A.size || !B.size) return 0;
    const intersection = [...A].filter(word => B.has(word)).length;
    return intersection / (A.size + B.size - intersection);
  };
  const SCORE_ENGINE_VERSION = 3;
  const roundSpec = value => Math.round(value * 1e9) / 1e9;
  function extractSpecifications(item={}) {
    const text=[item.name,item.model,item.variant,item.calibre,item.capacity,item.concentration,item.dimensions].filter(Boolean).join(" ").normalize("NFKC").replace(/μ/g,"µ");
    const specs={volume:[],mass:[],concentration:[],dimension:[],size:[],model:[],wells:[],pieces:[]};
    const add=(type,value,label)=>{if(Number.isFinite(value)&&!specs[type].some(x=>x.value===value))specs[type].push({value:roundSpec(value),label});};
    for(const m of text.matchAll(/(\d+(?:[.,]\d+)?)\s*(µl|ul|ml|cl|litres?|l)\b/gi)){const n=number(m[1]),u=m[2].toLowerCase(),factor={"µl":1,"ul":1,"ml":1000,"cl":10000,"l":1000000,"litre":1000000,"litres":1000000}[u];add("volume",n*factor,`${m[1]} ${m[2]}`);}
    for(const m of text.matchAll(/(\d+(?:[.,]\d+)?)\s*(ng|µg|ug|mg|kg|g)\b/gi)){const n=number(m[1]),u=m[2].toLowerCase(),factor={ng:.001,"µg":1,ug:1,mg:1000,g:1000000,kg:1000000000}[u];add("mass",n*factor,`${m[1]} ${m[2]}`);}
    for(const m of text.matchAll(/(\d+(?:[.,]\d+)?)\s*(nm|µm|um|mm|cm|m)\b/gi)){const n=number(m[1]),u=m[2].toLowerCase(),factor={nm:.000001,"µm":.001,um:.001,mm:1,cm:10,m:1000}[u];add("dimension",n*factor,`${m[1]} ${m[2]}`);}
    for(const m of text.matchAll(/(\d+(?:[.,]\d+)?)\s*(nM|µM|uM|mM|M|%)(?![a-zA-Z])/g)){const n=number(m[1]),u=m[2],factor={nM:1,"µM":1000,uM:1000,mM:1000000,M:1000000000,"%":1}[u];add("concentration",n*factor,`${m[1]} ${m[2]}`);}
    for(const m of text.matchAll(/(\d+(?:[.,]\d+)?)\s*(mg|µg|ug)\/\s*(ml|l)\b/gi)){const n=number(m[1]),massFactor={mg:1,"µg":.001,ug:.001}[m[2].toLowerCase()],volumeFactor={ml:1,l:1000}[m[3].toLowerCase()];add("concentration",n*massFactor/volumeFactor,`${m[1]} ${m[2]}/${m[3]}`);}
    for(const m of text.matchAll(/\b(?:taille|size)\s*[:\-]?\s*(xs|s|m|l|xl|xxl)\b/gi))add("size",m[1].toUpperCase().charCodeAt(0),m[1].toUpperCase());
    for(const m of text.matchAll(/\b(?:mod[eè]le|model|variante|calibre)\s*[:\-]?\s*([a-z]*\d+[a-z0-9-]*|[a-z]+\d*)\b/gi))add("model",hashSpec(m[1].toLowerCase()),m[1]);
    for(const m of text.matchAll(/(\d+)\s*(?:puits|wells?)\b/gi))add("wells",number(m[1]),`${m[1]} puits`);
    for(const m of text.matchAll(/(\d+)\s*(?:pi[eè]ces?|pieces?|pcs?)\s*(?:\/\s*(?:bo[iî]te|box))?/gi))add("pieces",number(m[1]),`${m[1]} pièces/boîte`);
    return specs;
  }
  function hashSpec(value){let hash=0;for(const char of value)hash=((hash<<5)-hash)+char.charCodeAt(0);return hash|0;}
  function compareSpecifications(a,b){
    const A=extractSpecifications(a),B=extractSpecifications(b),contradictions=[],matches=[];
    ["volume","mass","concentration","dimension","size","model","wells"].forEach(type=>{
      if(!A[type].length||!B[type].length)return;
      const common=A[type].filter(x=>B[type].some(y=>x.value===y.value));
      if(common.length)matches.push(...common.map(x=>({type,label:x.label})));
      else contradictions.push({type,a:A[type].map(x=>x.label).join(", "),b:B[type].map(x=>x.label).join(", ")});
    });
    const packagingComparable=A.pieces.length&&B.pieces.length;
    const packagingCompatible=Boolean(packagingComparable&&A.pieces.some(x=>B.pieces.some(y=>x.value===y.value)));
    const packagingContradiction=Boolean(packagingComparable&&!packagingCompatible);
    return{matches,contradictions,packagingCompatible,packagingContradiction,specsA:A,specsB:B};
  }
  function confidenceFromScore(score){return score>=85?"Très élevée":score>=65?"Élevée":score>=40?"Moyenne":score>=21?"Faible":"Non affiché";}
  function scoreDuplicatePair(a,b){
    const positive=[],differences=[],terms=[];let raw=0;
    const add=(points,label)=>{raw+=points;terms.push(points);positive.push(`${label} : +${points}`);};
    const subtract=(points,label)=>{raw-=points;terms.push(-points);differences.push(`${label} : −${points}`);};
    const normA=normalize(a.name),normB=normalize(b.name),sim=similarity(a.name,b.name),exact=Boolean(normA&&normA===normB);
    const common=tokens(a.name).filter((x,i,list)=>list.indexOf(x)===i&&tokens(b.name).includes(x));
    const strong=!exact&&sim>=.72&&common.length>=2;
    if(exact)add(45,"Nom normalisé strictement identique");else if(strong)add(30,`Noms fortement similaires (${Math.round(sim*100)} %)`);
    const refsA=refs(a),refsB=refs(b),sharedRefs=refsA.filter(x=>refsB.includes(x));
    if(sharedRefs.length)add(35,`Même référence réelle (${sharedRefs.join(", ")})`);
    else if(refsA.length&&refsB.length)subtract(10,`Références différentes : ${refsA.join(", ")} ≠ ${refsB.join(", ")}`);
    const spec=compareSpecifications(a,b);
    if(spec.matches.length&&!spec.contradictions.length)add(20,"Spécifications essentielles identiques");
    spec.contradictions.forEach(c=>subtract(60,`${specLabel(c.type)} différente : ${c.a} ≠ ${c.b}`));
    const supplierA=supplier(a),supplierB=supplier(b);if(supplierA&&supplierB&&supplierA===supplierB)add(10,"Même fournisseur ou fabricant");
    const subA=normalize(a.subcategory||a.subCategory),subB=normalize(b.subcategory||b.subCategory);
    if(a.category&&b.category&&a.category===b.category&&subA&&subB&&subA===subB)add(5,"Même catégorie et même sous-catégorie");
    else if(a.category&&b.category&&a.category!==b.category)differences.push("Incohérence à vérifier : catégories différentes");
    const unitA=normalize(a.unit),unitB=normalize(b.unit);
    if(spec.packagingCompatible)add(5,"Conditionnement compatible");
    else if(unitA&&unitB&&unitA===unitB)add(5,"Unité compatible");
    if(spec.packagingContradiction)subtract(15,`Conditionnements commerciaux incompatibles : ${spec.specsA.pieces.map(x=>x.label).join(", ")} ≠ ${spec.specsB.pieces.map(x=>x.label).join(", ")}`);
    const rawScore=raw,bounded=Math.max(0,Math.min(100,rawScore)),capped=spec.contradictions.length>0&&bounded>25,score=capped?25:bounded;
    return{score,confidence:confidenceFromScore(score),positive,differences,terms,rawScore,boundedScore:bounded,capped,capReason:capped?"Score plafonné à 25 % en raison d’une spécification essentielle contradictoire":"",nameSimilarity:Math.round(sim*100),specifications:spec};
  }
  function specLabel(type){return({volume:"Capacité ou volume",mass:"Masse",concentration:"Concentration",dimension:"Dimension",size:"Taille",model:"Modèle ou variante",wells:"Nombre de puits"})[type]||type;}
  function alert(type, severity, itemIds, explanation, observed, recommendation, confidence = "", details = {}) {
    return { id: uid("alert"), type, severity, confidence, itemIds, explanation, observed, recommendation, state: "pending", ...details };
  }
  function audit(input, options = {}) {
    const started = Date.now(), items = clone(input?.items || []), orders = clone(input?.orders || []), contactsProvided=Array.isArray(input?.contacts),contacts=clone(input?.contacts || []);
    const validLocations = new Set(input?.locations || []), validCategories = new Set(input?.categories || []);
    const scope = options.scope || "full", out = [], indexed = items.map(item => ({ item, norm: normalize(item.name), key: tokenKey(item.name), refs: refs(item), supplier: supplier(item) }));
    const byRef = new Map();
    indexed.forEach(row => row.refs.forEach(ref => { if (!byRef.has(ref)) byRef.set(ref, []); byRef.get(ref).push(row); }));
    const duplicatePairs = [];
    if (["full", "duplicates", "references"].includes(scope)) {
      const pairs = new Map();
      indexed.forEach((left, i) => indexed.slice(i + 1).forEach(right => {
        if(!left.item.id || !right.item.id || left.item.id===right.item.id)return;
        const pairIds=[left.item.id,right.item.id].sort(),pair=pairIds.join("|");
        if (pairs.has(pair)) return;
        const result=scoreDuplicatePair(left.item,right.item);if(result.score<=20)return;
        const value=alert("Doublon potentiel","warning",pairIds,"Score unique calculé à partir des caractéristiques d’identité.",result.positive.join(" ; "),"",result.confidence,{reasons:result.positive,confidenceScore:result.score,duplicateScore:result.score,scoreDetails:result,auditScope:"duplicates"});
        pairs.set(pair,value);duplicatePairs.push(value);
      }));
      if(scope==="full"||scope==="duplicates")out.push(...duplicatePairs);
      if(scope==="references")duplicatePairs.forEach(value=>{
        const [left,right]=value.itemIds.map(id=>items.find(item=>item.id===id)),refA=meaningfulPrimaryReference(left),refB=meaningfulPrimaryReference(right);
        if(refA&&refB&&refA!==refB)out.push({...value,id:uid("alert"),type:"Doublon potentiel avec références différentes",explanation:`Doublon potentiel avec références différentes : ${primaryReferenceValue(left)} ≠ ${primaryReferenceValue(right)}`,observed:`${primaryReferenceValue(left)} ≠ ${primaryReferenceValue(right)}`,auditScope:"references",referenceCriterion:"different-duplicates"});
      });
    }
    indexed.forEach(({ item }) => {
      if (!passesFilters(item, options)) return;
      const quantityAbsent=isAbsent(item.quantity),quantity=quantityAbsent?NaN:number(item.quantity);
      const minimumRaw = item.minimum ?? item.minStock;
      if (["full", "stock"].includes(scope)) {
        const issues=[],minimumAbsent=isAbsent(minimumRaw),minimum=minimumAbsent?NaN:number(minimumRaw);
        if(quantityAbsent)issues.push("Quantité de stock non renseignée");
        else if(!Number.isFinite(quantity))issues.push("Quantité de stock non numérique");
        else if(quantity<0)issues.push("Quantité de stock négative");
        if(minimumAbsent)issues.push("Seuil de stock non renseigné");
        else if(!Number.isFinite(minimum))issues.push("Seuil de stock non numérique");
        else if(minimum<0)issues.push("Seuil de stock négatif");
        const tracking = item.stockTracking;
        if (tracking?.mode === "containers") {
          const closed=Array.isArray(tracking.closedByLocation)?tracking.closedByLocation:[],opened=Array.isArray(tracking.openContainers)?tracking.openContainers:[],levels=Array.isArray(tracking.packagingLevels)?tracking.packagingLevels:[];
          closed.forEach(row=>{if(!isAbsent(row.quantity)&&Number.isFinite(number(row.quantity))&&number(row.quantity)<0)issues.push("Nombre de contenants négatif");});
          opened.filter(row=>row.status!=="finished").forEach(row=>{
            if(!isAbsent(row.remaining)&&Number.isFinite(number(row.remaining))&&number(row.remaining)<0)issues.push("Quantité restante négative");
            if(!isAbsent(row.remaining)&&!isAbsent(row.capacity)&&Number.isFinite(number(row.remaining))&&Number.isFinite(number(row.capacity))&&number(row.remaining)>number(row.capacity))issues.push("Quantité restante supérieure à la capacité du contenant");
          });
          if(Number.isFinite(quantity)){
            const detailComplete=levels.length>0&&closed.every(row=>!isAbsent(row.quantity)&&Number.isFinite(number(row.quantity)))&&opened.filter(row=>row.status!=="finished").every(row=>!isAbsent(row.remaining)&&!isAbsent(row.capacity)&&Number.isFinite(number(row.remaining))&&Number.isFinite(number(row.capacity))&&number(row.capacity)>0);
            const stockApi=input?.stockTrackingApi,outer=levels[0],itemUnit=stockApi?.normalizeUnitLabel?.(item.unit),outerUnit=stockApi?.normalizeUnitLabel?.(outer?.singular||outer?.plural||outer?.key);
            if(!stockApi?.available)issues.push("Impossible de vérifier la cohérence du stock : détail incomplet");
            else if(itemUnit&&outerUnit&&itemUnit.key!==outerUnit.key)issues.push("Impossible de vérifier la cohérence du stock : unités incompatibles");
            else if(!detailComplete)issues.push("Impossible de vérifier la cohérence du stock : détail incomplet");
            else {
              const calculated=stockApi.available(item),tolerance=Math.max(.01,Math.abs(calculated)*.005);
              if(!Number.isFinite(calculated))issues.push("Impossible de vérifier la cohérence du stock : détail incomplet");
              else if(Math.abs(quantity-calculated)>tolerance)issues.push(`Stock global incohérent avec le détail des contenants : ${quantity} enregistré, ${calculated} calculé${item.unit?` ${item.unit}`:""}`);
            }
          }
        } else if (tracking && ((tracking.closedByLocation?.length||0)||(tracking.openContainers?.length||0))) issues.push("Données de contenants présentes alors que le suivi détaillé est désactivé");
        if(issues.length)out.push(alert("Stocks et seuils","warning",[item.id],issues.join(" · "),issues.join(" ; "),"Examiner la fiche.", "",{reasons:issues,auditScope:"stock"}));
      }
      if (["full", "references"].includes(scope)) {
        const currentReference=primaryReferenceValue(item);
        if(isAbsent(currentReference))out.push(alert("Référence principale non renseignée","warning",[item.id],"Référence principale non renseignée","vide","Renseigner la référence principale.","",{auditScope:"references",referenceCriterion:"missing"}));
        else if(contactsProvided){
          const contact=findContactForItem(item,contacts),currentNormalized=normalizeContactReference(currentReference),supplierName=supplierValue(item);
          if(!contact){
            const reason=supplierName
              ? `Aucun Contact correspondant au fournisseur ${supplierName} n’a été trouvé. La référence ${String(currentReference).trim()} ne peut pas être vérifiée dans Contacts.`
              : `Aucun fournisseur n’est renseigné pour cet Agent. La référence ${String(currentReference).trim()} ne peut pas être vérifiée dans Contacts.`;
            out.push(alert("Référence non enregistrée dans les Contacts","warning",[item.id],reason,String(currentReference).trim(),"Enregistrer la référence dans la fiche Contact du fournisseur.","",{auditScope:"references",referenceCriterion:"unregistered-contact",reasons:[reason],reference:String(currentReference).trim(),supplier:supplierName,contactId:"",contactCompany:""}));
          }else if(!contactReferences(contact,items,contacts).has(currentNormalized)){
            const company=String(contact.company||contact.society||supplierName).trim(),reason=`La référence ${String(currentReference).trim()} de cet Agent n’est pas enregistrée dans la fiche Contact de ${company}.`;
            out.push(alert("Référence non enregistrée dans les Contacts","warning",[item.id],reason,String(currentReference).trim(),"Enregistrer la référence dans la fiche Contact du fournisseur.","",{auditScope:"references",referenceCriterion:"unregistered-contact",reasons:[reason],reference:String(currentReference).trim(),supplier:supplierName,contactId:contact.id||"",contactCompany:company}));
          }
        }
      }
    });
    const summary=summarize(out),scopeSummary={duplicates:out.filter(row=>row.auditScope==="duplicates").length,stock:out.filter(row=>row.auditScope==="stock").length,references:out.filter(row=>row.auditScope==="references").length};
    const referenceRows=out.filter(row=>row.auditScope==="references"),referenceSummary={differentDuplicates:referenceRows.filter(row=>row.referenceCriterion==="different-duplicates").length,missing:referenceRows.filter(row=>row.referenceCriterion==="missing"||row.type==="Référence principale non renseignée").length,unregisteredInContacts:referenceRows.filter(row=>row.referenceCriterion==="unregistered-contact").length,total:referenceRows.length,uniqueItemCount:new Set(referenceRows.flatMap(row=>row.itemIds||[])).size};
    return { id: uid("audit"), auditType:scope, rulesVersion: SCORE_ENGINE_VERSION, scoreEngine:"duplicate-score-v3", scope, createdAt: new Date().toISOString(), durationMs: Date.now() - started, itemCount: items.length, alerts: out, summary, scopeSummary,referenceSummary };
  }
  function passesFilters(item, options) {
    if (options.category && options.category !== "all" && item.category !== options.category) return false;
    if (options.location && options.location !== "all" && !locations(item).includes(options.location)) return false;
    if (options.supplier && options.supplier !== "all" && supplier(item) !== normalize(options.supplier)) return false;
    if (options.usage && options.usage !== "all" && normalize(item.usageProfile || item.usage || item.inventoryType || "normal") !== normalize(options.usage)) return false;
    return true;
  }
  function summarize(alerts) {
    return {
      critical: alerts.filter(row => row.severity === "critical").length,
      warnings: alerts.filter(row => row.severity === "warning").length,
      info: alerts.filter(row => row.severity === "info").length,
      duplicates: alerts.filter(row => row.type.includes("Doublon") || row.type.includes("Référence partagée")).length
    };
  }
  function matchItem(line, items) {
    const text = line?.text || "", reference = normalize(line?.reference), normalized = normalize(line?.name || text);
    const ranked = items.map(item => {
      let score = 0, reasons = [];
      if (reference && refs(item).includes(reference)) { score += .72; reasons.push("référence identique"); }
      const name = normalize(item.name);
      if (normalized && name === normalized) { score += .9; reasons.push("nom exact"); }
      else {
        const sim = similarity(normalized, name);
        score += sim * .65;
        if (sim >= .55) reasons.push(`nom similaire (${Math.round(sim * 100)} %)`);
      }
      if (line?.supplier && supplier(item) === normalize(line.supplier)) { score += .12; reasons.push("fournisseur identique"); }
      if (line?.location && locations(item).some(loc => normalize(loc).includes(normalize(line.location)))) { score += .08; reasons.push("localisation cohérente"); }
      return { itemId: item.id, name: item.name, score: Math.min(1, score), reasons };
    }).filter(row => row.score >= .20).sort((a, b) => b.score - a.score).slice(0, 5);
    if (!ranked.length) return { status: normalized ? "not_found" : "unparsed", candidates: [] };
    if (ranked[0].score >= .88 && (!ranked[1] || ranked[0].score - ranked[1].score >= .18)) return { status: "certain", itemId: ranked[0].itemId, candidates: ranked };
    if (ranked[0].score >= .58 && (!ranked[1] || ranked[0].score - ranked[1].score >= .12)) return { status: "probable", itemId: ranked[0].itemId, candidates: ranked };
    return { status: "ambiguous", candidates: ranked };
  }
  function parseFreeText(text) {
    return String(text ?? "").split(/\r?\n/).map((raw, index) => ({ raw, index })).filter(row => row.raw.trim()).map(row => {
      const raw = row.raw.trim();
      const move = raw.match(/(?:les?\s+)?(.+?)\s+(?:sont|est)\s+maintenant\s+(?:dans|à)\s+(.+?)[.!]?$/i);
      if (move) return { id: uid("line"), raw, text: move[1], name: move[1], action: "move", location: move[2].replace(/[.!]$/, ""), parsed: true };
      const named = raw.match(/^(.+?)\s*:\s*(.+)$/);
      if (!named) return { id: uid("line"), raw, text: raw, parsed: false };
      const detail = named[2], closed = detail.match(/(\d+)\s+(?:bo[iî]tes?|contenants?)\s+ferm/i), opened = detail.match(/(?:une|1)\s+(?:bo[iî]te|contenant)\s+ouverte?.*?(\d+(?:[.,]\d+)?)\s*(\w+)?/i);
      const aliquots = detail.match(/(\d+)\s+aliquotes?\s+ferm/i), openAliquot = detail.match(/(?:une|1)\s+aliquote\s+ouverte?\s+de\s+(\d+(?:[.,]\d+)?)\s*(µl|ul|ml)?/i);
      return { id: uid("line"), raw, text: named[1], name: named[1], action: aliquots ? "aliquots" : closed ? "containers" : "count", closed: closed ? number(closed[1]) : null, openRemaining: opened ? number(opened[1]) : null, openUnit: opened?.[2] || "", aliquots: aliquots ? number(aliquots[1]) : null, openAliquotVolume: openAliquot ? number(openAliquot[1]) : null, openAliquotUnit: openAliquot?.[2] || "", parsed: Boolean(closed || opened || aliquots || openAliquot) };
    });
  }
  function createSession(data = {}) {
    const now = new Date().toISOString();
    return { id: uid("physical"), name: data.name || `Inventaire du ${new Date().toLocaleDateString("fr-FR")}`, author: data.author || "", createdAt: now, updatedAt: now, readAt: now, scope: data.scope || "full", location: data.location || "", category: data.category || "", notes: data.notes || "", originalText: data.originalText || "", status: "Brouillon", lines: [], proposals: [], decisions: [], report: null };
  }
  function buildProposals(session, items) {
    return (session.lines || []).map(line => {
      const match = line.match || matchItem(line, items), item = items.find(row => row.id === match.itemId);
      const base = { id: uid("proposal"), lineId: line.id, itemId: item?.id || "", itemName: item?.name || line.name || line.text, matchStatus: match.status, candidates: match.candidates || [], confidence: match.status === "certain" ? "Élevée" : match.status === "probable" ? "Moyenne" : "Faible", decision: "pending", valid: false, conflict: null };
      if (!item || !["certain", "probable"].includes(match.status)) return { ...base, action: "none", reason: "Correspondance à résoudre." };
      const tracking = item.stockTracking || {};
      let operation = null, afterLabel = "";
      if (line.action === "move" && line.location) { operation = { type: "item_location_recount", toLocation: line.location }; afterLabel = line.location; }
      else if (line.action === "containers") {
        if (tracking.mode !== "containers") return { ...base, action: "none", reason: "Le suivi détaillé des contenants n’est pas actif." };
        operation = { type: "physical_containers_recount", closed: line.closed, openRemaining: line.openRemaining, location: session.location || item.location }; afterLabel = `${line.closed ?? "—"} fermé(s), ouvert ${line.openRemaining ?? "—"}`;
      } else if (line.action === "aliquots") {
        if (item.aliquotTracking?.enabled === false || !item.aliquotTracking) return { ...base, action: "none", reason: "Le module aliquotes n’est pas actif." };
        operation = { type: "physical_aliquots_recount", quantity: line.aliquots, openVolume: line.openAliquotVolume, location: session.location || item.location }; afterLabel = `${line.aliquots} aliquote(s)`;
      } else {
        const quantity = number(line.quantity);
        if (!Number.isFinite(quantity)) return { ...base, action: "none", reason: "Quantité non comprise." };
        operation = { type: "physical_stock_recount", quantity }; afterLabel = `${quantity} ${item.unit || ""}`.trim();
      }
      return { ...base, action: operation.type, operation, conflictBasis: conflictFields(item, operation.type), beforeValue: item.quantity, afterValue: afterLabel, readAt: new Date().toISOString(), valid: match.status === "certain" };
    });
  }
  function detectConflict(proposal, latestItem) {
    if (!latestItem) return { conflict: true, reason: "Item supprimé depuis l’analyse." };
    const current = conflictFields(latestItem, proposal.action);
    return JSON.stringify(current) === JSON.stringify(proposal.conflictBasis) ? { conflict: false } : { conflict: true, reason: "L’item a été modifié depuis l’analyse.", expected: proposal.conflictBasis, current };
  }
  function conflictFields(item, action) {
    const common={id:item?.id,version:item?.version??null,updatedAt:item?.updatedAt||""};
    if(action==="physical_stock_recount")return{...common,quantity:item?.quantity};
    if(action==="item_location_recount")return{...common,location:item?.location||"",locations:item?.locations||[]};
    if(action==="physical_containers_recount")return{...common,stockTrackingVersion:item?.stockTracking?.version??null,closedByLocation:item?.stockTracking?.closedByLocation||[],openContainers:(item?.stockTracking?.openContainers||[]).map(x=>({id:x.id,version:x.version,remaining:x.remaining,status:x.status,location:x.location}))};
    if(action==="physical_aliquots_recount")return{...common,preparations:(item?.aliquotTracking?.preparations||[]).map(x=>({id:x.id,version:x.version,locations:x.locations,openAliquots:(x.openAliquots||[]).map(a=>({id:a.id,version:a.version,remainingVolume:a.remainingVolume,status:a.status}))}))};
    return common;
  }
  return { SCORE_ENGINE_VERSION,normalize,normalizeMeaningfulReference,normalizeContactReference,findContactForItem,similarity,extractSpecifications,compareSpecifications,scoreDuplicatePair,confidenceFromScore,audit,matchItem,parseFreeText,createSession,buildProposals,detectConflict,snapshot,clone,summarize };
});
