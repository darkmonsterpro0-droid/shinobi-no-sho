import {ATTRIBUTES,COMBAT,SKILLS} from "./config.mjs";

// Purchased values and current resources are persisted; summary totals are derived.
export function createModels() {
  const f=foundry.data.fields;
  const number=()=>new f.NumberField({required:true,nullable:true,initial:null});
  const text=(initial="")=>new f.StringField({required:true,nullable:false,initial});
  const bool=()=>new f.BooleanField({initial:false});
  const schema=o=>new f.SchemaField(o);
  const resource=()=>schema({value:number(),max:number()});
  const list=o=>new f.ArrayField(schema(o),{initial:[]});
  class ShinobiActorModel extends foundry.abstract.TypeDataModel {
    static defineSchema() { return {
      schemaVersion:new f.NumberField({initial:1,integer:true,min:1}),
      identity:schema({village:text(),rank:text(),clan:text(),concept:text()}),
      campaign:schema({level:number(),experience:new f.NumberField({initial:0,min:0,max:99,integer:true}),draft:new f.BooleanField({initial:true})}),
      automation:schema({enabled:bool(),attributeGranted:number(),forcedDrain:bool(),bases:schema({cc:new f.NumberField({initial:3}),cd:new f.NumberField({initial:3}),esq:new f.NumberField({initial:3}),lm:new f.NumberField({initial:3})}),history:new f.ArrayField(new f.ObjectField(),{initial:[]})}),
      attributes:schema(Object.fromEntries(Object.keys(ATTRIBUTES).map(k=>[k,number()]))),
      combat:schema(Object.fromEntries(Object.keys(COMBAT).map(k=>[k,number()]))),
      skills:schema(Object.fromEntries(Object.keys(SKILLS).map(k=>[k,schema({points:number(),value:number(),trained:bool(),notes:text()})]))),
      resources:schema({vitality:resource(),chakra:resource()}),
      movement:schema({distance:number(),flight:number(),type:text()}),
      social:schema({yin:number(),yang:number(),notes:text()}),
      actions:schema({standard:bool(),movement:bool(),partial:bool(),notes:text()}),
      advancement:schema({attributesAvailable:number(),attributesSpent:number(),skillsAvailable:number(),skillsSpent:number(),powersAvailable:number(),powersSpent:number(),notes:text()}),
      history:text(),notes:text(),
      physical:new f.ObjectField({initial:{size:'medium',temporary:false,bodyHardness:0,camouflage:[]}}),
      powerState:new f.ObjectField({initial:{}}),inventoryState:new f.ObjectField({initial:{}}),
      links:schema({origin:text(),controller:text(),payer:text(),kind:text("Invocação")}),
      structure:schema({hardness:number(),absorption:resource(),slots:text(),notes:text()}),
      conditions:list({id:text(),disabled:bool(),name:text(),source:text(),timing:text("Cena"),duration:text(),notes:text()}),
      special:list({id:text(),name:text(),value:number(),max:number(),source:text(),notes:text()}),
      bonds:list({id:text(),name:text(),kind:text(),location:text(),notes:text()})
    }; }
  }
  class ShinobiItemModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {return {
      schemaVersion:new f.NumberField({initial:1,integer:true,min:1}),
      description:text(),notes:text(),favorite:bool(),catalogKey:text(),catalogBook:text(),selection:text(),active:bool(),sceneUses:number(),
      source:schema({book:text("mesa"),page:text(),version:text(),reference:text()}),
      prerequisites:text(),choices:text(),acquisition:text("Comprada"),level:number(),usedLevel:number(),effects:text(),
      action:text(),cost:text(),range:text(),area:text(),duration:text(),seals:text(),
      quantity:number(),compartments:text(),equipped:bool(),loaded:bool(),damaged:bool(),destroyed:bool(),grip:text(),damageType:text(),damage:text(),critical:text(),properties:text(),
      uses:resource(),hardness:number(),absorption:resource(),slot:text(),availability:text("Registro manual"),
      origin:text(),controller:text(),payer:text(),
      powerData:new f.ObjectField({initial:{}}),inventoryData:new f.ObjectField({initial:{}})
    };}
  }
  return {ShinobiActorModel,ShinobiItemModel};
}
