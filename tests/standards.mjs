import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const nodes = new Map();
const node = () => ({ value:'0', style:{}, attributes:{}, classList:{add(){},remove(){},toggle(){}}, setAttribute(k,v){this.attributes[k]=v;}, addEventListener(){}, appendChild(){}, click(){} });
const get = id => { if(!nodes.has(id)) nodes.set(id,node()); return nodes.get(id); };
const context = vm.createContext({document:{getElementById:get,createElement:node,querySelector:node,querySelectorAll:()=>[]}, console, setTimeout, clearTimeout, alert(){}});
vm.runInContext(scripts[1], context);
const run = code => vm.runInContext(code, context);
const catalog = JSON.parse(run('JSON.stringify(AIR_QUALITY_STANDARDS)'));
assert.deepEqual(catalog.map(s=>[s.id,s.values.pm25,s.values.pm10,s.hours]), [
 ['moel',50,100,8],['env',35,100,24],['envAnnual',15,50,null],['who',15,45,24],['whoAnnual',5,15,null]
]);
assert.equal(new Set(catalog.map(s=>s.id)).size,5);
for(const s of catalog) { assert.equal(s.unit,'µg/m³'); assert(s.period && s.environment && s.nature && s.version && s.checked); assert.match(s.source,/^https:\/\//); }
assert.equal(catalog[0].verification,'pending-original-table'); // Do not silently claim full verification.
assert.equal(run('getStandardPlotLines().length'),0);
run("toggleStandard('who')");
assert.equal(get('std-who').attributes['aria-pressed'],'true');
assert.deepEqual(JSON.parse(run('JSON.stringify(getStandardPlotLines().map(l=>l.value))')),[15,45]);
assert.match(run('getStandardPlotLines()[0].label.text'),/24시간 평균.*µg\/m³/);
run("toggleStandard('who'); toggleStandard('moel'); toggleStandard('env')");
assert.equal(run('getStandardPlotLines().filter(l=>l.value===100).length'),1);
assert.match(run('getStandardPlotLines().find(l=>l.value===100).label.text'),/고용노동부.*국가 대기환경기준/);
run('seriesVisible.pm25=false; seriesVisible.pm10=false');
assert.equal(run('getStandardPlotLines().length'),0,'PM1-only chart must have no reference lines');
run('seriesVisible.pm25=true; seriesVisible.pm10=true');
const notice = (data, ids=['moel','who']) => { context.rows=data; context.ids=ids; return run('referenceNotice(rows,AIR_QUALITY_STANDARDS.filter(s=>ids.includes(s.id)))'); };
const row=(date,time)=>({date,time});
assert.match(notice([]),/자료가 부족/);
assert.match(notice([row('2026-10-18','00:00:00')]),/자료가 부족/);
assert.match(notice([row('2026-10-18','23:59:54'),row('2026-10-19','00:00:00')]),/평균시간 미달/);
let msg=notice([row('2026-10-18','00:00:00'),row('2026-10-18','08:00:00')]);
assert.match(msg,/평균시간 미달: WHO/); assert(!msg.includes('평균시간 미달: 고용노동부'));
msg=notice([row('2026-10-18','00:00:00'),row('2026-10-19','00:00:00')]);
assert(!msg.includes('평균시간 미달')); assert.match(msg,/법적 적합·부적합.*판정하지/); assert.match(msg,/실제 연속 측정시간이 아닙니다/);
for (const rows of [
 [row('2026-10-19','00:00:00'),row('2026-10-18','00:00:00')],
 [row('2026-10-18','00:00:00'),row('2026-10-18','00:00:00')],
 [row('2026-02-30','00:00:00'),row('2026-03-03','00:00:00')]
]) assert.match(notice(rows),/측정시간을 신뢰할 수 없습니다/);
assert.match(notice([row('2025-01-01','00:00:00'),row('2026-01-01','00:00:00')],['whoAnnual']),/달력 연도별 유효자료/);
assert.equal(run("referenceTimestamp({date:'2026/10/18',time:'00:00:00'})"), Date.UTC(2026,9,18));
console.log('PASS: catalog regression, units/source metadata, toggles/ARIA, WHO lines, coincident labels, PM1 exclusion, midnight, 8h/24h boundaries, gaps disclaimer, annual warning, invalid/duplicate/reversed timestamps.');
