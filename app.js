"use strict";
const DATA = window.CORVALLIS_WEATHER_DATA || [];
let current = 0;
let dailyBuilt = false;
let tempPredictionMade = false;
let rainPredictionMade = false;
let storyComplete = false;
let temperatureViewedSolo = false;
let precipitationViewedSolo = false;

const screens = [...document.querySelectorAll(".screen")];
const stepItems = [...document.querySelectorAll(".steps li")];
const prev = document.querySelector("#previous");
const next = document.querySelector("#next");
const label = document.querySelector("#step-label");
const labels = ["Start here", "Pull apart the layers", "What can an average hide?", "When did the rain fall?", "Build the weather story", "Complete"];

function screenReady(index) {
  if (index === 0) return false;
  if (index === 1) return temperatureViewedSolo && precipitationViewedSolo;
  if (index === 2) return tempPredictionMade;
  if (index === 3) return rainPredictionMade;
  if (index === 4) return storyComplete;
  return false;
}

function updateNext() {
  next.disabled = current === 0 || current === screens.length - 1 || !screenReady(current);
  next.textContent = current === 4 ? "See what you found →" : "Next →";
}

function show(i) {
  current = Math.max(0, Math.min(i, screens.length - 1));
  screens.forEach((s, n) => s.classList.toggle("active", n === current));
  stepItems.forEach((s, n) => {
    s.classList.toggle("active", n === current);
    s.classList.toggle("complete", n < current);
  });
  prev.disabled = current === 0;
  label.textContent = labels[current];
  updateNext();
  if (current === 1) drawWeatherChart();
  if (current === 3 && rainPredictionMade) drawRainChart();
  window.scrollTo({top:0, behavior:"smooth"});
}

document.querySelector(".begin").addEventListener("click", () => show(1));
prev.addEventListener("click", () => show(current - 1));
next.addEventListener("click", () => show(current + 1));

function resetActivity() {
  tempPredictionMade = false;
  rainPredictionMade = false;
  storyComplete = false;
  temperatureViewedSolo = false;
  precipitationViewedSolo = false;
  document.querySelector("#show-temperature").checked = true;
  document.querySelector("#show-precipitation").checked = true;
  document.querySelector("#temp-covered").hidden = false;
  document.querySelector("#temp-revealed").hidden = true;
  document.querySelectorAll(".temp-prediction,.rain-choice,.evidence-chip").forEach(b => b.classList.remove("selected","correct-pick","wrong-pick"));
  document.querySelector("#rain-reveal").hidden = true;
  document.querySelector("#story-list").innerHTML = '<li class="placeholder">Choose evidence cards to build the note.</li>';
  document.querySelector("#story-status").textContent = "";
  drawWeatherChart();
  show(0);
}
document.querySelector(".restart").addEventListener("click", resetActivity);

function buildDaily() {
  if (dailyBuilt) return;
  const body = document.querySelector("#daily-table-body");
  const frag = document.createDocumentFragment();
  DATA.forEach(d => {
    const r = document.createElement("tr"), a = document.createElement("th"), b = document.createElement("td"), c = document.createElement("td");
    a.scope = "row";
    a.textContent = new Date(`${d.date}T12:00:00`).toLocaleDateString("en-US", {month:"short", day:"numeric"});
    b.textContent = d.maxTemp.toFixed(1);
    c.textContent = d.precipitation.toFixed(2);
    r.append(a,b,c); frag.appendChild(r);
  });
  body.appendChild(frag); dailyBuilt = true;
}

document.querySelector("#toggle-daily-table").addEventListener("click", e => {
  const wrap = document.querySelector("#daily-table-wrap");
  const open = wrap.hidden;
  if (open) buildDaily();
  wrap.hidden = !open;
  e.currentTarget.setAttribute("aria-expanded", String(open));
  e.currentTarget.textContent = open ? "Hide daily data table" : "View accessible daily data table";
});

function trackLayers() {
  const t = document.querySelector("#show-temperature").checked;
  const p = document.querySelector("#show-precipitation").checked;
  if (t && !p) temperatureViewedSolo = true;
  if (!t && p) precipitationViewedSolo = true;
  const notice = document.querySelector("#layer-notice");
  if (temperatureViewedSolo && precipitationViewedSolo) {
    notice.innerHTML = "<strong>You’ve viewed both layers on their own.</strong> Notice how separating them changes what stands out.";
    notice.classList.add("ready");
  } else if (temperatureViewedSolo || precipitationViewedSolo) {
    notice.textContent = "Nice. Now isolate the other layer too.";
  } else {
    notice.textContent = "Try viewing each layer by itself before moving on.";
  }
  updateNext();
}

document.querySelector("#show-temperature").addEventListener("change", () => { trackLayers(); drawWeatherChart(); });
document.querySelector("#show-precipitation").addEventListener("change", () => { trackLayers(); drawWeatherChart(); });

function drawWeatherChart() {
  const container = document.querySelector("#weather-chart");
  const showTemperature = document.querySelector("#show-temperature").checked;
  const showPrecipitation = document.querySelector("#show-precipitation").checked;
  const width = Math.max(container.clientWidth || 700, 320), height = 420;
  const margin = {top:34,right:64,bottom:46,left:64};
  const plotWidth = width-margin.left-margin.right, plotHeight = height-margin.top-margin.bottom;
  const ns="http://www.w3.org/2000/svg", svg=document.createElementNS(ns,"svg");
  svg.setAttribute("viewBox",`0 0 ${width} ${height}`); svg.setAttribute("aria-hidden","true");
  const add=(tag,attrs={},text="")=>{const el=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));if(text)el.textContent=text;svg.appendChild(el);return el;};
  const css=getComputedStyle(document.documentElement), grid=css.getPropertyValue("--line").trim(), muted=css.getPropertyValue("--muted").trim(), temp=css.getPropertyValue("--orange").trim(), rain=css.getPropertyValue("--blue").trim(), ink=css.getPropertyValue("--ink").trim();
  const temps=DATA.map(d=>d.maxTemp), pr=DATA.map(d=>d.precipitation);
  const tmin=Math.floor((Math.min(...temps)-5)/5)*5, tmax=Math.ceil((Math.max(...temps)+5)/5)*5, pmax=Math.max(1.5,Math.ceil(Math.max(...pr)*4)/4);
  const x=i=>margin.left+i/Math.max(DATA.length-1,1)*plotWidth, yt=v=>margin.top+(tmax-v)/(tmax-tmin)*plotHeight, yp=v=>margin.top+plotHeight-v/pmax*plotHeight;
  for(let i=0;i<=5;i++){const f=i/5,y=margin.top+plotHeight-f*plotHeight;add("line",{x1:margin.left,y1:y,x2:width-margin.right,y2:y,stroke:grid});add("text",{x:margin.left-9,y:y+4,"text-anchor":"end",fill:temp,"font-size":12,"font-weight":700},`${Math.round(tmin+f*(tmax-tmin))}°`);add("text",{x:width-margin.right+9,y:y+4,"text-anchor":"start",fill:rain,"font-size":12,"font-weight":700},(f*pmax).toFixed(2));}
  add("text",{x:17,y:height/2,transform:`rotate(-90 17 ${height/2})`,"text-anchor":"middle",fill:temp,"font-size":12,"font-weight":700},"Daily high temperature (°F)");
  add("text",{x:width-13,y:height/2,transform:`rotate(90 ${width-13} ${height/2})`,"text-anchor":"middle",fill:rain,"font-size":12,"font-weight":700},"Daily precipitation (inches)");
  DATA.map((d,i)=>({d,i})).filter(({d,i})=>i===0||d.date.slice(5,7)!==DATA[i-1].date.slice(5,7)).forEach(({d,i})=>add("text",{x:x(i),y:height-16,"text-anchor":i===0?"start":"middle",fill:muted,"font-size":12},new Date(`${d.date}T12:00:00`).toLocaleDateString("en-US",{month:"short"})));
  if(showPrecipitation){const bw=Math.max(1.2,plotWidth/DATA.length-.35);DATA.forEach((d,i)=>{if(d.precipitation<=0)return;const top=yp(d.precipitation);add("rect",{x:x(i)-bw/2,y:top,width:bw,height:margin.top+plotHeight-top,fill:rain,opacity:.78});});}
  if(showTemperature)add("polyline",{points:DATA.map((d,i)=>`${x(i)},${yt(d.maxTemp)}`).join(" "),fill:"none",stroke:temp,"stroke-width":2.6,"stroke-linejoin":"round","stroke-linecap":"round"});
  let legendX=margin.left;if(showTemperature){add("line",{x1:legendX,y1:16,x2:legendX+22,y2:16,stroke:temp,"stroke-width":4});add("text",{x:legendX+29,y:20,fill:ink,"font-size":12},"Daily high temperature");legendX+=165;}if(showPrecipitation){add("rect",{x:legendX,y:10,width:15,height:12,fill:rain,opacity:.78});add("text",{x:legendX+22,y:20,fill:ink,"font-size":12},"Daily precipitation");}
  if(!showTemperature&&!showPrecipitation)add("text",{x:width/2,y:height/2,"text-anchor":"middle",fill:muted,"font-size":15},"Turn on a data layer to display it.");
  container.replaceChildren(svg);
}

function drawRainChart() {
  const container=document.querySelector("#rain-chart"), subset=DATA.filter(d=>d.date>="2024-06-01"&&d.date<="2024-08-31");
  const width=Math.max(container.clientWidth||700,320),height=340,margin={top:24,right:42,bottom:42,left:55},plotWidth=width-margin.left-margin.right,plotHeight=height-margin.top-margin.bottom,ns="http://www.w3.org/2000/svg";
  const svg=document.createElementNS(ns,"svg");svg.setAttribute("viewBox",`0 0 ${width} ${height}`);svg.setAttribute("aria-hidden","true");
  const add=(tag,attrs={},text="")=>{const el=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));if(text)el.textContent=text;svg.appendChild(el);return el;};
  const css=getComputedStyle(document.documentElement),line=css.getPropertyValue("--line").trim(),muted=css.getPropertyValue("--muted").trim(),blue=css.getPropertyValue("--blue").trim();
  const max=Math.max(1.5,Math.ceil(Math.max(...subset.map(d=>d.precipitation))*4)/4),x=i=>margin.left+i/Math.max(subset.length-1,1)*plotWidth,y=v=>margin.top+plotHeight-v/max*plotHeight;
  for(let i=0;i<=4;i++){const val=max*i/4,yy=margin.top+plotHeight-i/4*plotHeight;add("line",{x1:margin.left,y1:yy,x2:width-margin.right,y2:yy,stroke:line});add("text",{x:margin.left-8,y:yy+4,"text-anchor":"end",fill:blue,"font-size":12},val.toFixed(2));}
  const bw=Math.max(2,plotWidth/subset.length-.4);subset.forEach((d,i)=>{if(d.precipitation<=0)return;const top=y(d.precipitation);add("rect",{x:x(i)-bw/2,y:top,width:bw,height:margin.top+plotHeight-top,fill:blue,opacity:.82,rx:.7});});
  subset.map((d,i)=>({d,i})).filter(({d,i})=>i===0||d.date.slice(5,7)!==subset[i-1].date.slice(5,7)).forEach(({d,i})=>add("text",{x:x(i),y:height-14,"text-anchor":i===0?"start":"middle",fill:muted,"font-size":12,"font-weight":700},new Date(`${d.date}T12:00:00`).toLocaleDateString("en-US",{month:"short"})));
  add("text",{x:16,y:height/2,transform:`rotate(-90 16 ${height/2})`,"text-anchor":"middle",fill:blue,"font-size":12,"font-weight":700},"Daily precipitation (inches)");
  container.replaceChildren(svg);
}

document.querySelectorAll(".temp-prediction").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".temp-prediction").forEach(b=>b.classList.remove("selected"));btn.classList.add("selected");tempPredictionMade=true;
  document.querySelector("#temp-covered").hidden=true;document.querySelector("#temp-revealed").hidden=false;updateNext();
}));

document.querySelectorAll(".rain-choice").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".rain-choice").forEach(b=>b.classList.remove("selected"));btn.classList.add("selected");rainPredictionMade=true;
  document.querySelector("#rain-reveal").hidden=false;drawRainChart();updateNext();
}));

const storyList=document.querySelector("#story-list");
function rebuildStoryList(){
  const selected=[...document.querySelectorAll('.evidence-chip.selected[data-correct="true"]')];
  storyList.innerHTML="";
  if(!selected.length){storyList.innerHTML='<li class="placeholder">Choose evidence cards to build the note.</li>';return;}
  selected.forEach(btn=>{const li=document.createElement("li");li.textContent=btn.dataset.text;storyList.appendChild(li);});
}
document.querySelectorAll(".evidence-chip").forEach(btn=>btn.addEventListener("click",()=>{
  btn.classList.toggle("selected");btn.classList.remove("correct-pick","wrong-pick");document.querySelector("#story-status").textContent="";storyComplete=false;rebuildStoryList();updateNext();
}));

document.querySelector("#check-story").addEventListener("click",()=>{
  const chips=[...document.querySelectorAll(".evidence-chip")];
  const correct=chips.filter(b=>b.dataset.correct==="true"), wrong=chips.filter(b=>b.dataset.correct==="false");
  wrong.forEach(b=>b.classList.toggle("wrong-pick",b.classList.contains("selected")));
  correct.forEach(b=>b.classList.toggle("correct-pick",b.classList.contains("selected")));
  const missing=correct.filter(b=>!b.classList.contains("selected"));
  const selectedWrong=wrong.filter(b=>b.classList.contains("selected"));
  const status=document.querySelector("#story-status");
  if(!missing.length&&!selectedWrong.length){storyComplete=true;status.innerHTML="<strong>That story is fully supported.</strong> You used both summaries and details from within the season.";status.className="story-status success";}
  else {storyComplete=false;status.innerHTML="Almost there. Remove any card the data contradicts, and look for supported evidence you may have missed.";status.className="story-status try-again";}
  updateNext();
});

window.addEventListener("resize",()=>{clearTimeout(window._resizeTimer);window._resizeTimer=setTimeout(()=>{if(current===1)drawWeatherChart();if(current===3&&rainPredictionMade)drawRainChart();},120);});
drawWeatherChart();show(0);
