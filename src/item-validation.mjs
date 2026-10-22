import {ID} from './config.mjs';
import {pointBudgets} from './build-rules.mjs';
import {aptitudeEntry,aptitudeChoices,canonical,prerequisiteStatus,evolutionStatus} from './aptitudes.mjs';
import {WEAPONS} from './weapons.mjs';
export function validatePurchase(actor,item,{previous=null,rules={},isGM=false}={}){
 if(actor.getFlag?.(ID,'clone')&&!previous&&['aptitude','power','technique'].includes(item.type))return ['Clones comuns não adquirem poderes ou aptidões; altere a ficha original.'];
 const items=[...(actor.items??[])].filter(i=>(i.id??i._id)!==(item.id??item._id)),s=item.system??{},old=previous?.system??{},errors=[];
 const list=[...items,item],before=pointBudgets(actor.system,[...items,...(previous?[previous]:[])],rules),after=pointBudgets(actor.system,list,rules);
 if(['power','aptitude'].includes(item.type)&&after.powers.remaining<0&&after.powers.spent>=before.powers.spent)errors.push(`Poderes: ${-after.powers.remaining} ponto(s) excedente(s).`);
 if(item.type==='power'&&s.level!==null&&(!Number.isInteger(s.level)||s.level<0||s.level>after.powers.limit))errors.push(`Poderes: nível entre 0 e ${after.powers.limit}.`);
 if(item.type!=='aptitude'||!s.catalogKey)return errors;
 const entry=aptitudeEntry(s.catalogKey,s.catalogBook);if(!entry)return [...errors,'Aptidão ou fonte desconhecida.'];
 if(rules.banCombatAptitudes&&['especialista','maestria','reflexos','intuicao'].includes(s.catalogKey))errors.push('Esta aptidão está banida nas regras da mesa.');
 const level=Number(s.level??1),limit=evolutionStatus(item,actor.system,items,rules).max;
 if(!Number.isInteger(level)||level<1||level>limit)errors.push(`Esta aptidão permite níveis de 1 a ${limit}.`);
 if(previous&&s.catalogKey!==old.catalogKey)errors.push('A identidade de uma aptidão do catálogo não pode ser trocada.');
 if(previous&&level<Number(old.level??1))errors.push('Use a remoção da aptidão para desfazer uma compra; uma evolução não reduz o nível.');
 if(previous&&level>Number(old.level??1)&&(!evolutionStatus(previous,actor.system,items,rules).allowed||level!==Number(old.level??1)+1))errors.push('Requisitos da próxima evolução não atendidos.');
 if(!previous&&level>1){for(let n=1;n<level;n++)if(!evolutionStatus({...item,system:{...s,level:n}},actor.system,items,rules).allowed){errors.push('Requisitos de evolução não atendidos para o nível solicitado.');break;}}
 if(items.some(i=>i.type==='aptitude'&&canonical(i.system.catalogKey)===canonical(s.catalogKey)&&(i.system.selection??'')===(s.selection??'')))errors.push('Aptidão já adquirida com essa escolha.');
 const choices=aptitudeChoices(entry.key,entry.book,WEAPONS,items);if(choices&&!Object.hasOwn(choices,s.selection??''))errors.push('Selecione uma opção válida para esta aptidão.');
 if(!['Comprada','Gratuita','Concedida'].includes(s.acquisition))errors.push('Aquisição inválida.');
 if(s.acquisition==='Concedida'&&!isGM&&(!previous||old.acquisition!=='Concedida'))errors.push('Somente o mestre concede aptidões.');
 if(s.acquisition==='Gratuita'&&(!entry.free||after.free.spent>3))errors.push('São permitidas três aptidões iniciais gratuitas, dentre as opções elegíveis.');
 const status=prerequisiteStatus({...entry,key:canonical(entry.key)},actor.system,items,rules,s.selection);
 if(s.acquisition!=='Concedida'&&status.allowed===false)errors.push('Pré-requisitos não atendidos: '+entry.requirements);
 if(s.acquisition!=='Concedida'&&status.review&&!isGM)errors.push('Este requisito precisa ser conferido pelo mestre.');
 if(s.catalogKey==='clone'&&s.acquisition!=='Concedida'){
  const power=name=>items.some(i=>i.type==='power'&&i.name.toLowerCase()===name&&Number(i.system.level)>=1);
  if(s.selection==='iwa-bunshin'&&!power('doton'))errors.push('Iwa Bunshin exige Doton 1.');
  if(s.selection==='mizu-bunshin'&&!power('suiton'))errors.push('Mizu Bunshin exige Suiton 1.');
  if(s.selection==='generic-enganador'&&!items.some(i=>i.system.catalogKey==='replica-enganadora'))errors.push('Clone enganador exige Réplica Enganadora.');
 }
 return errors;
}
export function createItemClass(Base){return class ShinobiItem extends Base{
 async _preCreate(data,options,user){if(await super._preCreate(data,options,user)===false)return false;if(this.parent?.constructor.documentName!=='Actor')return;this._validateSNS(this.toObject());}
 async _preUpdate(data,options,user){if(await super._preUpdate(data,options,user)===false)return false;if(this.parent?.constructor.documentName!=='Actor')return;const expanded=foundry.utils.expandObject(data);if(!expanded.system||!['level','selection','acquisition','catalogKey','catalogBook'].some(k=>Object.hasOwn(expanded.system,k)))return;const next=foundry.utils.mergeObject(this.toObject(),expanded,{inplace:false});this._validateSNS(next,this.toObject());}
 _validateSNS(item,previous=null){if(!previous&&this.parent.getFlag?.(ID,'clone')&&item.flags?.[ID]?.replicaOf)return;const rules=game.settings.get(ID,'houseRules')??{},errors=validatePurchase(this.parent,item,{previous,rules,isGM:game.user.isGM});if(errors.length)throw Error(errors.join(' '));}
};}
