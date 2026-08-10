(() => {
  const results=[],test=(name,value)=>results.push({name,ok:Boolean(value)}),api=window.ExadexContacts,contacts=api.getAll(),contact=contacts.find(row=>row.company==="Abcam")||contacts[0],input=fields.primarySupplier,hidden=fields.primarySupplierContactId,beforeCount=items.length,beforeContacts=contacts.length;
  test("propriété canonique company disponible",Boolean(contact?.company&&contact?.id));
  test("égalité exacte reconnue",api.resolveExact(contact.company)?.id===contact.id);
  test("différence de casse refusée",!api.resolveExact(contact.company.toUpperCase()));
  test("différence d’accent refusée",!api.resolveExact("Energie",[{id:"accent",company:"Énergie"}]));
  test("différence d’espace refusée",!api.resolveExact(` ${contact.company}`));
  test("différence de ponctuation refusée",!api.resolveExact("Bio Techne",[{id:"punctuation",company:"Bio-Techne"}]));
  test("correspondance partielle refusée",!api.resolveExact(contact.company.slice(0,-1)));
  test("nom libre conservé",!api.resolveExact("Fournisseur expérimental inexistant"));
  test("doublons exacts non sélectionnés",!api.resolveExact("Doublon",[{id:"a",company:"Doublon"},{id:"b",company:"Doublon"}]));
  input.value=contact.company;input.dispatchEvent(new Event("input"));test("saisie exacte renseigne identifiant réel",hidden.value===contact.id);
  input.value=`${contact.company} France`;input.dispatchEvent(new Event("input"));test("modification incohérente retire identifiant",hidden.value==="");
  const source=items[0],fixture=source?{...JSON.parse(JSON.stringify(source)),id:"supplier-exact-fixture",supplierContactId:undefined,references:{...JSON.parse(JSON.stringify(source.references||{})),primary:{...JSON.parse(JSON.stringify(source.references?.primary||{})),supplier:contact.company}}}:null;
  if(fixture){items.push(fixture);openModal(fixture.id);test("ancienne valeur libre reconnue à l’ouverture",hidden.value===contact.id);test("ouverture sans sauvegarde",items.find(row=>row.id===fixture.id)?.supplierContactId===undefined);dialog.close();items=items.filter(row=>row.id!==fixture.id);}
  test("aucun contact ni item créé",supplierContacts.length===beforeContacts&&items.length===beforeCount);
  const failed=results.filter(row=>!row.ok),host=document.createElement("pre");host.id="supplierExactTestResults";host.textContent=JSON.stringify({passed:results.length-failed.length,failed:failed.length,results},null,2);document.body.append(host);
})();
