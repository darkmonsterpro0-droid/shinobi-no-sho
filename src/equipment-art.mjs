import {ID,ICONS} from './config.mjs';

const illustrated=new Set([
  'aian','antidote','arquebus','arrows','artisan-kit','axe','backpack',
  'battle-armor','belt-pouch','black-salamander','blunderbuss','bolas','bolts','bullets',
  'caltrops','chakram','chokuto','club','common-clothes','debilitating','dizziness',
  'double-sword','drunkenness','earplugs','explosive-tag','fan','flash-bomb','flint',
  'flint-small','fuuma-giant','fuuma-shadow','fuuma-straight','gauntlet','great-axe','great-club',
  'great-sword','hallucinogenic','handcuffs','heavy-crossbow','hidden-blade','hidden-shooter','instrument',
  'interrogation','irritant','itch','jutsu-scroll','katana','kousen','kunai',
  'kusarigama','laboratory-kit','lantern','laxative','lethargic','light-crossbow','long-bow',
  'long-sword','mace','marking-bomb','medicine-kit','minor-debilitating','minor-hallucinogenic','minor-ocular',
  'minor-sleep','minor-weakening','monk-spade','musket','nasal-inflammation','net','ninja-to',
  'ninja-vest','nunchaku','ocular','otsuchi','paralysis','pen','pike',
  'potent-paralysis','rapier','red-death','red-scorpion','reinforced-battle-armor','reinforced-vest','rope',
  'sai','scimitar','scythe','senbon','short-bow','short-sword','shuang-gou',
  'shuriken','sleep','sleeping-bag','smoke-bomb','soldier-pill','spear','special-tag',
  'spiked-chain','staff','strong-drink','superior-debilitating','superior-ocular','superior-sleep','superior-weakening',
  'tachi','tanto','tekko','thunder-bomb','tonfa','tool-kit','travel-ration',
  'war-hammer','weakening','whip','writing-scroll','yari',

]);

export function equipmentArt(key,fallback=ICONS.equipment){
  return illustrated.has(key)?`systems/${ID}/assets/equipment/${key}.webp`:fallback;
}
