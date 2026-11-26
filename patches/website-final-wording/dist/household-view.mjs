import {renderDebtExplanation}from './credit-policy-view.mjs';
import {distributionStats,histogram} from './distribution.mjs';
import {metricValue} from './parameters.mjs';

const byId=id=>document.getElementById(id);
const number=(value,digits=3)=>Number.isFinite(value)?value.toLocaleString('en-GB',{maximumSignificantDigits:digits}):'—';
const gini=value=>Number.isFinite(value)?value.toFixed(3):'—';
const ratio=value=>Number.isFinite(value)?value.toLocaleString('en-GB',{minimumFractionDigits:1,maximumFractionDigits:1})+'%':'—';
const percent=value=>Number.isFinite(value)?number(value)+'%':'—';

function trend(result,key,year,label,benchmark) {
  const W=500,H=190,L=45,R=20,T=18,B=28;
  const series=side=>result[side].map(row=>({t:row.t,...row[key]})).filter(row=>Number.isFinite(row.median));
  const scenario=series('scenario'),baseline=series('baseline'),all=[...scenario,...baseline];
  if(!all.length)return '<p class="small muted">Gini is undefined when the total is nonpositive and households have different amounts.</p>';
  const maximum=Math.max(.05,benchmark??0,...all.map(row=>row.high))*1.12;
  const x=t=>L+t/result.params.periods*(W-L-R),y=v=>H-B-v/maximum*(H-T-B);
  const path=(rows,field='median')=>rows.map((row,i)=>(i&&row.t===rows[i-1].t+1?'L':'M')+x(row.t)+','+y(row[field])).join(' ');
  const axis=Array.from({length:4},(_,i)=>{
    const value=maximum*i/3;
    return `<line x1="${L}" x2="${W-R}" y1="${y(value)}" y2="${y(value)}" stroke="#e4ebdf"/><text x="${L-8}" y="${y(value)+4}" text-anchor="end">${value.toFixed(2)}</text>`;
  }).join('')+[0,Math.round(result.params.periods/2),result.params.periods].map(t=>
    `<text x="${x(t)}" y="${H-7}" text-anchor="middle">${t}</text>`).join('');
  const band=rows=>{
    const groups=[];
    for(const row of rows){if(!groups.length||row.t!==groups.at(-1).at(-1).t+1)groups.push([]);groups.at(-1).push(row);}
    return groups.map(group=>path(group,'high')+' '+group.slice().reverse().map(row=>'L'+x(row.t)+','+y(row.low)).join(' ')+' Z').join(' ');
  };
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}. Median Gini across seeds, from year 0 to ${result.params.periods}. Scenario green, reference dashed grey. Highlighted year ${year}.">
    ${axis}${Number.isFinite(benchmark)?`<line x1="${L}" x2="${W-R}" y1="${y(benchmark)}" y2="${y(benchmark)}" stroke="#b08a47" stroke-dasharray="2 4"/>`:''}${result.params.replications>1?`<path d="${band(scenario)}" fill="#087f62" opacity=".1"/>`:''}
    <path d="${path(baseline)}" fill="none" stroke="#9195aa" stroke-width="2" stroke-dasharray="5 4"/>
    <path d="${path(scenario)}" fill="none" stroke="#087f62" stroke-width="2.5"/>
    <line x1="${x(year)}" x2="${x(year)}" y1="${T}" y2="${H-B}" stroke="#aab9a3" stroke-dasharray="3 4"/>
    <text x="${W-R}" y="13" text-anchor="end">Gini · model year</text>
  </svg>`;
}

function distributionCard(values,label) {
  const stats=distributionStats(values),data=histogram(values),W=500,H=210,L=46,R=18,T=22,B=37;
  const maximum=Math.max(5,...data.bins.map(bin=>bin.share))*1.1;
  const x=v=>L+(v-data.low)/(data.high-data.low)*(W-L-R),y=v=>H-B-v/maximum*(H-T-B);
  const axis=Array.from({length:4},(_,i)=>{
    const value=maximum*i/3;
    return `<line x1="${L}" x2="${W-R}" y1="${y(value)}" y2="${y(value)}" stroke="#e4ebdf"/><text x="${L-8}" y="${y(value)+4}" text-anchor="end">${number(value)}%</text>`;
  }).join('')+Array.from({length:4},(_,i)=>{
    const value=data.low+(data.high-data.low)*i/3;
    return `<text x="${x(value)}" y="${H-B+18}" text-anchor="${i===0?'start':i===3?'end':'middle'}">${number(value)}</text>`;
  }).join('');
  const description=bin=>`${number(bin.low)} to ${number(bin.high)} nominal units. ${bin.count} households, ${percent(bin.share)}.`;
  const bars=data.bins.map(bin=>`<rect x="${x(bin.low)+1}" y="${y(bin.share)}" width="${Math.max(1,x(bin.high)-x(bin.low)-2)}" height="${H-B-y(bin.share)}" fill="#087f62" opacity=".8" tabindex="0" role="img" aria-label="${description(bin)}"><title>${description(bin)}</title></rect>`).join('');
  return `<h4>${label}</h4><div class="household-stat-row">
    <div><span>Gini</span><strong>${gini(stats.gini)}</strong></div>
    <div><span>Average</span><strong>${number(stats.mean)}</strong></div>
    <div><span>Median</span><strong>${number(stats.median)}</strong></div>
    <div><span>Middle 80% of households</span><strong>${number(stats.p10)}–${number(stats.p90)}</strong></div>
  </div><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label} distribution for ${stats.count} synthetic households. Equal-width bins include all values. Vertical axis is percentage of households, horizontal axis is nominal units per household.">
    ${axis}${bars}<text x="${L}" y="13">Share of households</text><text x="${W-R}" y="${H-3}" text-anchor="end">Nominal units per household</text></svg>
  <p class="small muted">${stats.zeroCount} households at zero · ${stats.negativeCount} below zero. Every household has equal weight.</p>
  ${!stats.giniDefined?'<p class="small muted">Gini is undefined because the total is nonpositive and household amounts differ.</p>':stats.gini>1?'<p class="small muted">Some household values are negative. The standard Gini can therefore exceed 1.</p>':''}
  <details><summary>All distribution bins</summary><div class="table-wrap"><table><caption>${label} by interval</caption><thead><tr><th scope="col">Nominal units</th><th scope="col">Households</th><th scope="col">Share</th></tr></thead><tbody>
  ${data.bins.map((bin,i)=>`<tr><td>${number(bin.low)} ≤ value ${i===data.bins.length-1?'≤':'&lt;'} ${number(bin.high)}</td><td>${bin.count}</td><td>${percent(bin.share)}</td></tr>`).join('')}</tbody></table></div></details>`;
}

export function renderHouseholds(result,year,benchmark) {
  byId('household-outcomes').classList.remove('hidden');
  const side=byId('distribution-economy').value,run=result.first[side],row=run.rows[year];
  const values=run.householdDistributions[year],name=side==='scenario'?'Scenario':'Reference';
  byId('household-caption').textContent=`Year ${year} · ${name} seed ${run.seed} · ${values.income.length} synthetic households. Distributions show this seed. ${result.params.replications>1?`Trend lines show medians across ${result.params.replications} paired seeds; the shaded range is scenario P2.5–P97.5 (central 95% of seed outcomes).`:'Trend lines show the single paired seed.'}`;
  for(const [key,label,benchmarkKey] of [['incomeGini','Income inequality','incomeGini'],['netWealthGini','Net wealth inequality','netWealthGini']]) {
    const selected=metricValue(row,key),reference=metricValue(result.first.baseline.rows[year],key);
    byId(key+'-value').textContent=gini(selected);
    byId(key+'-comparison').textContent=`Reference seed ${gini(reference)} · ${name} opening ${gini(metricValue(run.rows[0],key))}`;
    byId(key+'-trend').innerHTML=trend(result,key,year,label,benchmark?.[benchmarkKey]);
  }
  for(const [id,sample,label]of [['income-distribution',values.income,'Disposable annual income'],['wealth-distribution',values.wealth,'Recorded financial assets'],['netwealth-distribution',values.netWealth,'Recorded net wealth including dwellings']]) {
    const host=byId(id),expanded=host.querySelector('details')?.open??false;
    host.innerHTML=distributionCard(sample,label);
    host.querySelector('details').open=expanded;
  }
  const income=distributionStats(values.income),wealth=distributionStats(values.wealth);
  byId('household-quintiles').innerHTML=income.quintiles.map((group,i)=>`<tr><th scope="row">${['Lowest 20%','Second 20%','Middle 20%','Fourth 20%','Highest 20%'][i]}</th><td>${percent(group.share)}</td><td>${number(group.mean)}</td><td>${percent(wealth.quintiles[i].share)}</td><td>${number(wealth.quintiles[i].mean)}</td></tr>`).join('');
  byId('household-benchmark-note').textContent=benchmark?.global?`Income benchmark ${gini(benchmark.incomeGini)} · ${benchmark.incomeSource}. Opening financial-wealth Gini ${gini(benchmark.financialWealthGini)} is an explicit missing-data assumption, not a national survey observation. The gold income line shows its source benchmark, not an imposed future target. No comparable net-wealth survey benchmark is available for this preset.`:benchmark
    ? `Income benchmark ${gini(benchmark.incomeGini)} · Eurostat EU-SILC 2024, generally 2023 income. Net-wealth survey reference ${gini(benchmark.netWealthGini)} · ECB HFCS 2023. ${benchmark.wealthFallback?'Wealth data use a euro-area proxy for this preset.':'Wealth inputs match the selected country.'} Survey coverage is broader than recorded model wealth. The dotted gold lines show source references, not fitted net-wealth or future targets.`
    : 'Configured opening Gini targets are applied to synthetic household ranks.';
  byId('household-opening-note').textContent=row.initialObservation
    ? 'Year 0 income and financial-asset Ginis match their configured targets. Net-wealth inequality adds dwelling values and subtracts mortgages; it is not fitted to the broader survey net-wealth Gini. Household ranks are synthetic. Later distributions evolve through earnings, taxes, transfers, saving, investment returns and housing values.'
    : 'Income includes wages, transfers and investment income after modeled direct taxes. Investment purchases, mortgage principal, funded pension withdrawals and valuation gains are excluded from cash income. Public old-age benefits and actual rental income are included; imputed rent is shown in GDP accounts separately.';
  renderDebtExplanation(result,year,side);
  byId('debt-ratio-context').textContent=`Year ${year} · ${name} seed ${run.seed}. Outstanding debt divided by this year’s nominal GDP.`;
  byId('debt-ratio-values').innerHTML=[['publicDebtGDP','Public debt / GDP'],['privateDebtGDP','Private debt / GDP']].map(([key,label])=>
    `<div class="price-result"><span>${label}</span><strong>${ratio(metricValue(row,key))}</strong><small>Reference ${ratio(metricValue(result.first.baseline.rows[year],key))}</small></div>`).join('');
}
