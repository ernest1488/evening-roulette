export const defaults = {time:Infinity,budget:Infinity,company:'any',place:'any',mood:'any',energy:Infinity};
export function filterActivities(items, f = defaults, excluded = []) {
 const hidden=new Set(excluded);
 return items.filter(a=>!hidden.has(a.id)&&a.duration<=f.time&&a.cost<=f.budget&&
  (f.company==='any'||a.company.includes(f.company))&&(f.place==='any'||a.places.includes(f.place))&&
  (!f.mood||f.mood==='any'||a.moods?.includes(f.mood))&&(a.energy||1)<=(f.energy??Infinity));
}
export function choose(items,previousId,random=Math.random) {
 const pool=items.length>1?items.filter(a=>a.id!==previousId):items;
 return pool.length?pool[Math.min(pool.length-1,Math.floor(random()*pool.length))]:null;
}
export function toggleId(ids,id) {return ids.includes(id)?ids.filter(x=>x!==id):[...new Set([...ids,id])];}
export function loadIds(storage,key,validIds) {
 try {const a=JSON.parse(storage.getItem(key));return Array.isArray(a)?[...new Set(a.filter(id=>typeof id==='string'&&validIds.has(id)))]:[];}catch{return [];}
}
export function saveIds(storage,key,ids) {try{storage.setItem(key,JSON.stringify(ids));return true;}catch{return false;}}
export function totals(items) {return items.reduce((s,a)=>({duration:s.duration+a.duration,cost:Math.round((s.cost+a.cost)*100)/100}),{duration:0,cost:0});}
// Custom ideas use explicit category compatibility; built-in ideas use curated links only.
const categoryPairs={movie:['drinks','cooking','social'],drinks:['cooking','rest','social'],cooking:['drinks','social'],nature:['nature','rest','social'],creative:['drinks','rest'],games:['drinks','cooking'],movement:['rest','drinks'],rest:['drinks','rest'],learning:['drinks','social'],social:['drinks','social']};
export function complements(main,candidate) {
 if(main.id===candidate.id)return false;
 return main.complements?.includes(candidate.id)||((main.custom||candidate.custom)&&categoryPairs[main.category]?.includes(candidate.category))||false;
}
export function planIssues(items,mainId,f,excluded=[]) {
 if(!items.length)return ['Оберіть основне заняття.'];
 const issues=[],main=items.find(a=>a.id===mainId),sum=totals(items);
 if(sum.duration>f.time)issues.push(`План триває ${sum.duration} хв — ліміт ${f.time} хв.`);
 if(sum.cost>f.budget)issues.push(`Орієнтовний бюджет ${sum.cost} грн перевищує ліміт ${f.budget} грн.`);
 for(const a of items){
  if(excluded.includes(a.id))issues.push(`«${a.title}» виключено з рулетки.`);
  if(!filterActivities([a],{...f,time:Infinity,budget:Infinity}).length)issues.push(`«${a.title}» не відповідає компанії, місцю, настрою або рівню сил.`);
  if(main&&a.id!==mainId&&!complements(main,a))issues.push(`«${a.title}» не поєднується з основною ідеєю.`);
 }
 if(items.length>1&&!items[0].company.some(v=>items.every(a=>a.company.includes(v))))issues.push('У пунктів плану немає спільного формату компанії.');
 if(items.length>1&&!items[0].places.some(v=>items.every(a=>a.places.includes(v))))issues.push('У пунктів плану немає спільного місця виконання.');
 if(!main)issues.push('Основної ідеї більше немає в бібліотеці.');
 return issues;
}
export function similarIdeas(main,items,f,excluded=[],added=[]) {
 return filterActivities(items,f,excluded).filter(a=>a.id!==main.id&&!added.includes(a.id)&&
  (main.similar?.includes(a.id)||((main.custom||a.custom)&&main.category===a.category&&main.moods.some(m=>a.moods.includes(m))))).slice(0,3);
}
export function additions(main,plan,items,f,excluded=[]) {
 return items.filter(a=>!plan.some(p=>p.id===a.id)&&complements(main,a)&&!planIssues([...plan,a],main.id,f,excluded).length).slice(0,3);
}
export function rebuildPlan(items,mainId,catalog,f,excluded=[],random=Math.random) {
 const oldMain=items.find(a=>a.id===mainId);
 const main=oldMain&&filterActivities([oldMain],f,excluded).length?oldMain:choose(filterActivities(catalog,f,excluded),mainId,random);
 if(!main)return {mainId:null,ids:[]};
 if(main.id!==mainId)return {mainId:main.id,ids:[main.id]};
 let kept=[main];
 for(const a of items.filter(a=>a.id!==mainId))if(!planIssues([...kept,a],mainId,f,excluded).length)kept.push(a);
 // Preserve the user's sequence, including a main item that was moved later.
 return {mainId,ids:items.filter(a=>kept.some(k=>k.id===a.id)).map(a=>a.id)};
}
export function replaceMain(plan,main,catalog,f,excluded=[]) {
 const old=plan.map(a=>a.id);const result=rebuildPlan([main,...plan.filter(a=>a.id!==main.id)],main.id,catalog,f,excluded);
 return {...result,removed:old.filter(id=>id!==main.id&&!result.ids.includes(id))};
}
export function replacementOptions(items,index,mainId,catalog,f,excluded=[]) {
 const old=items[index];const main=items.find(a=>a.id===mainId);
 if(!old||!main)return [];
 return filterActivities(catalog,f,excluded).filter(a=>!items.some(p=>p.id===a.id)&&
  (index===items.findIndex(p=>p.id===mainId)?(main.similar?.includes(a.id)||main.category===a.category):complements(main,a))&&
  !planIssues(items.map((p,i)=>i===index?a:p),old.id===mainId?a.id:mainId,f,excluded).length).slice(0,8);
}
export function shuffleSample(items,limit=10,random=Math.random) {
 const pool=[...new Map(items.map(a=>[a.id,a])).values()];
 for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
 return pool.slice(0,limit);
}
export function tallyVotes(items,votes,participants) {
 const ranked=items.map(a=>({activity:a,count:votes.reduce((n,v)=>n+(v.includes(a.id)?1:0),0)})).sort((a,b)=>b.count-a.count);
 const unanimous=ranked.filter(a=>a.count===participants);
 const max=ranked[0]?.count||0;
 return {unanimous,top:unanimous.length?unanimous:ranked.filter(a=>max>0&&a.count===max),max};
}
export function timerRemaining(timer,now=Date.now()) {return Math.max(0,timer.endAt===null?timer.remaining:timer.endAt-now);}
export function pauseTimer(timer,now=Date.now()) {return {...timer,remaining:timerRemaining(timer,now),endAt:null};}
export function resumeTimer(timer,now=Date.now()) {return {...timer,endAt:now+timerRemaining(timer,now)};}
export function recordCompletion(history,activity,token,now=Date.now()) {
 if(history.some(h=>h.token===token))return history;
 return [{id:token,token,date:new Date(now).toISOString(),rating:null,activity:structuredClone(activity)},...history];
}
