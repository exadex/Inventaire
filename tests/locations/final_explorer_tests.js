(() => {
  const results=[],test=(name,value)=>results.push({name,ok:Boolean(value)}),beforeCount=items.length,beforeIds=items.map(item=>item.id),beforeHash=JSON.stringify(items.map(item=>({id:item.id,quantity:item.quantity})));
  activeView="locations";document.querySelectorAll(".view").forEach(view=>view.classList.remove("active"));document.querySelector("#locationsView").classList.add("active");renderLocations();
  test("cartes statistiques entièrement retirées",!document.querySelector("#locationMetrics")&&!document.querySelector("#locationsView")?.textContent.includes("Références localisées")&&!document.querySelector("#locationsView")?.textContent.includes("Salle la plus remplie"));
  const roomIcon=document.querySelector("[data-room-id] .location-explorer-icon"),iconStyle=getComputedStyle(roomIcon);
  test("emoji salle sans cadre",iconStyle.borderTopWidth==="0px"&&iconStyle.backgroundColor==="rgba(0, 0, 0, 0)"&&iconStyle.borderRadius==="0px");
  const subFixture=document.createElement("div");subFixture.innerHTML=hierarchyRow({id:"sub-css",name:"Sous-localisation fixture"},[],"sublocation");document.body.append(subFixture);
  test("sous-localisation avec puce CSS sans emoji",Boolean(subFixture.querySelector(".location-sublocation-marker"))&&!subFixture.textContent.includes("▰"));subFixture.remove();
  test("Copier le chemin absent",!document.querySelector("[data-copy-location-path]")&&!document.querySelector("#locationGrid")?.textContent.includes("Copier le chemin"));
  selectedRoomId=FIXED_INVENTORY_ROOMS[0].id;selectedLocationId=null;selectedSublocationId=null;renderLocations();document.querySelector(".location-path-actions [data-add-hierarchy='item']").click();
  test("création classique ouverte avec salle",dialog.open&&!fields.itemId.value&&readPlacementEditor().some(row=>row.roomId===selectedRoomId&&!row.locationId&&!row.sublocationId));dialog.close();
  const catalog=hierarchyCatalog(),location=catalog.locations[0],sub=catalog.sublocations.find(row=>row.locationId===location?.id);
  if(location){selectedRoomId=location.roomId;selectedLocationId=location.id;selectedSublocationId=sub?.id||null;renderLocations();document.querySelector(".location-path-actions [data-add-hierarchy='item']").click();const placement=readPlacementEditor()[0];test("chemin réel complet ou partiel prérempli",placement.roomId===location.roomId&&placement.locationId===location.id&&placement.sublocationId===(sub?.id||null));dialog.close();}
  const fixtures=Array.from({length:20},(_,index)=>({id:`fixture-${index}`,quantity:index+1,placements:[{id:`p-${index}`,roomId:"room-culture-l1",locationId:"loc",sublocationId:"sub"}]})),ids=fixtures.map(row=>row.id),stocks=fixtures.map(row=>row.quantity),upSub=reparentItemsForHierarchyDeletion(fixtures,"sublocation","sub"),upLoc=reparentItemsForHierarchyDeletion(fixtures,"location","loc");
  test("20 identifiants conservés après remontée sous-localisation",JSON.stringify(upSub.map(row=>row.id))===JSON.stringify(ids));
  test("20 stocks conservés après remontée",JSON.stringify(upSub.map(row=>row.quantity))===JSON.stringify(stocks));
  test("20 items remontés vers localisation",upSub.every(row=>row.placements[0].locationId==="loc"&&row.placements[0].sublocationId===null));
  test("20 items remontés vers salle",upLoc.every(row=>row.placements[0].roomId==="room-culture-l1"&&row.placements[0].locationId===null&&row.placements[0].sublocationId===null));
  test("aucun item réel modifié",items.length===beforeCount&&JSON.stringify(items.map(item=>item.id))===JSON.stringify(beforeIds)&&JSON.stringify(items.map(item=>({id:item.id,quantity:item.quantity})))===beforeHash);
  const failed=results.filter(row=>!row.ok),host=document.createElement("pre");host.id="finalExplorerTestResults";host.textContent=JSON.stringify({passed:results.length-failed.length,failed:failed.length,results},null,2);document.body.append(host);
})();
