import {categories,moods,energies,names} from './metadata.js';
export const escapeHTML=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const e=escapeHTML;
export function button(action,label,id='',className='secondary',extra=''){return `<button type="button" class="${className}" data-action="${action}" data-id="${e(id)}" ${extra}>${label}</button>`;}
const motifs={
 movie:'<rect x="20" y="10" width="125" height="64" rx="3"/><path d="M25 22h115M25 62h115" stroke-dasharray="8 7"/><path d="m76 30 22 14-22 14z"/>',
 drinks:'<path d="M47 30h60v22q0 24-30 24T47 52zM107 35h8q23 15 0 26h-8M35 79h85M64 21q-12-9 0-18M82 21q-12-9 0-18M99 21q-12-9 0-18"/>',
 cooking:'<path d="m40 67 12-41 15 5-12 41zM52 26l-5-12m9 11 5-15m-1 19 14-6M104 62q-26-33-6-40 20-6 22 8 25-11 25 9 0 19-41 23zM89 79h56"/>',
 nature:'<path d="M8 67q25-45 55-5t46-22 50-7" stroke-dasharray="4 6"/><path d="M92 52Q77 6 128 7q-2 38-36 45zm0 0 28-35M25 59l-6-12m6 12 8-11"/><circle cx="9" cy="67" r="4"/>',
 creative:'<path d="m15 52 114-30M22 67 119-25M40 75l95-21" stroke-width="13" opacity=".23"/><path d="m51 60 48-43 9 10-49 43-14 4zM99 17l6-5 9 10-6 5"/><path d="M131 16v16m-8-8h16"/>',
 games:'<rect x="32" y="18" width="53" height="59" rx="6" transform="rotate(-12 50 40)"/><rect x="81" y="10" width="53" height="59" rx="6" transform="rotate(12 100 40)"/><circle cx="106" cy="39" r="6"/><circle cx="46" cy="34" r="3"/><circle cx="65" cy="61" r="3"/>',
 movement:'<path d="M4 23h57M20 41h28M8 59h42M100 14 77 38l19 15-14 27M78 37 58 48M94 25l23 17h28"/><circle cx="109" cy="9" r="7"/>',
 rest:'<path d="M112 12A34 34 0 1 0 145 56 29 29 0 0 1 112 12zM10 70q20-13 39 0t38 0M5 80q20-13 39 0t38 0"/><circle cx="63" cy="23" r="2"/><circle cx="34" cy="41" r="2"/>',
 learning:'<path d="M17 17q30-10 61 5v58q-30-16-61-5zm61 5q30-15 61-5v58q-30-10-61 5M27 32l37 6M27 44l37 6M93 35h33M93 47h26"/>',
 social:'<path d="M15 17h80v39H56L36 72V56H15zM105 31h38v43h-13l-6 12-16-12H70V65"/><circle cx="35" cy="36" r="2"/><circle cx="54" cy="36" r="2"/><circle cx="73" cy="36" r="2"/>',
 base:'<path d="m80 8 9 25 26-11-13 23 26 9-27 8 11 24-24-13-9 24-7-26-24 13 12-24-26-8 26-8-12-23 24 12z"/>'
};
export function themeClass(a){return Object.hasOwn(motifs,a.category)?a.category:'base';}
export function decor(a){return `<div class="card-art" aria-hidden="true"><svg viewBox="0 0 165 100" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${motifs[themeClass(a)]}</svg></div>`;}
export function card(a,{compact=false,actions='',favorite=false,excluded=false,footer='',steps=true}={}) {
 return `<article class="idea theme-${themeClass(a)} ${compact?'compact':'full-card'}" data-activity="${e(a.id)}"><div class="card-topline"><span>${e(categories[a.category]||'Ваша ідея')}</span><span>${a.custom?'ВЛАСНА ІДЕЯ':'БЮРО / ВЕЧІР'}</span></div>${decor(a)}<div class="card-copy"><h${compact?'3':'2'}>${e(a.title)}</h${compact?'3':'2'}><p class="description">${e(a.description)}</p><div class="meta"><span>◷ ${a.duration} хв</span><span>${a.cost?`≈ ${a.cost} грн / особу`:'Безкоштовно'}</span>${!compact?`<span>${a.company.map(x=>names[x]).join(' · ')}</span><span>${a.places.map(x=>names[x]).join(' · ')}</span>`:''}</div>${!compact?`<p class="mood-line">${a.moods.map(x=>moods[x]).join(' · ')} <span> / Сил: ${energies[a.energy].toLowerCase()}</span></p>`:''}${excluded?'<p class="badge">Виключено з рулетки</p>':''}${favorite?'<span class="favorite-mark">♥ В обраному</span>':''}${!compact&&steps?`<div class="steps"><h3>Почніть із простого</h3><ol>${a.steps.map(s=>`<li>${e(s)}</li>`).join('')}</ol>${a.things?.length?`<p class="things">Знадобиться: ${a.things.map(e).join(', ')}.</p>`:''}</div>`:''}${footer}<div class="card-actions">${actions}</div></div></article>`;
}
const groups=[
 ['time','Скільки маєте часу?', [['Infinity','Будь-який'],['30','До 30 хв'],['60','До 1 години'],['120','До 2 годин']]],
 ['budget','Бюджет на людину', [['Infinity','Будь-який'],['0','Безкоштовно'],['200','До 200 грн'],['500','До 500 грн']]],
 ['company','Хто з вами?', [['any','Будь-яка'],['solo','Сам/сама'],['duo','Удвох'],['group','Компанією']]],
 ['place','Де проведемо вечір?', [['any','Будь-де'],['home','Вдома'],['outside','Надворі']]],
 ['mood','Чого хочеться?', [['any','Будь-чого'],...Object.entries(moods)]],
 ['energy','Скільки сил?', [['Infinity','Будь-який рівень'],['1','Мало'],['2','Середньо'],['3','Багато']]]
];
export function filtersView(f,scope='personal') {
 const field=([key,title,options],i)=>`<fieldset><legend><span>${String(i+1).padStart(2,'0')}</span>${title}</legend><div class="choices">${options.map(([v,label])=>`<label class="choice"><input type="radio" name="${scope}-${key}" data-filter="${key}" data-scope="${scope}" value="${v}" ${String(f[key])===v?'checked':''}><span>${e(label)}</span></label>`).join('')}</div></fieldset>`;
 return `<div class="filter-fields">${groups.slice(0,4).map(field).join('')}<details class="extra-filters" ${f.mood!=='any'||f.energy!==Infinity?'open':''}><summary>Настрій та енергія <span>необов’язково</span></summary>${groups.slice(4).map((g,i)=>field(g,i+4)).join('')}</details></div>`;
}
export function empty(title,description){return `<div class="empty-state"><span class="empty-spark" aria-hidden="true">✳</span><h2>${title}</h2><p>${description}</p></div>`;}
