// The adapter supplies affected cells and elevation/cover eligibility for this action.
export function snapshotAreaTargets({sceneId,affectedCells,tokens}) {
  if(!sceneId)throw Error('A seleção de área exige uma cena.');
  const cells=new Set(affectedCells);
  const targets=new Map();
  for(const token of tokens) {
    if(token.sceneId!==sceneId||!token.actorUuid||token.eligible!==true)continue;
    const occupied=[...new Set(token.cells)].filter(cell=>cells.has(cell));
    if(!occupied.length)continue;
    const existing=targets.get(token.tokenUuid);
    if(existing&&existing.actorUuid!==token.actorUuid)throw Error('A identidade do alvo mudou durante a seleção.');
    targets.set(token.tokenUuid,{
      tokenUuid:token.tokenUuid,
      actorUuid:token.actorUuid,
      cells:[...new Set([...(existing?.cells??[]),...occupied])]
    });
  }
  return {sceneId,cells:[...cells],targets:[...targets.values()]};
}
