"use strict";
const data=window.CORVALLIS_WEATHER_DATA||[];
const screens=[...document.querySelectorAll(".screen")];
const steps=[...document.querySelectorAll(".steps li")];
const prev=document.querySelector("#previous"), next=document.querySelector("#next"), stepLabel=document.querySelector("#step-label");
let current=0;
const answered={q1:false,q2:false,q3:false,q4:false};
const labels=["Start here","Weather","Temperature","Precipitation","Put it together","Takeaway"];

function show(i){
  current=Math.max(0,Math.min(i,screens.length-1));
  screens.forEach((s,n)=>s.classList.toggle("active",n===current));
  steps.forEach((s,n)=>s.classList.toggle("active",n===current));
  stepLabel.textContent=labels[current];
  prev.disabled=current===0;
  updateNext();
  window.scrollTo({top:0,behavior:"smooth"});
  if(current===1) setTimeout(drawWeatherChart,30);
}
function updateNext(){
  if(current===0){next.disabled=false;next.textContent="Next →";return}
  if(current===1){next.disabled=!answered.q1}
  else if(current===2){next.disabled=!answered.q2}
  else if(current===3){next.disabled=!answered.q3}
  else if(current===4){next.disabled=!answered.q4}
  else {next.disabled=true}
  next.textContent=current===screens.length-2?"Finish →":"Next →";
}
document.querySelector(".begin").addEventListener("click",()=>show(1));
prev.addEventListener("click",()=>show(current-1));
next.addEventListener("click",()=>{if(!next.disabled)show(current+1)});
document.querySelector(".restart").addEventListener("click",()=>{
  Object.keys(answered).forEach(k=>answered[k]=false);
  document.querySelectorAll(".answer").forEach(b=>b.classList.remove("selected","correct","incorrect"));
  document.querySelectorAll(".feedback").forEach(f=>{f.textContent="";f.className="feedback"});
  show(0);
});

function svgEl(name,attrs={},text=""){
  const el=document.createElementNS("http://www.w3.org/2000/svg",name);
  Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
  if(text)el.textContent=text; return el;
}
function drawWeatherChart(){
  const container=document.querySelector("#weather-chart");
  if(!container||!data.length)return;
  const showT=document.querySelector("#show-temperature").checked;
  const showP=document.querySelector("#show-precipitation").checked;
  const width=Math.max(650,container.clientWidth||900),height=360;
  const m={top:20,right:58,bottom:45,left:55},pw=width-m.left-m.right,ph=height-m.top-m.bottom;
  const svg=svgEl("svg",{viewBox:`0 0 ${width} ${height}`,width:"100%",height:"100%","aria-hidden":"true"});
  const x=i=>m.left+i*pw/(data.length-1), yT=v=>m.top+ph-(v-40)/(110-40)*ph, yP=v=>m.top+ph-v/1.6*ph;
  [40,60,80,100].forEach(v=>{svg.append(svgEl("line",{x1:m.left,x2:width-m.right,y1:yT(v),y2:yT(v),stroke:"#ddd8cd","stroke-width":"1"}));svg.append(svgEl("text",{x:m.left-9,y:yT(v)+4,"text-anchor":"end",fill:"#5d675f","font-size":"12"},`${v}°`))});
  if(showP){const bw=Math.max(2,pw/data.length-.5);data.forEach((d,i)=>{if(d.precipitation>0){let top=yP(d.precipitation);svg.append(svgEl("rect",{x:x(i)-bw/2,y:top,width:bw,height:m.top+ph-top,fill:"#39768c",opacity:".7",rx:".5"}))}})}
  if(showT){let pts=data.map((d,i)=>`${x(i)},${yT(d.maxTemp)}`).join(" ");svg.append(svgEl("polyline",{points:pts,fill:"none",stroke:"#b84c24","stroke-width":"2.4","stroke-linejoin":"round","stroke-linecap":"round"}))}
  data.map((d,i)=>({d,i})).filter(({d,i})=>i===0||d.date.slice(5,7)!==data[i-1].date.slice(5,7)).forEach(({d,i})=>svg.append(svgEl("text",{x:x(i),y:height-15,"text-anchor":i===0?"start":"middle",fill:"#5d675f","font-size":"12","font-weight":"700"},new Date(`${d.date}T12:00:00`).toLocaleDateString("en-US",{month:"short"}))));
  svg.append(svgEl("text",{x:15,y:height/2,transform:`rotate(-90 15 ${height/2})`,"text-anchor":"middle",fill:"#b84c24","font-size":"12","font-weight":"700"},"Daily maximum temperature (°F)"));
  if(showP)svg.append(svgEl("text",{x:width-8,y:height/2,transform:`rotate(90 ${width-8} ${height/2})`,"text-anchor":"middle",fill:"#39768c","font-size":"12","font-weight":"700"},"Daily precipitation (inches)"));
  container.replaceChildren(svg);
}
document.querySelectorAll("#show-temperature,#show-precipitation").forEach(el=>el.addEventListener("change",drawWeatherChart));

const tableBody=document.querySelector("#daily-table-body");
data.forEach(d=>{const tr=document.createElement("tr");tr.innerHTML=`<td>${new Date(d.date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}</td><td>${d.maxTemp.toFixed(0)}</td><td>${d.precipitation.toFixed(2)}</td>`;tableBody.appendChild(tr)});
document.querySelector("#toggle-daily-table").addEventListener("click",e=>{
  const wrap=document.querySelector("#daily-table-wrap"),opening=wrap.hidden;wrap.hidden=!opening;e.currentTarget.setAttribute("aria-expanded",String(opening));e.currentTarget.textContent=opening?"Hide accessible daily data table":"View accessible daily data table";
});

document.querySelectorAll(".answer-stack").forEach(group=>{
  group.querySelectorAll(".answer").forEach(btn=>btn.addEventListener("click",()=>{
    const q=group.dataset.question, feedback=document.querySelector(`#${q}-feedback`);
    group.querySelectorAll(".answer").forEach(b=>b.classList.remove("selected","correct","incorrect"));
    btn.classList.add("selected");
    const correct=btn.dataset.correct==="true";
    btn.classList.add(correct?"correct":"incorrect");
    if(correct){
      answered[q]=true; feedback.className="feedback good";
      if(q==="q1") feedback.innerHTML="<strong>Yes.</strong> Even though the graph covers six months, it is still weather because it shows conditions from one particular year.";
      if(q==="q2") feedback.innerHTML="<strong>Yes.</strong> 76.0°F is 1.1°F higher than the 74.9°F climate normal, so the 2024 growing season was warmer than usual.";
      if(q==="q3") feedback.innerHTML="<strong>Yes.</strong> 8.11 inches is 0.79 inches less than the 8.90-inch climate normal, so the 2024 growing season was drier than usual.";
      if(q==="q4") feedback.innerHTML="<strong>Exactly.</strong> You used the climate normal to put the 2024 weather in context: the growing season was warmer and drier than usual.";
    }else{
      feedback.className="feedback try";
      if(q==="q1") feedback.textContent="Try again. Think about whether this record describes one particular year or a pattern across many years.";
      if(q==="q2") feedback.textContent="Try again. Compare 76.0°F with 74.9°F.";
      if(q==="q3") feedback.textContent="Try again. Compare 8.11 inches with 8.90 inches.";
      if(q==="q4") feedback.textContent="Try again. Use both comparisons: was 2024 warmer or cooler, and wetter or drier?";
    }
    updateNext();
  }))
});
window.addEventListener("resize",()=>{if(current===1){clearTimeout(window._rt);window._rt=setTimeout(drawWeatherChart,100)}});
drawWeatherChart();show(0);
