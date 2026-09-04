export const categories = {movie:'Фільми',drinks:'Кава й чай',cooking:'Кулінарія',nature:'Прогулянки й природа',creative:'Творчість',games:'Ігри',movement:'Рух',rest:'Відпочинок',learning:'Пізнання нового',social:'Спілкування',base:'Інше'};
export const moods = {rest:'Відпочити',fun:'Розважитися',create:'Створити щось',move:'Порухатися',social:'Поспілкуватися',learn:'Дізнатися нове'};
export const energies = {1:'Мало',2:'Середньо',3:'Багато'};
export const names = {solo:'Сам/сама',duo:'Удвох',group:'Компанією',home:'Вдома',outside:'Надворі'};
const assignments = {
 movie:['movie','cinema','documentary','concert-film','animation'],
 drinks:['tea-tasting','coffee','lemonade','cocoa','coffee-tasting'],
 cooking:['sandwich','dessert','cook-duo','bake','popcorn','fruit-plate','bruschetta'],
 nature:['sunset','walk-map','clouds','picnic','sketch','leaves','sound-map','bird-watch'],
 creative:['color-hunt','blind-drawing','paper-city','postcard','origami','poem','flowers','clay','collage','watercolor'],
 games:['boardgame','charades','puzzle','stories','word-game','paper-battleship'],
 movement:['stretch','dance','jog','badminton','balance'],
 rest:['playlist','reading','balcony','spa','letter-future','breathing','quiet-listen'],
 learning:['language','stargazing','museum','memory','map-journey','micro-lecture'],
 social:['questions','book-swap','restaurant','film-talk','gratitude']
};
const categoryMoods = {movie:['rest','fun','learn'],drinks:['rest','social'],cooking:['create','fun'],nature:['rest','move','learn'],creative:['create','fun'],games:['fun','social'],movement:['move','fun'],rest:['rest'],learning:['learn'],social:['social','fun']};
const similarGroups = [
 ['movie','documentary','concert-film','animation','cinema'],['tea-tasting','coffee-tasting','cocoa','coffee','lemonade'],
 ['sandwich','bruschetta','dessert','fruit-plate'],['bake','cook-duo'],['sunset','clouds','stargazing','bird-watch'],
 ['walk-map','sound-map','coffee','picnic'],['blind-drawing','sketch','watercolor'],['origami','paper-city','collage'],
 ['postcard','letter-future','gratitude'],['boardgame','paper-battleship','word-game','charades','stories'],['stretch','balance','jog','dance','badminton'],
 ['reading','book-swap','poem'],['language','micro-lecture','map-journey','museum'],['spa','breathing','quiet-listen'],['questions','film-talk','gratitude']
];
const complements = {
 movie:['popcorn','lemonade','film-talk'],documentary:['tea-tasting','film-talk'],animation:['cocoa','popcorn','film-talk'],'concert-film':['lemonade','quiet-listen'],
 reading:['tea-tasting','cocoa','quiet-listen'], 'book-swap':['tea-tasting','gratitude'], 'boardgame':['popcorn','lemonade','fruit-plate'],
 'paper-battleship':['cocoa','fruit-plate'],charades:['lemonade','fruit-plate'],puzzle:['tea-tasting','playlist'],
 'walk-map':['coffee','bird-watch','sound-map'],sunset:['breathing','clouds'],picnic:['bird-watch','clouds','questions'],
 'tea-tasting':['bake','postcard','reading'],'coffee-tasting':['dessert','questions'],cocoa:['reading','postcard'],
 'cook-duo':['lemonade','questions'],bake:['tea-tasting','cocoa'],bruschetta:['lemonade'],
 'blind-drawing':['playlist','tea-tasting'],watercolor:['playlist','tea-tasting'],collage:['playlist'],clay:['quiet-listen'],
 stretch:['breathing','quiet-listen'],jog:['stretch','breathing'],dance:['stretch','lemonade'],balance:['breathing'],
 'micro-lecture':['tea-tasting','questions'],'map-journey':['tea-tasting','postcard'],language:['tea-tasting'],
 questions:['tea-tasting','gratitude'],restaurant:['walk-map'],spa:['quiet-listen','breathing'],'letter-future':['tea-tasting','quiet-listen']
};
export function enrich(items) {
 const ids = new Set(items.map(a=>a.id));
 return items.map(a=>{
  const category=Object.keys(assignments).find(c=>assignments[c].includes(a.id))||'base';
  const energy=['jog','dance','badminton'].includes(a.id)?3:['creative','cooking','games','nature','movement'].includes(category)?2:1;
  return {...a,category,moods:categoryMoods[category]||['fun'],energy,
   things: ({'color-hunt':['Телефон або камера'],'blind-drawing':['Папір','Ручка'],'paper-city':['Папір','Ножиці'],'postcard':['Папір','Ручка'],'origami':['Папір'],'flowers':['Квіти','Ваза'],'clay':['Самозастигальна глина'],'collage':['Папір','Ножиці','Клей'],'watercolor':['Акварель','Пензлик','Папір']})[a.id]||[],
   similar:[...new Set(similarGroups.filter(g=>g.includes(a.id)).flat())].filter(id=>id!==a.id&&ids.has(id)),
   complements:(complements[a.id]||[]).filter(id=>ids.has(id))};
 });
}
