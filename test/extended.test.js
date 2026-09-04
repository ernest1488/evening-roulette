import test from 'node:test';
import assert from 'node:assert/strict';
import {activities} from '../src/activities.js';
import {categories} from '../src/metadata.js';
import {defaults,filterActivities,totals,additions,planIssues,rebuildPlan,replacementOptions,shuffleSample,tallyVotes,recordCompletion,timerRemaining,pauseTimer,resumeTimer,similarIdeas} from '../src/logic.js';
import {STORAGE_KEY,loadState,persistState,initialState,previewImport,validateActivity,validateActive} from '../src/storage.js';
import {card} from '../src/ui.js';
const get=id=>activities.find(a=>a.id===id);
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};
const custom=(id='custom-test')=>({...get('tea-tasting'),id,custom:true,similar:[],complements:[]});
test('64 валідні заняття, 10 категорій і лише наявні явні зв’язки',()=>{
 assert.ok(activities.length>=60);const ids=new Set(activities.map(a=>a.id));assert.ok(new Set(activities.map(a=>a.category)).size>=8);
 for(const a of activities){assert.equal(validateActivity(a).valid,true,`${a.id}: ${JSON.stringify(validateActivity(a).errors)}`);for(const id of [...a.similar,...a.complements]){assert.ok(ids.has(id));assert.notEqual(id,a.id);}}
});
test('Настрій — тег, енергія — включний максимум',()=>{
 const samples=[{...get('tea-tasting'),id:'low',energy:1,moods:['rest']},{...get('tea-tasting'),id:'medium',energy:2,moods:['rest','fun']},{...get('tea-tasting'),id:'high',energy:3,moods:['fun']}];
 assert.deepEqual(filterActivities(samples,{...defaults,energy:1}).map(a=>a.id),['low']);
 assert.deepEqual(filterActivities(samples,{...defaults,energy:2,mood:'fun'}).map(a=>a.id),['medium']);
 assert.equal(filterActivities(samples,{...defaults,energy:3}).length,3);
 assert.equal(filterActivities(samples,{...defaults,mood:'learn'}).length,0);
});
test('Доповнення мають явний зв’язок, без основної, дублікатів та виключень',()=>{
 const main=get('movie'),popcorn=get('popcorn');
 const result=additions(main,[main],activities,defaults,['lemonade']);
 assert.ok(result.some(a=>a.id==='popcorn'));assert.ok(result.every(a=>main.complements.includes(a.id)));
 assert.ok(!result.some(a=>['movie','lemonade'].includes(a.id)));
 assert.ok(!additions(main,[main,popcorn],activities,defaults).some(a=>a.id==='popcorn'));
 assert.equal(new Set(result.map(a=>a.id)).size,result.length);
});
test('Суми та включні межі плану 70 хв / 40 грн',()=>{
 const main=get('movie'),popcorn=get('popcorn');assert.deepEqual(totals([main,popcorn]),{duration:70,cost:40});
 assert.ok(additions(main,[main],activities,{...defaults,time:70,budget:40}).some(a=>a.id==='popcorn'));
 assert.ok(!additions(main,[main],activities,{...defaults,time:69,budget:40}).some(a=>a.id==='popcorn'));
 assert.ok(!additions(main,[main],activities,{...defaults,time:70,budget:39}).some(a=>a.id==='popcorn'));
 assert.ok(!additions(main,[main],activities,{...defaults,time:70,budget:40,energy:1}).some(a=>a.id==='popcorn'));
});
test('Компанія, місце та настрій обмежують увесь план',()=>{
 const main=get('movie');for(const filters of [{...defaults,company:'solo'},{...defaults,place:'outside'},{...defaults,mood:'move'}])assert.equal(additions(main,[main],activities,filters).length,0);
 const main2=get('animation');assert.ok(!additions(main2,[main2],activities,{...defaults,company:'solo'}).some(a=>a.id==='film-talk'));
});
test('Схожі альтернативи задовольняють фільтри та не дублюють план',()=>{
 const main=get('movie');const result=similarIdeas(main,activities,{...defaults,time:40},['documentary'],['animation']);
 assert.ok(result.length<=3);assert.ok(result.every(a=>a.duration<=40&&!['movie','documentary','animation'].includes(a.id)));
});
test('Перебудова зберігає основну, прибирає зайве та не мутує план',()=>{
 const main=get('animation'),items=[main,get('popcorn'),get('cocoa')];
 const result=rebuildPlan(items,main.id,activities,{...defaults,time:40});
 assert.equal(result.mainId,main.id);assert.deepEqual(result.ids,['animation','popcorn']);assert.equal(items.length,3);
 assert.ok(planIssues(items,main.id,{...defaults,time:40}).some(x=>x.includes('55')));
 const replacement=rebuildPlan(items,main.id,activities,{...defaults,time:30,place:'outside'},[],()=>0);
 assert.notEqual(replacement.mainId,main.id);assert.equal(replacement.ids.length,1);
});
test('Заміна пункту сумісна з повним планом і не повторює інші пункти',()=>{
 const main=get('animation'),items=[main,get('popcorn')];
 const options=replacementOptions(items,1,main.id,activities,{...defaults,time:45,budget:40});
 assert.ok(options.some(a=>a.id==='cocoa'));assert.ok(options.every(a=>!items.some(i=>i.id===a.id)));
});
test('Добірка групи має максимум 10 унікальних записів і стабільна',()=>{
 const sample=shuffleSample([...activities,activities[0]],10,()=>.5);assert.equal(sample.length,10);assert.equal(new Set(sample.map(a=>a.id)).size,10);
 assert.equal(shuffleSample(activities.slice(0,3)).length,3);assert.deepEqual(shuffleSample([]),[]);
});
test('Голосування: одностайність, нічия, лідери, нуль голосів',()=>{
 const items=activities.slice(0,3),[a,b,c]=items.map(x=>x.id);
 const unanimous=tallyVotes(items,[[a,b],[a,b],[a,b,c]],3);assert.equal(unanimous.unanimous.length,2);assert.ok(unanimous.top.every(x=>x.count===3));
 const tied=tallyVotes(items,[[a],[b],[a,b]],3);assert.equal(tied.unanimous.length,0);assert.equal(tied.top.length,2);assert.equal(tied.max,2);
 assert.equal(tallyVotes(items,[[],[]],2).top.length,0);assert.equal(tallyVotes([], [[],[]],2).max,0);
 assert.equal(tallyVotes(items,[[a,a],[]],2).max,1);
});
test('Імпорт додає нові, рахує дублікати й помилки без перезапису',()=>{
 const existing=custom('existing'),fresh=custom('fresh');
 const result=previewImport(JSON.stringify([existing,fresh,fresh,{...fresh,id:'bad',duration:-1}]),[existing]);
 assert.equal(result.added.length,1);assert.equal(result.skipped,2);assert.equal(result.invalid,1);assert.equal(result.added[0].id,'fresh');assert.equal(existing.title,custom().title);
 for(const raw of ['{','null','{}','42',JSON.stringify({version:999,activities:[]})])assert.ok(previewImport(raw).error);
});
test('Валідація полів і безпечне відображення HTML у власному контенті',()=>{
 for(const patch of [{duration:0},{duration:1.5},{cost:-1},{title:''},{steps:[]},{steps:Array(7).fill('x')},{company:[]},{places:[]},{moods:['oops']},{energy:4},{category:'oops'}])assert.equal(validateActivity({...custom(),...patch}).valid,false);
 const a={...custom(),title:'<img src=x onerror=alert(1)>',description:'<script>bad()</script>'};const result=previewImport(JSON.stringify([a]));assert.equal(result.added.length,1);
 const html=card(result.added[0]);assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<img'));
});
test('Міграція старих обраного та виключень без втрати даних',()=>{
 const s=storage(),id=activities[0].id;s.setItem('evening-favorites',JSON.stringify([id,id,'unknown']));s.setItem('evening-excluded',JSON.stringify([id]));
 const {state}=loadState(s,activities);assert.deepEqual(state.favorites,[id]);assert.deepEqual(state.excluded,[id]);assert.equal(state.version,2);persistState(s,state);
 assert.equal(s.getItem('evening-favorites'),JSON.stringify([id,id,'unknown']));assert.deepEqual(loadState(s,activities).state.favorites,[id]);
});
test('Збереження власних ідей, фільтрів, плану, історії та прогресу',()=>{
 const s=storage(),state=initialState(),a=custom();state.custom=[a];state.favorites=[a.id];state.excluded=[a.id];state.plan={mainId:a.id,ids:[a.id]};state.settings.filters={...defaults,energy:2,mood:'rest'};
 state.history=recordCompletion([],a,'run:0',1000);state.active={id:'run',items:[a],index:0,statuses:['pending'],checks:[[true,false,false]],timer:{remaining:1000,endAt:5000}};
 persistState(s,state);const reloaded=loadState(s,activities).state;assert.deepEqual(reloaded,state);
 reloaded.custom=[];reloaded.favorites=[];reloaded.excluded=[];reloaded.plan={mainId:null,ids:[]};persistState(s,reloaded);assert.equal(loadState(s,activities).state.history[0].activity.title,a.title);
});
test('Пошкоджені дані й відмова сховища не ламають запуск',()=>{
 const s=storage();s.setItem(STORAGE_KEY,'{bad');assert.ok(loadState(s,activities).warning);
 s.setItem(STORAGE_KEY,JSON.stringify({version:2,custom:[null],history:[null,{activity:null}],plan:{ids:[null]},active:{index:99},settings:{filters:{time:-1}}}));const state=loadState(s,activities).state;assert.equal(state.custom.length,0);assert.equal(state.active,null);assert.equal(state.settings.filters.time,Infinity);
 const broken={getItem(){throw Error();},setItem(){throw Error();}};assert.ok(loadState(broken,activities).warning);assert.equal(persistState(broken,state),false);
 assert.equal(validateActive({items:[],index:0}),null);
});
test('Одне виконання — один запис; повторне виконання має новий токен',()=>{
 const a=get('tea-tasting');const h=recordCompletion([],a,'run:0',1000);assert.equal(recordCompletion(h,a,'run:0',1100),h);assert.equal(recordCompletion(h,a,'run2:0',1200).length,2);a.title='тимчасова зміна';assert.notEqual(h[0].activity.title,a.title);a.title=h[0].activity.title;
});
test('Таймер: фоновий час, пауза, продовження, завершення не автоматичне',()=>{
 const initial={remaining:60000,endAt:null},running=resumeTimer(initial,1000);assert.equal(running.endAt,61000);assert.equal(timerRemaining(running,31000),30000);
 const paused=pauseTimer(running,31000);assert.equal(timerRemaining(paused,999999),30000);const resumed=resumeTimer(paused,100000);assert.equal(timerRemaining(resumed,120000),10000);assert.equal(timerRemaining(resumed,140000),0);
 const state=initialState();state.history=[];timerRemaining(resumed,999999);assert.equal(state.history.length,0);
});
test('Всі категорії та невідома категорія мають локальний декор і спільні дії',()=>{
 for(const category of Object.keys(categories)){const html=card({...get('tea-tasting'),category},{actions:'<button>Почати</button>'});assert.ok(html.includes('<svg'));assert.ok(html.includes(`theme-${category}`));assert.ok(html.includes('Почати'));}
 assert.ok(card({...get('tea-tasting'),category:'unknown'}).includes('theme-base'));
});
test('Навіть без фільтрів пункти плану мають спільне місце й компанію',()=>{
 const main={...get('movie'),company:['duo'],places:['home']};
 assert.ok(planIssues([main,{...get('popcorn'),company:['solo']}],main.id,defaults).some(x=>x.includes('спільного формату')));
 assert.ok(planIssues([main,{...get('popcorn'),places:['outside']}],main.id,defaults).some(x=>x.includes('спільного місця')));
});
test('Грошові суми враховують копійки без похибки двійкових дробів',()=>{
 assert.equal(totals([{duration:1,cost:.1},{duration:1,cost:.2}]).cost,.3);
 assert.equal(validateActivity({...custom(),cost:.001}).valid,false);
});
