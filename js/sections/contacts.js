// Section Contacts fournisseurs.
// Ce fichier ne contient que des fonctions : le demarrage est dans bootstrap.js.

function normalizeCompanyName(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function migrateSupplierContacts(list, options = {}) {
  const source=Array.isArray(list)?list:[],seenIds=new Set(),seenNames=new Set(),normalized=[];
  source.forEach((contact,index)=>{
    const company=String(contact?.company||contact?.society||"").trim();if(!company)return;
    let id=String(contact.id||"").trim()||`contact-${Date.now()}-${index}`;while(seenIds.has(id))id=`${id}-${index+1}`;
    const key=normalizeCompanyName(company);if(seenNames.has(key))return;seenIds.add(id);seenNames.add(key);
    const coordinates=(Array.isArray(contact.coordinates)?contact.coordinates:[]).map((row,rowIndex)=>({id:String(row?.id||`coordinate-${rowIndex}`),label:String(row?.label||"").trim(),type:["email","phone","other"].includes(row?.type)?row.type:"other",value:normalizeMultilineText(row?.value||"")})).filter(row=>row.value);
    normalized.push({id,company,salesRepresentative:String(contact.salesRepresentative||"").trim(),afterSalesService:String(contact.afterSalesService||"").trim(),customerService:String(contact.customerService||"").trim(),salesAndQuotes:String(contact.salesAndQuotes||"").trim(),phone:String(contact.phone||"").trim(),notes:normalizeMultilineText(contact.notes||""),aliases:[...new Set((Array.isArray(contact.aliases)?contact.aliases:[]).map(value=>String(value).trim()).filter(Boolean))],coordinates});
  });
  if(options.includeDefaults)INITIAL_SUPPLIER_CONTACTS.forEach(seed=>{if(!seenNames.has(normalizeCompanyName(seed.company))){normalized.push({...seed,aliases:[...seed.aliases]});seenNames.add(normalizeCompanyName(seed.company));}});
  return normalized.sort((a,b)=>a.company.localeCompare(b.company,"fr",{sensitivity:"base"}));
}

function contactNames(contact){return[contact.company,...(contact.aliases||[])].map(normalizeCompanyName).filter(Boolean);}
function exactSupplierContacts(value,contacts=supplierContacts){return contacts.filter(contact=>contact.company===String(value??""));}
function resolveExactSupplierContact(value,preferredId="",contacts=supplierContacts){
  const matches=exactSupplierContacts(value,contacts);
  if(matches.length!==1)return null;
  if(preferredId&&matches[0].id!==preferredId)return null;
  return matches[0];
}
function syncPrimarySupplierContact(){
  if(!fields.primarySupplier||!fields.primarySupplierContactId)return null;
  const value=fields.primarySupplier.value,currentId=fields.primarySupplierContactId.value,current=supplierContacts.find(contact=>contact.id===currentId);
  if(current?.company===value)return current;
  const exact=resolveExactSupplierContact(value);
  fields.primarySupplierContactId.value=exact?.id||"";
  return exact;
}
function getItemSupplier(item){return String(item?.references?.primary?.supplier||item?.supplier||item?.fournisseur||"").trim();}
function findSupplierContactForItem(item){
  if(item?.supplierContactId){const explicit=supplierContacts.find(contact=>contact.id===item.supplierContactId);if(explicit)return explicit;}
  const supplierKey=normalizeCompanyName(getItemSupplier(item));if(!supplierKey)return null;
  return supplierContacts.find(contact=>contactNames(contact).includes(supplierKey))||null;
}
function getContactItems(contact){return items.filter(item=>item.supplierContactId===contact.id||contactNames(contact).includes(normalizeCompanyName(getItemSupplier(item))));}
function contactPrimaryAddress(contact){return contact.customerService||contact.salesAndQuotes||contact.afterSalesService||(contact.coordinates||[]).find(row=>row.type==="email")?.value||"";}
function contactEmails(value){return String(value||"").match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)||[];}
function contactPhones(value){
  const matches=String(value||"").match(/(?:\+?\d[\d\s().-]{6,}\d)/g)||[];
  return matches.map(value=>value.trim()).filter(value=>value.replace(/\D/g,"").length>=7);
}
function isValidContactEmail(value){return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(String(value||"").trim());}
function contactAllValues(contact){
  return [
    {label:"Commercial",value:contact.salesRepresentative,type:"other"},
    {label:"Commercial / devis",value:contact.salesAndQuotes,type:"other"},
    {label:"Service client",value:contact.customerService,type:"other"},
    {label:"SAV",value:contact.afterSalesService,type:"other"},
    {label:"Téléphone",value:contact.phone,type:"phone"},
    ...(contact.coordinates||[]).map(row=>({label:row.label||({email:"E-mail",phone:"Téléphone",other:"Autre coordonnée"}[row.type]),value:row.value,type:row.type}))
  ].filter(row=>String(row.value||"").trim());
}
function contactCountLabel(count){return count===0?"Aucun produit associé":count===1?"1 produit associé":`${count} produits associés`;}
function contactInitial(value){
  return String(value||"").trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").charAt(0).toUpperCase();
}
function renderContactValue(value,type="other"){
  const text=String(value||""),emails=contactEmails(text),phones=contactPhones(text);
  if(type==="email"&&isValidContactEmail(text))return`<a href="mailto:${escapeHtml(text)}">${escapeHtml(text)}</a>`;
  if(type==="phone"&&phones.length===1&&phones[0]===text.trim())return escapeHtml(text);
  let html=escapeHtml(text);
  emails.filter(isValidContactEmail).forEach(email=>{html=html.replace(escapeHtml(email),`<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>`)});
  return html;
}
function contactValueRow(label,value,type="other"){
  if(!String(value||"").trim())return"";
  const emails=contactEmails(value).filter(isValidContactEmail),phones=contactPhones(value),directEmail=type==="email"&&isValidContactEmail(value),directPhone=type==="phone"&&phones.length;
  if(emails.length>1){
    const remainder=String(value).replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,"").replace(/[\s,;|/]+/g,"").trim();
    return`<div class="contact-detail-row"><span>${escapeHtml(label)}</span><div class="contact-multiple-values">${remainder?`<p class="multiline-text">${renderContactValue(value,type)}</p>`:""}${emails.map(email=>`<div><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a><span class="contact-inline-actions"><a class="contact-icon-action" href="mailto:${escapeHtml(email)}" title="Envoyer un e-mail" aria-label="Envoyer un e-mail à ${escapeHtml(email)}">✉</a><button class="contact-icon-action" type="button" data-copy-contact="${escapeHtml(email)}" title="Copier" aria-label="Copier ${escapeHtml(email)}">⧉</button></span></div>`).join("")}</div></div>`;
  }
  if(phones.length>1&&!emails.length){
    const remainder=phones.reduce((text,phone)=>text.replace(phone,""),String(value)).replace(/[\s,;|/]+/g,"").trim();
    return`<div class="contact-detail-row"><span>${escapeHtml(label)}</span><div class="contact-multiple-values">${remainder?`<p class="multiline-text">${renderContactValue(value,type)}</p>`:""}${phones.map(phone=>`<div><span>${escapeHtml(phone)}</span><span class="contact-inline-actions"><button class="contact-icon-action" type="button" data-copy-contact="${escapeHtml(phone)}" title="Copier le numéro" aria-label="Copier ${escapeHtml(phone)}">⧉</button></span></div>`).join("")}</div></div>`;
  }
  return`<div class="contact-detail-row"><span>${escapeHtml(label)}</span><div class="contact-value-content"><strong>${renderContactValue(value,type)}</strong><span class="contact-inline-actions">${(directEmail||emails.length)?`<a class="contact-icon-action" href="mailto:${escapeHtml(directEmail?value:emails[0])}" title="Envoyer un e-mail" aria-label="Envoyer un e-mail">✉</a>`:""}<button class="contact-icon-action" type="button" data-copy-contact="${escapeHtml(value)}" title="${directPhone||phones.length?"Copier le numéro":"Copier"}" aria-label="${directPhone||phones.length?"Copier ce numéro":"Copier cette coordonnée"}">⧉</button></span></div></div>`;
}
function renderContactCoordinateCard(row,index){
  const value=String(row.value||"").trim(),emails=[...new Set(contactEmails(value).filter(isValidContactEmail))],phones=[...new Set(contactPhones(value))];
  let remainder=value;emails.forEach(email=>remainder=remainder.replace(email,""));phones.forEach(phone=>remainder=remainder.replace(phone,""));remainder=remainder.replace(/^[\s,;|/·:–—-]+|[\s,;|/·:–—-]+$/g,"").trim();
  const normalizedLabel=normalizeCompanyName(row.label),icon=normalizedLabel==="commercial"?"👤":normalizedLabel.includes("service client")||normalizedLabel.includes("sav")?"🎧":normalizedLabel.includes("commercial devis")||row.type==="email"?"✉":row.type==="phone"?"☎":"@";
  const values=[
    ...(remainder?[`<div class="contact-coordinate-free-text multiline-text">${escapeHtml(remainder)}</div>`]:[]),
    ...emails.map(email=>`<div class="contact-coordinate-line"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a><span class="contact-inline-actions"><a class="contact-icon-action" href="mailto:${escapeHtml(email)}" title="Envoyer un e-mail" aria-label="Envoyer un e-mail à ${escapeHtml(email)}">✉</a><button class="contact-icon-action" type="button" data-copy-contact="${escapeHtml(email)}" title="Copier" aria-label="Copier ${escapeHtml(email)}">⧉</button></span></div>`),
    ...phones.map(phone=>`<div class="contact-coordinate-line"><span class="contact-phone-text">${escapeHtml(phone)}</span><span class="contact-inline-actions"><button class="contact-icon-action" type="button" data-copy-contact="${escapeHtml(phone)}" title="Copier le numéro" aria-label="Copier ${escapeHtml(phone)}">⧉</button></span></div>`)
  ];
  if(!values.length)values.push(`<div class="contact-coordinate-free-text multiline-text">${escapeHtml(value)}</div>`);
  return`<article class="contact-coordinate-card"><span class="contact-coordinate-icon" aria-hidden="true">${icon}</span><div class="contact-coordinate-card-content"><h4>${escapeHtml(row.label||`Coordonnée ${index+1}`)}</h4><div class="contact-coordinate-values">${values.join("")}</div></div></article>`;
}
function contactCardInitial(value){
  const text=String(value||"").trim(),match=text.match(/[A-ZÀ-ÖØ-Þ0-9]/i);
  return (match?.[0]||text.charAt(0)||"?").toUpperCase();
}
function contactCardAccent(contact){
  const initial=contactCardInitial(contact.company).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase(),code=initial.charCodeAt(0);
  return ((code>=65&&code<=90?code-65:code)||0)%5;
}
function renderContactCardDetails(contact){
  const values=contactAllValues(contact),emails=[...new Set(values.flatMap(row=>contactEmails(row.value).filter(isValidContactEmail)))],phones=[...new Set(values.flatMap(row=>contactPhones(row.value)))],hiddenCount=Math.max(0,emails.length-1)+Math.max(0,phones.length-1);
  const freeValues=[
    {label:"Commercial / devis",value:contact.salesAndQuotes},
    {label:"Service client",value:contact.customerService},
    {label:"SAV",value:contact.afterSalesService},
    ...(contact.coordinates||[]).map(row=>({label:row.label||"Autre coordonnée",value:row.value}))
  ].filter(row=>String(row.value||"").trim()&&!contactEmails(row.value).length&&!contactPhones(row.value).length);
  return`${contact.salesRepresentative?`<div class="contact-card-info contact-card-person"><span aria-hidden="true">👤</span><span>${escapeHtml(contact.salesRepresentative)}</span></div>`:""}${emails[0]?`<div class="contact-card-info"><span aria-hidden="true">✉</span><span class="contact-card-value">${escapeHtml(emails[0])}</span></div>`:""}${phones[0]?`<div class="contact-card-info"><span aria-hidden="true">☎</span><span class="contact-card-value">${escapeHtml(phones[0])}</span></div>`:""}${hiddenCount?`<small class="contact-card-more">+ ${hiddenCount} coordonnée${hiddenCount>1?"s":""} supplémentaire${hiddenCount>1?"s":""}</small>`:""}${!emails.length&&!phones.length?`<p class="contact-card-empty">Aucune coordonnée enregistrée</p>`:""}${freeValues.map(row=>`<div class="contact-card-info contact-card-free"><span>${escapeHtml(row.label)}</span><span class="contact-card-value">${escapeHtml(row.value)}</span></div>`).join("")}`;
}
function renderContactPreviewCard(contact){
  const count=getContactItems(contact).length,details=renderContactCardDetails(contact);
  return`<article class="contact-card contact-accent-${contactCardAccent(contact)}" tabindex="0" role="button" data-contact-id="${escapeHtml(contact.id)}" aria-label="Ouvrir la fiche de ${escapeHtml(contact.company)}"><div class="contact-card-heading"><div class="contact-card-identity"><span class="contact-card-avatar" aria-hidden="true">${escapeHtml(contactCardInitial(contact.company))}</span><h3>${escapeHtml(contact.company)}</h3></div><span class="contact-product-count ${count?"has-products":"no-products"}">${count?`<span aria-hidden="true">📦</span> `:""}${contactCountLabel(count)}</span></div><div class="contact-card-body">${details||`<p class="contact-card-empty">Aucune coordonnée enregistrée</p>`}</div></article>`;
}
function groupContactsByInitial(rows){
  const groups=[],byInitial=new Map();
  rows.forEach(contact=>{const initial=contactCardInitial(contact.company).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase();if(!byInitial.has(initial)){const group={initial,contacts:[]};byInitial.set(initial,group);groups.push(group);}byInitial.get(initial).contacts.push(contact);});
  return groups;
}
function renderContactPreviewGrid(rows){
  return groupContactsByInitial(rows).map(group=>{const accent=contactCardAccent(group.contacts[0]);return`<div class="contact-letter-group contact-accent-${accent}" data-contact-initial="${escapeHtml(group.initial)}"><div class="contact-letter-separator" aria-label="Sociétés commençant par ${escapeHtml(group.initial)}"><span>${escapeHtml(group.initial)}</span><i aria-hidden="true"></i></div>${group.contacts.map(renderContactPreviewCard).join("")}</div>`;}).join("");
}

function renderContacts(){
  const root=document.querySelector("#contactsRoot");if(!root)return;
  const query=normalizeCompanyName(contactsSearchValue),letters="ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),availableLetters=new Set(supplierContacts.map(contact=>contactInitial(contact.company)).filter(letter=>letters.includes(letter)));
  if(selectedContactId){const contact=supplierContacts.find(row=>row.id===selectedContactId);if(contact)return renderContactDetail(root,contact);selectedContactId=null;}
  if(contactsLetterValue&&!availableLetters.has(contactsLetterValue))contactsLetterValue="";
  const hasEmail=contact=>contactAllValues(contact).some(row=>contactEmails(row.value).length||row.type==="email"),hasPhone=contact=>contactAllValues(contact).some(row=>contactPhones(row.value).length||row.type==="phone");
  const rows=supplierContacts.filter(contact=>!query||normalizeCompanyName([contact.company,contact.salesRepresentative,contact.customerService,contact.salesAndQuotes,contact.afterSalesService,contact.phone,contact.notes,(contact.aliases||[]).join(" "),(contact.coordinates||[]).map(row=>`${row.label} ${row.value}`).join(" ")].join(" ")).includes(query)).filter(contact=>!contactsLetterValue||contactInitial(contact.company)===contactsLetterValue).filter(contact=>contactsFilterValue==="all"||(contactsFilterValue==="representative"&&contact.salesRepresentative)||(contactsFilterValue==="email"&&hasEmail(contact))||(contactsFilterValue==="phone"&&hasPhone(contact))||(contactsFilterValue==="no-products"&&!getContactItems(contact).length)).sort((a,b)=>contactsSortValue==="company-desc"?b.company.localeCompare(a.company,"fr",{sensitivity:"base"}):contactsSortValue==="products"?getContactItems(b).length-getContactItems(a).length:a.company.localeCompare(b.company,"fr",{sensitivity:"base"}));
  root.innerHTML=`<header class="client-studies-header contacts-main-header"><div><p class="eyebrow">Carnet fournisseurs</p><div class="client-studies-title-row"><h3 id="contactsTitle">Contacts</h3></div><p class="main-section-subtitle">Retrouvez rapidement les sociétés et leurs coordonnées.</p></div><div class="contacts-header-meta"><span>${supplierContacts.length} société${supplierContacts.length>1?"s":""}</span><button class="primary-btn" type="button" data-add-contact>Ajouter un contact</button></div></header><section class="contacts-toolbar" aria-label="Recherche et filtres"><label class="contacts-search"><span class="sr-only">Rechercher un contact</span><input type="search" id="contactsSearch" placeholder="Rechercher une société, un commercial, un e-mail ou un téléphone…" value="${escapeHtml(contactsSearchValue)}"></label><select id="contactsFilter" aria-label="Filtrer les sociétés"><option value="all">Toutes les sociétés</option><option value="representative">Avec commercial</option><option value="email">Avec e-mail</option><option value="phone">Avec téléphone</option><option value="no-products">Sans produit associé</option></select><select id="contactsSort" aria-label="Trier les sociétés"><option value="company-asc">Société A–Z</option><option value="company-desc">Société Z–A</option><option value="products">Nombre de produits associés</option></select></section><nav class="contacts-alphabet" aria-label="Filtrer les sociétés par initiale"><div><button type="button" data-contact-letter="" class="${contactsLetterValue?"":"active"}" aria-pressed="${contactsLetterValue?"false":"true"}" title="Afficher toutes les sociétés">Toutes</button>${letters.map(letter=>`<button type="button" data-contact-letter="${letter}" class="${contactsLetterValue===letter?"active":""}" aria-label="${availableLetters.has(letter)?`Afficher les sociétés commençant par ${letter}`:`Aucune société commençant par ${letter}`}" title="${availableLetters.has(letter)?`Afficher les sociétés commençant par ${letter}`:`Aucune société commençant par ${letter}`}" aria-pressed="${contactsLetterValue===letter?"true":"false"}" ${availableLetters.has(letter)?"":'disabled aria-disabled="true"'}>${letter}</button>`).join("")}</div></nav><section class="contacts-results-zone"><p class="contacts-results" aria-live="polite">${rows.length} société${rows.length>1?"s":""} trouvée${rows.length>1?"s":""}</p><div class="contacts-list">${renderContactPreviewGrid(rows)||`<div class="agent-empty contacts-empty"><p>Aucune société ne correspond à cette combinaison de filtres.</p><button class="ghost-btn compact-btn" type="button" data-reset-contacts>Réinitialiser les filtres</button></div>`}</div></section>`;
  root.querySelector("[data-add-contact]").onclick=()=>openContactModal();
  root.querySelector("#contactsSearch").oninput=event=>{contactsSearchValue=event.target.value;renderContacts();const input=document.querySelector("#contactsSearch");input?.focus();input?.setSelectionRange(contactsSearchValue.length,contactsSearchValue.length);};
  root.querySelector("#contactsFilter").value=contactsFilterValue;root.querySelector("#contactsFilter").onchange=event=>{contactsFilterValue=event.target.value;renderContacts();};
  root.querySelector("#contactsSort").value=contactsSortValue;root.querySelector("#contactsSort").onchange=event=>{contactsSortValue=event.target.value;renderContacts();};
  root.querySelectorAll("[data-contact-letter]").forEach(button=>button.onclick=()=>{const letter=button.dataset.contactLetter;contactsLetterValue=contactsLetterValue===letter?"":letter;renderContacts();if(contactsLetterValue)requestAnimationFrame(()=>root.querySelector(`[data-contact-letter="${contactsLetterValue}"]`)?.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"}));});
  root.querySelector("[data-reset-contacts]")?.addEventListener("click",()=>{contactsSearchValue="";contactsFilterValue="all";contactsSortValue="company-asc";contactsLetterValue="";renderContacts();});
  root.querySelectorAll("[data-copy-contact]").forEach(button=>button.onclick=event=>{event.stopPropagation();copyContactValue(button.dataset.copyContact,button);});
  root.querySelectorAll(".contact-icon-action").forEach(action=>action.onclick=event=>{event.stopPropagation();if(action.getAttribute("aria-disabled")==="true")event.preventDefault();});
  root.querySelectorAll("[data-contact-id]").forEach(card=>{card.onclick=()=>{selectedContactId=card.dataset.contactId;contactProductsSearchValue="";contactProductsCategoryValue="all";contactProductsSortValue="name-asc";renderContacts();};card.onkeydown=event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();card.click();}};});
}

function renderContactDetail(root,contact){
  const associated=getContactItems(contact),query=normalizeCompanyName(contactProductsSearchValue),categories=[...new Set(associated.map(item=>String(item.category||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"fr",{sensitivity:"base"}));
  if(contactProductsCategoryValue!=="all"&&!categories.includes(contactProductsCategoryValue))contactProductsCategoryValue="all";
  const coordinateCards=[
    {label:"Commercial",value:contact.salesRepresentative,type:"other"},
    {label:"Commercial / devis",value:contact.salesAndQuotes,type:"email"},
    {label:"Service client",value:contact.customerService,type:"email"},
    {label:"SAV",value:contact.afterSalesService,type:"email"},
    ...(contact.coordinates||[]).map(row=>({label:row.label||({email:"E-mail",phone:"Téléphone",other:"Autre coordonnée"}[row.type]),value:row.value,type:row.type}))
  ].filter(row=>String(row.value||"").trim());
  const visibleProducts=associated.filter(item=>(!query||normalizeCompanyName([item.name,item.references?.primary?.reference,item.category].join(" ")).includes(query))&&(contactProductsCategoryValue==="all"||item.category===contactProductsCategoryValue)).sort((a,b)=>contactProductsSortValue==="name-desc"?b.name.localeCompare(a.name,"fr",{sensitivity:"base"}):contactProductsSortValue==="stock-desc"?getStockStatus(b).currentStock-getStockStatus(a).currentStock:a.name.localeCompare(b.name,"fr",{sensitivity:"base"}));
  const practical=[contact.phone?{label:"Téléphone général",value:contact.phone,type:"phone"}:null,contact.notes?{label:"Notes",value:contact.notes,type:"text"}:null].filter(Boolean);
  root.innerHTML=`<button class="agent-back ghost-btn" type="button" data-back-contacts>← Retour aux contacts</button><header class="contact-identity-header"><div class="contact-identity"><span class="contact-avatar" aria-hidden="true">${escapeHtml(contactInitial(contact.company)||"?")}</span><div><h2>${escapeHtml(contact.company)}</h2><p>${contactCountLabel(associated.length)}</p></div></div><div class="contact-header-actions"><button class="primary-btn contact-edit-btn" type="button" data-edit-contact><span aria-hidden="true">✎</span> Modifier</button><button class="danger-btn" type="button" data-delete-contact>Supprimer</button></div></header><section class="contact-coordinates-section"><div class="contact-section-title"><h3>Coordonnées</h3><span>${coordinateCards.length} fonction${coordinateCards.length>1?"s":""} renseignée${coordinateCards.length>1?"s":""}</span></div>${coordinateCards.length?`<div class="contact-coordinate-grid">${coordinateCards.map(renderContactCoordinateCard).join("")}</div>`:`<div class="contact-empty-state contact-empty-card"><p>Aucune coordonnée renseignée</p><button class="ghost-btn compact-btn" type="button" data-edit-contact>Compléter la fiche</button></div>`}</section>${practical.length?`<section class="contact-practical"><h3>Informations pratiques</h3><div>${practical.map(row=>`<article><span>${row.type==="phone"?'<span class="contact-practical-phone-icon" aria-hidden="true">☎️</span> ':""}${escapeHtml(row.label)}</span>${row.type==="phone"?contactValueRow("",row.value,"phone"):`<p class="multiline-text">${escapeHtml(row.value)}</p>`}</article>`).join("")}</div></section>`:""}<section class="contact-products contact-products-table-card"><div class="contact-products-header"><div class="section-heading"><h3>Produits associés</h3><span class="contact-count-badge">${associated.length}</span></div>${associated.length?`<div class="contact-product-controls"><label><span class="sr-only">Rechercher dans les produits associés</span><input type="search" id="contactProductsSearch" placeholder="Rechercher dans les produits associés…" value="${escapeHtml(contactProductsSearchValue)}"></label><select id="contactProductsCategory" aria-label="Filtrer par catégorie"><option value="all">Toutes catégories</option>${categories.map(category=>`<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}</select><select id="contactProductsSort" aria-label="Trier les produits"><option value="name-asc">Nom A–Z</option><option value="name-desc">Nom Z–A</option><option value="stock-desc">Stock décroissant</option></select></div>`:""}</div>${associated.length?`<div class="contact-products-result">${visibleProducts.length} produit${visibleProducts.length>1?"s":""} affiché${visibleProducts.length>1?"s":""}</div><div class="contact-products-table" role="table" aria-label="Produits associés"><div class="contact-products-table-head" role="row"><span role="columnheader">Produit</span><span role="columnheader">Référence</span><span role="columnheader">Stock</span><span aria-hidden="true"></span></div>${visibleProducts.map(item=>{const stock=getStockStatus(item),status=stock.status;return`<button type="button" role="row" data-contact-item="${escapeHtml(item.id)}"><span role="cell"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.category||"Catégorie non renseignée")}</small></span><span role="cell" data-label="Référence">${escapeHtml(item.references?.primary?.reference||"—")}</span><span role="cell" data-label="Stock" class="contact-stock contact-stock-${escapeHtml(status)}"><i aria-hidden="true"></i>${escapeHtml(formatCleanNumber(stock.currentStock))} ${escapeHtml(item.unit||"")}</span><span aria-hidden="true">›</span></button>`;}).join("")||`<div class="contact-empty-state"><p>Aucun produit ne correspond à ces critères.</p></div>`}</div>`:`<div class="contact-empty-state"><p>Aucun produit associé à cette société</p></div>`}</section>`;
  root.querySelectorAll("[data-back-contacts]").forEach(button=>button.onclick=()=>{selectedContactId=null;renderContacts();});
  root.querySelectorAll("[data-edit-contact]").forEach(button=>button.onclick=()=>openContactModal(contact.id));
  root.querySelector("[data-delete-contact]").onclick=event=>requestContactDeletion(contact.id,event.currentTarget);
  root.querySelectorAll("[data-copy-contact]").forEach(button=>button.onclick=()=>copyContactValue(button.dataset.copyContact,button));
  root.querySelectorAll("[data-contact-item]").forEach(button=>button.onclick=()=>openItemDetail(button.dataset.contactItem,{view:"contacts"}));
  const productsSearch=root.querySelector("#contactProductsSearch");if(productsSearch)productsSearch.oninput=event=>{contactProductsSearchValue=event.target.value;renderContactDetail(root,contact);const input=root.querySelector("#contactProductsSearch");input?.focus();input?.setSelectionRange(contactProductsSearchValue.length,contactProductsSearchValue.length);};
  const category=root.querySelector("#contactProductsCategory");if(category){category.value=contactProductsCategoryValue;category.onchange=event=>{contactProductsCategoryValue=event.target.value;renderContactDetail(root,contact);};}
  const sort=root.querySelector("#contactProductsSort");if(sort){sort.value=contactProductsSortValue;sort.onchange=event=>{contactProductsSortValue=event.target.value;renderContactDetail(root,contact);};}
}

function openSupplierContact(id){
  if(!supplierContacts.some(contact=>contact.id===id))return;
  selectedContactId=id;contactProductsSearchValue="";contactProductsCategoryValue="all";contactProductsSortValue="name-asc";activeView="contacts";document.querySelectorAll(".nav-item").forEach(item=>item.classList.toggle("active",item.dataset.view==="contacts"));document.querySelectorAll(".view").forEach(view=>view.classList.remove("active"));document.querySelector("#contactsView")?.classList.add("active");controlBar?.classList.add("hidden");syncAppViewMode();renderContacts();
}

async function copyContactValue(value,button){
  try{await navigator.clipboard.writeText(value);const old=button.textContent;button.textContent="Copié";setTimeout(()=>button.textContent=old,1200);}catch{button.title="Copie impossible dans ce navigateur.";}
}

function openContactModal(id=""){
  const contact=id?supplierContacts.find(row=>row.id===id):null,dialog=document.querySelector("#contactDialog"),form=document.querySelector("#contactForm");
  form.reset();form.dataset.duplicateConfirmed="";document.querySelector("#contactDuplicateWarning").classList.add("hidden");document.querySelector("#contactDialogTitle").textContent=contact?"Modifier le contact":"Ajouter un contact";document.querySelector("#contactId").value=contact?.id||"";document.querySelector("#contactCompany").value=contact?.company||"";document.querySelector("#contactSalesRepresentative").value=contact?.salesRepresentative||"";document.querySelector("#contactAfterSalesService").value=contact?.afterSalesService||"";document.querySelector("#contactCustomerService").value=contact?.customerService||"";document.querySelector("#contactSalesAndQuotes").value=contact?.salesAndQuotes||"";document.querySelector("#contactPhone").value=contact?.phone||"";document.querySelector("#contactAliases").value=(contact?.aliases||[]).join(", ");document.querySelector("#contactNotes").value=contact?.notes||"";renderContactCoordinateEditors(contact?.coordinates||[]);dialog.showModal();
}

function renderContactCoordinateEditors(coordinates=[]){
  const list=document.querySelector("#contactCoordinatesList");if(!list)return;
  list.innerHTML=coordinates.map((row,index)=>`<div class="contact-coordinate-editor" data-coordinate-id="${escapeHtml(row.id||`coordinate-${index}`)}"><label>Libellé<input data-coordinate-label value="${escapeHtml(row.label||"")}" placeholder="Ex. Support technique"></label><label>Type<select data-coordinate-type><option value="email">E-mail</option><option value="phone">Téléphone</option><option value="other">Autre</option></select></label><label>Valeur<textarea data-coordinate-value rows="2" placeholder="Coordonnée ou information libre">${escapeHtml(row.value||"")}</textarea></label><button class="icon-btn" type="button" data-remove-coordinate aria-label="Supprimer cette coordonnée" title="Supprimer">×</button></div>`).join("");
  list.querySelectorAll("[data-coordinate-type]").forEach((select,index)=>select.value=coordinates[index]?.type||"other");
  list.querySelectorAll("[data-remove-coordinate]").forEach(button=>button.onclick=()=>{button.closest(".contact-coordinate-editor").remove();});
}
function similarCompanyContact(company,excludeId=""){
  const key=normalizeCompanyName(company);
  const distance=(a,b)=>{const row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let previous=row[0];row[0]=i;for(let j=1;j<=b.length;j++){const saved=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,previous+(a[i-1]===b[j-1]?0:1));previous=saved;}}return row[b.length];};
  return supplierContacts.find(contact=>contact.id!==excludeId&&contactNames(contact).some(name=>name===key||(Math.min(name.length,key.length)>=6&&distance(name,key)<=1)));
}

async function saveContact(event){
  event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;
  const id=document.querySelector("#contactId").value,company=document.querySelector("#contactCompany").value.trim(),warning=document.querySelector("#contactDuplicateWarning");
  warning.classList.add("hidden");
  if(!company){warning.textContent="La société est obligatoire.";warning.classList.remove("hidden");document.querySelector("#contactCompany").focus();return;}
  const duplicate=similarCompanyContact(company,id);
  if(duplicate&&form.dataset.duplicateConfirmed!==normalizeCompanyName(company)){warning.textContent=`Une fiche « ${duplicate.company} » existe déjà. Vérifiez-la avant de confirmer une seconde fois.`;warning.classList.remove("hidden");form.dataset.duplicateConfirmed=normalizeCompanyName(company);return;}
  const previous=id?supplierContacts.find(contact=>contact.id===id):null,aliases=document.querySelector("#contactAliases").value.split(",").map(value=>value.trim()).filter(Boolean);
  if(previous&&normalizeCompanyName(previous.company)!==normalizeCompanyName(company)&&!aliases.some(alias=>normalizeCompanyName(alias)===normalizeCompanyName(previous.company)))aliases.push(previous.company);
  const coordinates=[...document.querySelectorAll(".contact-coordinate-editor")].map((row,index)=>({id:row.dataset.coordinateId||`coordinate-${Date.now()}-${index}`,label:row.querySelector("[data-coordinate-label]").value.trim(),type:row.querySelector("[data-coordinate-type]").value,value:normalizeMultilineText(row.querySelector("[data-coordinate-value]").value)})).filter(row=>row.value);
  const contact={id:previous?.id||`contact-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,company,salesRepresentative:document.querySelector("#contactSalesRepresentative").value.trim(),afterSalesService:document.querySelector("#contactAfterSalesService").value.trim(),customerService:document.querySelector("#contactCustomerService").value.trim(),salesAndQuotes:document.querySelector("#contactSalesAndQuotes").value.trim(),phone:document.querySelector("#contactPhone").value.trim(),notes:normalizeMultilineText(document.querySelector("#contactNotes").value),aliases:[...new Set(aliases)],coordinates};

  const storage=window.ExadexGithubStorage,config=storage?.getConfig?.();
  if(!storage?.mutateSharedData||!config?.owner||!config?.repo||!config?.token){warning.textContent="La sauvegarde GitHub en écriture est requise pour enregistrer ce contact.";warning.classList.remove("hidden");return;}

  const button=document.querySelector("#saveContactBtn");button.disabled=true;const originalLabel=button.textContent;button.textContent="Enregistrement…";
  try{
    await flushPendingSharedDataBeforeAtomicOperation();
    sharedDataIsSaving=true;renderAlerts();
    const result=await storage.mutateSharedData(`contact-save-${contact.id}-${Date.now()}`, latest => {
      const state=createSharedState(latest,{includeBootstrap:false});
      state.supplierContacts=Array.isArray(state.supplierContacts)?state.supplierContacts:[];
      const exists=state.supplierContacts.some(row=>row.id===contact.id);
      state.supplierContacts=exists?state.supplierContacts.map(row=>row.id===contact.id?contact:row):[...state.supplierContacts,contact];
      state.supplierContacts=migrateSupplierContacts(state.supplierContacts);
      state.history=Array.isArray(state.history)?state.history:[];
      state.history.unshift({date:new Intl.DateTimeFormat("fr-FR",{dateStyle:"short",timeStyle:"short"}).format(new Date()),user:currentName,action:previous?"Contact modifié":"Contact ajouté",detail:`${currentName} a ${previous?"modifié":"ajouté"} le contact ${contact.company}.`});
      return state;
    });
    sharedDataSha=result.sha;sharedDataMode="github-write";sharedDataHasUnsavedChanges=false;sharedDataRemoteReady=true;sharedDataLastError="";
    applySharedState(result.data);initializeSharedSaveCoordinator(result.data,result.sha);
    document.querySelector("#contactDialog").close();selectedContactId=contact.id;renderContacts();renderHistory();hydrateSupplierContactOptions();
  }catch(error){
    warning.textContent=error.message||String(error);warning.classList.remove("hidden");
  }finally{
    sharedDataIsSaving=false;button.disabled=false;button.textContent=originalLabel;renderAlerts();
  }
}

function requestContactDeletion(id,trigger){
  const contact=supplierContacts.find(row=>row.id===id);if(!contact)return;const count=getContactItems(contact).length;
  openDeleteConfirmation({title:`Supprimer définitivement le contact « ${contact.company} » ?`,message:`${count?`${count} item(s) sont associés à cette société. `:""}Les items ne seront pas supprimés et conserveront leur fournisseur sous forme de texte, mais le lien vers cette fiche disparaîtra.`,confirmText:"Supprimer le contact",trigger,onConfirm:async()=>{
    const storage=window.ExadexGithubStorage,config=storage?.getConfig?.();
    if(!storage?.mutateSharedData||!config?.owner||!config?.repo||!config?.token)throw new Error("La sauvegarde GitHub en écriture est requise pour supprimer ce contact.");
    await flushPendingSharedDataBeforeAtomicOperation();
    sharedDataIsSaving=true;renderAlerts();
    try{
      const result=await storage.mutateSharedData(`contact-delete-${id}-${Date.now()}`, latest => {
        const state=createSharedState(latest,{includeBootstrap:false});
        state.supplierContacts=(Array.isArray(state.supplierContacts)?state.supplierContacts:[]).filter(row=>row.id!==id);
        state.history=Array.isArray(state.history)?state.history:[];
        state.history.unshift({date:new Intl.DateTimeFormat("fr-FR",{dateStyle:"short",timeStyle:"short"}).format(new Date()),user:currentName,action:"Contact supprimé",detail:`${currentName} a supprimé le contact ${contact.company}.`});
        return state;
      });
      sharedDataSha=result.sha;sharedDataMode="github-write";sharedDataHasUnsavedChanges=false;sharedDataRemoteReady=true;sharedDataLastError="";
      applySharedState(result.data);initializeSharedSaveCoordinator(result.data,result.sha);
      selectedContactId=null;hydrateSupplierContactOptions();renderContacts();renderHistory();
    }finally{
      sharedDataIsSaving=false;renderAlerts();
    }
  }});
}

function hydrateSupplierContactOptions(){
  const list=document.querySelector("#supplierContactsList");if(!list)return;list.innerHTML=supplierContacts.map(contact=>`<option value="${escapeHtml(contact.company)}"></option>`).join("");
}
