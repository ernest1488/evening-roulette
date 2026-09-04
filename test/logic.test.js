import test from 'node:test';
import assert from 'node:assert/strict';
import {activities} from '../src/activities.js';
import {defaults,filterActivities,choose,toggleId,loadIds,saveIds} from '../src/logic.js';
const example = (id,duration,cost) => ({id,duration,cost,company:['solo'],places:['home']});
test('Каталог містить 40+ коректних різноманітних занять',()=>{
 assert.ok(activities.length>=40);assert.equal(new Set(activities.map(a=>a.id)).size,activities.length);
 for(const a of activities){assert.equal(a.steps.length,3);assert.ok(a.title&&a.description&&a.company.length&&a.places.length);assert.ok(a.duration>0&&a.cost>=0);}
});
test('Пороги включні: 30, 60, 120 хв та 0, 200, 500 грн',()=>{
 for(const time of [30,60,120]) for(const budget of [0,200,500]){
  const items=[example('edge',time,budget),example('long',time+1,budget),example('costly',time,budget+1)];
  assert.deepEqual(filterActivities(items,{...defaults,time,budget}).map(a=>a.id),['edge']);
 }
 assert.equal(filterActivities([example('a',20,0),example('b',30,0),example('c',60,0)],{...defaults,time:60}).length,3);
});
test('Усі комбінації фільтрів застосовуються одночасно',()=>{
 for(const time of [Infinity,30,60,120])for(const budget of [Infinity,0,200,500])for(const company of ['any','solo','duo','group'])for(const place of ['any','home','outside']){
 const f={time,budget,company,place};const actual=filterActivities(activities,f,[activities[0].id]);
 const expected=activities.filter(a=>a.id!==activities[0].id&&a.duration<=time&&a.cost<=budget&&(company==='any'||a.company.includes(company))&&(place==='any'||a.places.includes(place)));
 assert.deepEqual(actual,expected);
 }
});
test('Виключення, повернення одного й усіх',()=>{
 const ids=activities.map(a=>a.id);assert.equal(filterActivities(activities,defaults,ids).length,0);
 assert.deepEqual(filterActivities(activities,defaults,ids.slice(1)),[activities[0]]);
 assert.equal(filterActivities(activities,defaults,[]).length,activities.length);
});
test('Випадковий вибір без повтору та з нулем або одним результатом',()=>{
 assert.equal(choose([],null),null);assert.equal(choose([activities[0]],activities[0].id),activities[0]);
 for(let i=0;i<100;i++)assert.notEqual(choose(activities,activities[0].id,()=>i/100).id,activities[0].id);
 assert.equal(choose(activities,null,()=>0),activities[0]);assert.equal(choose(activities,null,()=>.9999),activities.at(-1));
});
test('Обране без дублікатів, незалежне від виключень, відновлюється',()=>{
 const map=new Map();const storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};const id=activities[0].id,valid=new Set([id]);
 let ids=toggleId([],id);saveIds(storage,'fav',ids);saveIds(storage,'excluded',[id]);
 assert.deepEqual(loadIds(storage,'fav',valid),[id]);assert.deepEqual(loadIds(storage,'excluded',valid),[id]);
 assert.deepEqual(toggleId(ids,id),[]);
 map.set('fav',JSON.stringify([id,id,99,'unknown']));assert.deepEqual(loadIds(storage,'fav',valid),[id]);
});
test('Пошкоджене та недоступне сховище не спричиняє аварії',()=>{
 for(const raw of ['{broken','null','{}','42','"str"'])assert.deepEqual(loadIds({getItem:()=>raw},'fav',new Set()),[]);
 const unavailable={getItem(){throw Error();},setItem(){throw Error();}};
 assert.deepEqual(loadIds(unavailable,'fav',new Set()),[]);assert.equal(saveIds(unavailable,'fav',[]),false);
 assert.deepEqual(loadIds(undefined,'fav',new Set()),[]);assert.equal(saveIds(undefined,'fav',[]),false);
});
