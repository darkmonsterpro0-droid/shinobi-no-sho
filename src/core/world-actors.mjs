// Unlinked tokens have their own Actor documents and UUIDs even when their
// actorId matches a world Actor. Include those documents in effect cleanup.
export function worldActorDocuments(world=globalThis.game){
 const actors=[...(world?.actors?.contents??world?.actors??[])];
 for(const scene of world?.scenes?.contents??world?.scenes??[])
  for(const token of scene.tokens?.contents??scene.tokens??[])if(!token.actorLink&&token.actor)actors.push(token.actor);
 return [...new Map(actors.filter(Boolean).map(actor=>[actor.uuid??actor,actor])).values()];
}
