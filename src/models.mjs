import {ATTRIBUTES,COMBAT,SKILLS} from "./config.mjs";

// No derived game values: the first release is an editable manual sheet.
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
      campaign:schema({level:number(),draft:new f.BooleanField({initial:true})}),
      attributes:schema(Object.fromEntries(Object.keys(ATTRIBUTES).map(k=>[k,number()]))),
      combat:schema(Object.fromEntries(Object.keys(COMBAT).map(k=>[k,number()]))),
      skills:schema(Object.fromEntries(Object.keys(SKILLS).map(k=>[k,schema({value:number(),trained:bool(),notes:text()})]))),
      resources:schema({vitality:resource(),chakra:resource()}),
      movement:schema({distance:number(),type:text()}),
      social:schema({yin:number(),yang:number(),notes:text()}),
      actions:schema({standard:bool(),movement:bool(),partial:bool(),notes:text()}),
      advancement:schema({attributesAvailable:number(),attributesSpent:number(),skillsAvailable:number(),skillsSpent:number(),powersAvailable:number(),powersSpent:number(),notes:text()}),
      history:text(),notes:text(),
      links:schema({origin:text(),controller:text(),payer:text(),kind:text("Invocação")}),
      structure:schema({hardness:number(),absorption:resource(),slots:text(),notes:text()}),
      conditions:list({id:text(),name:text(),source:text(),timing:text("Cena"),duration:text(),notes:text()}),
      special:list({id:text(),name:text(),value:number(),max:number(),source:text(),notes:text()}),
      bonds:list({id:text(),name:text(),kind:text(),location:text(),notes:text()})
    }; }
  }
  class ShinobiItemModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {return {
      schemaVersion:new f.NumberField({initial:1,integer:true,min:1}),
      description:text(),notes:text(),favorite:bool(),
      source:schema({book:text("mesa"),page:text(),version:text(),reference:text()}),
      prerequisites:text(),choices:text(),acquisition:text("Comprada"),level:number(),usedLevel:number(),effects:text(),
      action:text(),cost:text(),range:text(),area:text(),duration:text(),seals:text(),
      quantity:number(),compartments:text(),equipped:bool(),grip:text(),damageType:text(),damage:text(),critical:text(),properties:text(),
      uses:resource(),hardness:number(),absorption:resource(),slot:text(),availability:text("Registro manual"),
      origin:text(),controller:text(),payer:text()
    };}
  }
  return {ShinobiActorModel,ShinobiItemModel};
}
