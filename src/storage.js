import {defaults,loadIds} from './logic.js';
import {categories,moods} from './metadata.js';
export const STORAGE_KEY='evening-state-v2';
const text=(x,max)=>typeof x==='string'&&x.trim().length>0&&x.length<=max;
const validArray=(x,allowed)=>Array.isArray(x)&&x.length>0&&x.every(v=>allowed.includes(v));
export function validateActivity(a) {
 const errors={};if(!a||typeof a!=='object'||Array.isArray(a))return {valid:false,errors:{record:'Потрібен об’єкт заняття.'}};
 if(!text(a.id,100)||!/^[-\w]+$/.test(a.id))errors.id='Некоректний ідентифікатор.';
 if(!text(a.title,160))errors.title='Вкажіть назву до 160 символів.';
 if(!text(a.description,1200))errors.description='Додайте опис до 1200 символів.';
 if(!Object.hasOwn(categories,a.category))errors.category='Оберіть категорію.';
 if(!Number.isInteger(a.duration)||a.duration<=0||a.duration>10080)errors.duration='Вкажіть цілу кількість хвилин від 1 до 10080.';
 if(!Number.isFinite(a.cost)||a.cost<0||a.cost>1000000||Math.abs(a.cost*100-Math.round(a.cost*100))>1e-7)errors.cost='Вкажіть бюджет від 0 до 1 000 000 грн, не більше двох знаків після коми.';
 if(!validArray(a.company,['solo','duo','group']))errors.company='Оберіть хоча б один формат компанії.';
 if(!validArray(a.places,['home','outside']))errors.places='Оберіть хоча б одне місце.';
 if(!validArray(a.moods,Object.keys(moods)))errors.moods='Оберіть хоча б один настрій.';
 if(![1,2,3].includes(a.energy))errors.energy='Оберіть потрібний рівень енергії.';
 if(a.things!==undefined&&(!Array.isArray(a.things)||a.things.length>30||!a.things.every(s=>text(s,200))))errors.things='До 30 речей, кожна до 200 символів.';
 if(!Array.isArray(a.steps)||a.steps.length<1||a.steps.length>6||!a.steps.every(s=>text(s,500)))errors.steps='Додайте від 1 до 6 кроків, кожен до 500 символів.';
 return {valid:!Object.keys(errors).length,errors};
}
export function normalizeActivity(a) {return {id:a.id,title:a.title.trim(),description:a.description.trim(),category:a.category,duration:a.duration,cost:a.cost,company:[...new Set(a.company)],places:[...new Set(a.places)],moods:[...new Set(a.moods)],energy:a.energy,things:(a.things||[]).map(s=>s.trim()),steps:a.steps.map(s=>s.trim()),similar:[],complements:[],custom:true};}
export function previewImport(raw,existing=[]) {
 let parsed;try{parsed=JSON.parse(raw);}catch{return {error:'Не вдалося прочитати JSON. Перевірте файл.',added:[],skipped:0,invalid:0};}
 const rows=Array.isArray(parsed)?parsed:parsed&&parsed.version===2&&Array.isArray(parsed.activities)?parsed.activities:null;
 if(!rows)return {error:'Очікується масив занять або експорт бібліотеки версії 2.',added:[],skipped:0,invalid:0};
 const ids=new Set(existing.map(a=>a.id));const result={added:[],skipped:0,invalid:0};
 for(const a of rows){if(!validateActivity(a).valid){result.invalid++;continue;}if(ids.has(a.id)){result.skipped++;continue;}ids.add(a.id);result.added.push(normalizeActivity(a));}
 return result;
}
export function normalizeFilters(raw={}) {
 const result={...defaults};
 for(const key of ['time','budget','energy']) {const allowed={time:[30,60,120],budget:[0,200,500],energy:[1,2,3]}[key];if(allowed.includes(raw?.[key]))result[key]=raw[key];}
 for(const [key,allowed] of [['company',['any','solo','duo','group']],['place',['any','home','outside']],['mood',['any',...Object.keys(moods)]]])if(allowed.includes(raw?.[key]))result[key]=raw[key];
 return result;
}
export function initialState(){return {version:2,favorites:[],excluded:[],custom:[],history:[],plan:{mainId:null,ids:[]},settings:{includeCustom:true,ownOnly:false,filters:{...defaults},groupFilters:{...defaults},participantNames:['','']},active:null};}
export function validateActive(a) {
 if(!a||typeof a!=='object'||typeof a.id!=='string'||a.id.length>100||!Array.isArray(a.items)||!a.items.length||!a.items.every(x=>validateActivity(x).valid)||!Number.isInteger(a.index)||a.index<0||a.index>a.items.length||!Array.isArray(a.statuses)||a.statuses.length!==a.items.length||!a.statuses.every(x=>['pending','done','skipped'].includes(x)))return null;
 if(a.statuses.slice(0,a.index).some(x=>x==='pending')||a.statuses.slice(a.index+1).some(x=>x!=='pending'))return null;
 const checks=Array.isArray(a.checks)?a.items.map((item,i)=>item.steps.map((_,j)=>a.checks[i]?.[j]===true)):a.items.map(x=>x.steps.map(()=>false));
 const timer=a.timer&&Number.isFinite(a.timer.remaining)&&a.timer.remaining>=0&&(a.timer.endAt===null||Number.isFinite(a.timer.endAt))?a.timer:{remaining:(a.items[a.index]?.duration||0)*60000,endAt:null};
 return {id:a.id,items:a.items,statuses:a.statuses,index:a.index,checks,timer};
}
export function loadState(storage,builtins) {
 const state=initialState();let raw=null,warning='';
 try{const saved=storage.getItem(STORAGE_KEY);if(saved!==null){try{raw=JSON.parse(saved);}catch{warning='Пошкоджене збереження не завантажено. Попередні обране та виключення відновлено, якщо вони доступні.';}}}catch{warning='Сховище недоступне. Зміни працюватимуть лише в поточному сеансі.';}
 const builtinIds=new Set(builtins.map(a=>a.id));
 if(raw?.version===2){
  if(Array.isArray(raw.custom))state.custom=previewImport(JSON.stringify(raw.custom),builtins).added;
  const validIds=new Set([...builtinIds,...state.custom.map(a=>a.id)]);
  for(const key of ['favorites','excluded'])if(Array.isArray(raw[key]))state[key]=[...new Set(raw[key].filter(id=>validIds.has(id)))];
  if(Array.isArray(raw.history)){
   const tokens=new Set();
   state.history=raw.history.filter(h=>h&&text(h.token,200)&&text(h.id,200)&&!tokens.has(h.token)&&Number.isFinite(Date.parse(h.date))&&validateActivity(h.activity).valid&&(tokens.add(h.token),true)).map(h=>({...h,rating:['like','dislike'].includes(h.rating)?h.rating:null})).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
  }
  if(raw.plan&&Array.isArray(raw.plan.ids)){state.plan.ids=[...new Set(raw.plan.ids.filter(id=>validIds.has(id)))];state.plan.mainId=state.plan.ids.includes(raw.plan.mainId)?raw.plan.mainId:state.plan.ids[0]||null;}
  const s=raw.settings||{};state.settings={includeCustom:s.includeCustom!==false,ownOnly:s.ownOnly===true,filters:normalizeFilters(s.filters),groupFilters:normalizeFilters(s.groupFilters),participantNames:Array.isArray(s.participantNames)&&s.participantNames.length>=2&&s.participantNames.length<=6?s.participantNames.map(n=>typeof n==='string'?n.slice(0,60):''):['','']};
  state.active=validateActive(raw.active);
 }else{
  for(const key of ['favorites','excluded'])state[key]=loadIds(storage,`evening-${key}`,builtinIds);
 }
 return {state,warning};
}
export function persistState(storage,state) {try{storage.setItem(STORAGE_KEY,JSON.stringify(state));return true;}catch{return false;}}
