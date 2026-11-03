/* Luminance in-game menu (Episode 1).
   Esc or M (or the Menu tag, top right) pauses and opens it. Tabs: Previously, Case File (Hae), Memory (Ji-yoo),
   Seoul, Records, Settings, plus Resume and Quit to title. Also: the 기억 tag hunt and the grey-gap fragment hidden
   in the room. Progress and settings are saved in this browser (localStorage "lum-save").
   Story text here is drafted from the storyboard and script; rewrite freely. */
(()=>{
const stage=document.getElementById("stage");
if(!stage) return;

/* ---------- saved progress + settings ---------- */
const DEF={mem:{},frag:[],tags:[],settings:{music:1,sfx:1,ko:true,calm:false,hold:true}};
// TESTING SWITCH: while true, every load starts the game fresh (finds, quests and what's been seen reset; Settings are kept).
// Set it to false to keep players' progress between visits again.
const FRESH_START=true;
let S; try{const old=JSON.parse(localStorage.getItem("lum-save")||"{}");
  // walking through a door into the next room carries the game on (the fresh start is only for a new visit)
  let carry=false; try{carry=sessionStorage.getItem("lum-carry")==="1"; sessionStorage.removeItem("lum-carry");}catch(e){}
  S=FRESH_START&&!carry?JSON.parse(JSON.stringify(DEF)):Object.assign({},DEF,old);
  // starting straight in a later room: what happened in the earlier ones already happened (the door opened, she was met), so it isn't announced again
  if((window.LUM_ROOM||1)>=2){S.met=S.met||["ji-yoo"]; if(!S.met.includes("scientist")) S.met.push("scientist"); S.q=S.q||{}; S.q.door=Object.assign({},S.q.door,{announced:true,doneAnnounced:true,seen:true,seenDone:true});} S.settings=Object.assign({},DEF.settings,old.settings||{}); S.mem=S.mem||{};}
catch(e){S=JSON.parse(JSON.stringify(DEF));}
const save=()=>{try{localStorage.setItem("lum-save",JSON.stringify(S));}catch(e){}};
const apply=()=>{const st=S.settings;
  window.LUM_MUSIC=st.music; window.LUM_SFX=st.sfx; window.LUM_HOLD=st.hold;
  document.documentElement.classList.toggle("no-ko",!st.ko);
  document.documentElement.classList.toggle("calm",st.calm);
  try{if(typeof begun!=="undefined"&&begun){roomTo(recOn?.08:ROOM_VOL,300); recTo(recOn?.32:0,300);}}catch(e){}};
apply();

/* ---------- styles ---------- */
const css=`
.gm-bar{position:absolute;right:2.2%;top:4.5%;z-index:20;display:flex;gap:10px;opacity:0;transition:opacity .8s;pointer-events:none}
.gm-bar.on{opacity:1;pointer-events:auto}
.gm-btn{position:relative;display:flex;align-items:center;gap:10px;padding:7px 14px 7px 12px;color:#fff;cursor:var(--cur-hover,pointer);
  font:600 11px var(--mono);letter-spacing:.2em;text-transform:uppercase;background:linear-gradient(135deg,rgba(16,34,62,.62),rgba(8,20,42,.42));border:1px solid rgba(125,218,255,.55);
  border-radius:3px 11px 3px 11px;box-shadow:0 0 14px rgba(51,198,255,.22),inset 0 0 12px rgba(51,198,255,.1);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);opacity:.82;transition:opacity .3s,box-shadow .2s}
.gm-btn:hover{opacity:1;box-shadow:0 0 22px rgba(51,198,255,.45),inset 0 0 12px rgba(51,198,255,.16)}
.gm-btn i{display:grid;gap:3px}.gm-btn i b{display:block;width:13px;height:1.5px;background:#bff4ff;box-shadow:0 0 6px #33c6ff}
.gm-btn small{font:500 10px "Apple SD Gothic Neo","Noto Sans KR",sans-serif;letter-spacing:.1em;color:#bff4ff;opacity:.8;text-transform:none}
.gm-btn kbd{font:600 9.5px var(--mono);padding:1px 5px;border:1px solid rgba(191,244,255,.5);border-radius:3px;color:#bff4ff;letter-spacing:.05em}
.gm{position:fixed;inset:0;z-index:60;display:grid;place-items:center;background:radial-gradient(ellipse at 50% 40%,rgba(8,22,44,.55),rgba(2,8,18,.82));
  backdrop-filter:blur(9px) saturate(1.2);-webkit-backdrop-filter:blur(9px) saturate(1.2);opacity:0;pointer-events:none;transition:opacity .35s}
.gm.on{opacity:1;pointer-events:auto}
.gm-panel{position:relative;width:min(980px,94vw);height:min(620px,88vh);display:grid;grid-template-columns:230px minmax(0,1fr);color:#eaf8ff;
  background:linear-gradient(150deg,rgba(18,40,72,.78),rgba(6,16,34,.72));border:1px solid rgba(125,218,255,.55);border-radius:4px 22px 4px 22px;
  box-shadow:0 0 0 1px rgba(51,198,255,.08),0 0 40px rgba(51,198,255,.22),inset 0 0 40px rgba(51,198,255,.08),0 30px 80px rgba(0,0,0,.5);
  transform:translateY(10px) scale(.985);transition:transform .45s cubic-bezier(.2,1.2,.3,1);overflow:hidden}
.gm.on .gm-panel{transform:none}
.gm-panel::before{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 3px)}
.gm-panel .tk{position:absolute;width:14px;height:14px;pointer-events:none;filter:drop-shadow(0 0 5px #33c6ff)}
.gm-panel .tk.a{left:-7px;top:-7px;border-top:2px solid #bff4ff;border-left:2px solid #bff4ff}.gm-panel .tk.b{right:-7px;bottom:-7px;border-bottom:2px solid #bff4ff;border-right:2px solid #bff4ff}
.gm-nav{position:relative;display:flex;flex-direction:column;gap:3px;padding:26px 14px 18px;border-right:1px solid rgba(125,218,255,.28)}
.gm-nav h2{margin:0 10px 4px;font:400 17px var(--display);letter-spacing:.14em;color:#fff;text-shadow:0 0 14px rgba(120,215,255,.6)}
.gm-nav .sub{margin:0 10px 18px;font:500 10px var(--mono);letter-spacing:.2em;text-transform:uppercase;color:#7fdcff}
.gm-nav button{all:unset;cursor:var(--cur-hover,pointer);display:grid;grid-template-columns:1fr auto;align-items:baseline;padding:9px 12px;border-radius:3px 10px 3px 10px;border:1px solid transparent;transition:background .2s,border-color .2s}
.gm-nav button b{font:600 12px var(--mono);letter-spacing:.16em;text-transform:uppercase}
.gm-nav button small{font:500 10.5px "Apple SD Gothic Neo","Noto Sans KR",sans-serif;color:#9fdcf5;opacity:.75}
.gm-nav button:hover,.gm-nav button:focus-visible{background:rgba(120,215,255,.08);border-color:rgba(125,218,255,.3)}
.gm-nav button[aria-current="true"]{background:rgba(120,215,255,.14);border-color:rgba(125,218,255,.7);box-shadow:0 0 16px rgba(51,198,255,.25)}
.gm-nav button[aria-current="true"] b{color:#fff;text-shadow:0 0 10px rgba(120,215,255,.8)}
.gm-nav .sp{flex:1}
.gm-nav button.q b{color:#ffb8c8}
.gm-body{position:relative;overflow:auto;padding:30px 34px 34px;scrollbar-width:thin}
.gm-body h3{margin:0 0 4px;font:400 22px var(--display);letter-spacing:.1em;color:#fff;text-shadow:0 0 16px rgba(120,215,255,.55)}
.gm-body .ko{font:500 12px "Apple SD Gothic Neo","Noto Sans KR",sans-serif;color:#9fdcf5;letter-spacing:.1em}
.gm-body h4{margin:24px 0 10px;display:flex;align-items:center;gap:10px;font:600 10.5px var(--mono);letter-spacing:.22em;text-transform:uppercase;color:#7fdcff}
.gm-body h4::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(125,218,255,.5),transparent)}
.gm-body h4 em{font-style:normal;color:#bff4ff;opacity:.8;letter-spacing:.1em}
.gm-body p{margin:0 0 12px;font:400 14.5px/1.6 "IBM Plex Sans",ui-sans-serif,system-ui,sans-serif;color:#d6ecf7}
.gm-lead{font-size:16px!important;color:#fff!important}
.gm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px}
.gm-card{position:relative;padding:14px 16px 15px;border-radius:3px 12px 3px 12px;background:rgba(120,215,255,.06);border:1px solid rgba(125,218,255,.35)}
.gm-card b{display:block;margin-bottom:5px;font:600 12px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:#fff}
.gm-card span{display:block;font:400 13px/1.5 "IBM Plex Sans",ui-sans-serif,system-ui,sans-serif;color:#cfe6f2}
.gm-card.new{border-color:#bff4ff;box-shadow:0 0 18px rgba(51,198,255,.35)}
.gm-card.new::after{content:"New";position:absolute;right:10px;top:10px;font:600 9px var(--mono);letter-spacing:.2em;text-transform:uppercase;color:#06142a;background:#bff4ff;padding:2px 6px;border-radius:3px}
.gm-card.locked{background:repeating-linear-gradient(135deg,rgba(255,255,255,.025) 0 6px,transparent 6px 12px);border-style:dashed;border-color:rgba(125,218,255,.22)}
.gm-card.locked b{color:#7c98ad}.gm-card.locked span{color:#6d8597;font-style:italic}
.gm-count{display:inline-flex;gap:6px;align-items:center;margin-left:auto;font:600 10.5px var(--mono);letter-spacing:.1em;color:#bff4ff}
.gm-pips{display:flex;gap:6px;margin:6px 0 4px}.gm-pips i{width:10px;height:10px;border-radius:50%;border:1px solid rgba(191,244,255,.6)}.gm-pips i.on{background:#bff4ff;box-shadow:0 0 8px #33c6ff}
.gm-rec{display:flex;align-items:center;gap:14px;padding:12px 14px;border-radius:3px 12px 3px 12px;border:1px solid rgba(125,218,255,.35);background:rgba(120,215,255,.05);margin-bottom:10px}
.gm-rec.locked{opacity:.5;border-style:dashed}
.gm-rec button{all:unset;cursor:var(--cur-hover,pointer);width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#f2fdff,#8fe2ff);color:#06142a;font-size:13px;box-shadow:0 0 12px rgba(51,198,255,.6)}
.gm-rec button:disabled{background:rgba(255,255,255,.12);color:#6d8597;box-shadow:none;cursor:default}
.gm-rec div{flex:1}.gm-rec b{display:block;font:600 12.5px var(--mono);letter-spacing:.1em;color:#fff}.gm-rec span{font:400 12.5px "IBM Plex Sans",sans-serif;color:#9fc3d6}
.gm-rec .eq{display:flex;gap:2px;align-items:flex-end;height:16px}.gm-rec .eq i{width:3px;background:#bff4ff;height:30%;border-radius:1px;opacity:.3}
.gm-rec.playing .eq i{opacity:1;animation:eq .9s ease-in-out infinite alternate}.gm-rec .eq i:nth-child(2){animation-delay:.2s}.gm-rec .eq i:nth-child(3){animation-delay:.45s}
@keyframes eq{from{height:20%}to{height:100%}}
.gm-set{display:grid;grid-template-columns:1fr auto;align-items:center;gap:16px;padding:13px 0;border-bottom:1px solid rgba(125,218,255,.15)}
.gm-set b{display:block;font:600 12px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:#fff}.gm-set span{font:400 12.5px "IBM Plex Sans",sans-serif;color:#9fc3d6}
.gm-set input[type=range]{width:180px;accent-color:#7fdcff}
.gm-tog{all:unset;cursor:var(--cur-hover,pointer);position:relative;width:44px;height:24px;border-radius:12px;background:rgba(255,255,255,.12);border:1px solid rgba(125,218,255,.4);transition:background .2s}
.gm-tog::after{content:"";position:absolute;left:3px;top:3px;width:16px;height:16px;border-radius:50%;background:#cfe6f2;transition:transform .2s}
.gm-tog[aria-checked="true"]{background:rgba(51,198,255,.45)}.gm-tog[aria-checked="true"]::after{transform:translateX(20px);background:#fff;box-shadow:0 0 8px #33c6ff}
.gm-obj{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;border-left:2px solid #7fdcff;background:linear-gradient(90deg,rgba(120,215,255,.1),transparent)}
.gm-obj b{font:600 12px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:#7fdcff}
.gm-place{display:grid;grid-template-columns:120px 1fr;gap:14px;align-items:center;padding:10px;border-radius:3px 12px 3px 12px;border:1px solid rgba(125,218,255,.3);margin-bottom:10px;background:rgba(120,215,255,.04)}
.gm-place img{width:120px;height:70px;object-fit:cover;border-radius:3px 9px 3px 9px}
.gm-place.locked{opacity:.55}.gm-place.locked img{filter:grayscale(1) brightness(.5) blur(1px)}
.gm-place b{display:block;font:600 12px var(--mono);letter-spacing:.1em;color:#fff}.gm-place small{display:block;font:500 10px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:#7fdcff;margin:2px 0 5px}
.gm-place span{font:400 12.5px/1.45 "IBM Plex Sans",sans-serif;color:#cfe6f2}
.gm-place .here{font:600 9px var(--mono);letter-spacing:.2em;text-transform:uppercase;color:#06142a;background:#bff4ff;padding:2px 6px;border-radius:3px;margin-left:6px}
/* a little count on a button when something new is waiting */
.gm-badge{position:absolute;right:-7px;top:-8px;min-width:18px;height:18px;padding:0 5px;border-radius:9px;display:none;place-items:center;
  font:700 10px var(--mono);letter-spacing:0;color:#06142a;background:#bff4ff;box-shadow:0 0 0 2px rgba(8,20,42,.85),0 0 12px #33c6ff}
.gm-badge.on{display:grid;animation:badgein .45s cubic-bezier(.2,1.6,.4,1)}
@keyframes badgein{from{transform:scale(0)}}
.gm-btn .ic{width:13px;height:13px;flex:none}.gm-btn .ic path,.gm-btn .ic circle{fill:none;stroke:#bff4ff;stroke-width:1.6;stroke-linecap:round;filter:drop-shadow(0 0 3px #33c6ff)}
/* the quest pill: bright and straight, so it reads differently from the dark tilted action labels */
.gm-pill{position:absolute;left:50%;top:3.5%;z-index:22;display:flex;align-items:center;gap:12px;padding:7px 20px 7px 7px;border-radius:999px;pointer-events:none;
  background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(226,246,255,.86));color:#082a5c;border:1px solid rgba(255,255,255,.9);
  box-shadow:0 0 0 1px rgba(51,198,255,.35),0 0 26px rgba(51,198,255,.45),0 12px 30px rgba(6,20,42,.35);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  opacity:0;transform:translate(-50%,-140%);transition:opacity .35s,transform .55s cubic-bezier(.2,1.35,.3,1)}
.gm-pill.on{opacity:1;transform:translate(-50%,0)}
.gm-pill .ic{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;flex:none;background:radial-gradient(circle at 40% 35%,#ffffff,#9fe8ff 70%);box-shadow:0 0 0 2px rgba(51,198,255,.35),0 0 12px rgba(51,198,255,.7);color:#0a5fd6;font:700 14px var(--mono)}
.gm-pill.done .ic{background:radial-gradient(circle at 40% 35%,#fff,#7fe0b0 75%);box-shadow:0 0 0 2px rgba(60,190,130,.35),0 0 12px rgba(80,210,150,.7);color:#0b6b45}
.gm-pill small{display:block;font:600 9.5px var(--mono);letter-spacing:.22em;text-transform:uppercase;color:#0a5fd6}
.gm-pill.done small{color:#13804f}
.gm-pill b{display:block;font:600 14px "IBM Plex Sans",ui-sans-serif,system-ui,sans-serif;letter-spacing:.01em;white-space:nowrap}
.gm-pill em{font:500 11px "Apple SD Gothic Neo","Noto Sans KR",sans-serif;font-style:normal;color:#3d6ea8;margin-left:8px}
/* quests */
.gm-q{display:grid;grid-template-columns:22px 1fr auto;gap:12px;align-items:start;padding:13px 15px;margin-bottom:9px;border-radius:3px 12px 3px 12px;border:1px solid rgba(125,218,255,.35);background:rgba(120,215,255,.05)}
.gm-q .ck{width:16px;height:16px;margin-top:2px;border-radius:50%;border:1.5px solid #bff4ff;box-shadow:0 0 8px rgba(51,198,255,.5)}
.gm-q.done{opacity:.62}.gm-q.done .ck{background:#bff4ff;box-shadow:0 0 10px #33c6ff}
.gm-q.done b{text-decoration:line-through;text-decoration-color:rgba(191,244,255,.7)}
.gm-q b{display:block;font:600 13.5px "IBM Plex Sans",ui-sans-serif,sans-serif;color:#fff}
.gm-q span{display:block;font:400 12.5px/1.45 "IBM Plex Sans",sans-serif;color:#9fc3d6;margin-top:2px}
.gm-q small{font:500 11px "Apple SD Gothic Neo","Noto Sans KR",sans-serif;color:#9fdcf5;opacity:.8;margin-left:6px}
.gm-q .kind{font:600 9px var(--mono);letter-spacing:.2em;text-transform:uppercase;padding:3px 7px;border-radius:3px;white-space:nowrap}
.gm-q .kind.main{color:#06142a;background:#bff4ff}.gm-q .kind.side{color:#bff4ff;border:1px solid rgba(191,244,255,.5)}
.gm-q.new{border-color:#bff4ff;box-shadow:0 0 16px rgba(51,198,255,.3)}
/* toast when something new is found */
.gm-toast{display:none;position:absolute;right:2.2%;top:12%;z-index:21;max-width:300px;padding:11px 16px 12px;color:#fff;pointer-events:none;
  background:linear-gradient(135deg,rgba(16,34,62,.82),rgba(8,20,42,.66));border:1px solid rgba(125,218,255,.6);border-radius:3px 12px 3px 12px;
  box-shadow:0 0 22px rgba(51,198,255,.35),inset 0 0 14px rgba(51,198,255,.14);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
  opacity:0;transform:translateX(12px) rotate(-1.5deg);transition:opacity .4s,transform .45s cubic-bezier(.2,1.3,.3,1)}
.gm-toast.on{opacity:1;transform:rotate(-1.5deg)}
.gm-toast small{display:block;font:600 9.5px var(--mono);letter-spacing:.22em;text-transform:uppercase;color:#7fdcff;margin-bottom:3px}
.gm-toast b{font:600 13px var(--mono);letter-spacing:.06em}
/* hidden things in the room */
.gm-tag{position:absolute;left:16.6%;top:69.4%;z-index:6;font:700 9px "Apple SD Gothic Neo","Noto Sans KR",sans-serif;letter-spacing:.05em;color:rgba(84,64,44,.42);
  text-shadow:0 1px 0 rgba(255,250,240,.35);transform:rotate(-6deg);cursor:var(--cur-hover,pointer);padding:4px;transition:color .3s,text-shadow .3s}
.gm-tag.cool{color:rgba(70,86,110,.42)}.gm-tag.cool:hover{color:rgba(40,60,90,.8)}
.gm-tag:hover{color:rgba(84,64,44,.75);text-shadow:0 0 6px rgba(120,215,255,.8)}.gm-tag.found{color:rgba(51,150,220,.7);text-shadow:0 0 8px rgba(120,215,255,.9)}
.gm-gap{position:absolute;left:79.2%;top:40.2%;z-index:6;width:1.25%;height:3.2%;cursor:var(--cur-hover,pointer);opacity:0;
  background:repeating-linear-gradient(0deg,rgba(150,150,150,.95) 0 2px,rgba(90,90,90,.95) 2px 4px)}
.gm-gap.flick{animation:gapflick .5s steps(4)}
@keyframes gapflick{0%,100%{opacity:0}20%{opacity:.85}40%{opacity:.2}60%{opacity:.9}80%{opacity:.4}}
.gm-gap.found{display:none}
/* settings that change the room */
.no-ko .hot .tag .k,.no-ko .epi .hold small,.no-ko .epi .tracehint small,.no-ko .gm-btn small{display:none}
.calm .dust,.calm .note,.calm .glitch{display:none!important}.calm .rays,.calm .rays i,.calm .pools{animation:none!important}
`;
const st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);

/* ---------- the menu tag, toast, and the overlay ---------- */
const bar=document.createElement("div"); bar.className="gm-bar"; stage.appendChild(bar);
const qbtn=document.createElement("button"); qbtn.type="button"; qbtn.className="gm-btn"; qbtn.setAttribute("aria-label","Open quests");
qbtn.innerHTML=`<svg class="ic" viewBox="0 0 16 16"><path d="M5 3h8M5 8h8M5 13h8"/><circle cx="2" cy="3" r=".6"/><circle cx="2" cy="8" r=".6"/><circle cx="2" cy="13" r=".6"/></svg>Quests<small lang="ko">퀘스트</small><kbd>Q</kbd><span class="gm-badge" id="qBadge"></span>`;
const btn=document.createElement("button"); btn.type="button"; btn.className="gm-btn"; btn.setAttribute("aria-label","Open menu");
btn.innerHTML=`<i><b></b><b></b><b></b></i>Menu<small lang="ko">메뉴</small><kbd>Esc</kbd><span class="gm-badge" id="mBadge"></span>`;
bar.append(qbtn,btn);
const pillEl=document.createElement("div"); pillEl.className="gm-pill"; pillEl.setAttribute("aria-live","polite"); stage.appendChild(pillEl);
let pillQ=[], pillBusy=false;
// one at a time: a pill slides down, holds, slides up, then the next
function pill(kind,head,text,ko){pillQ.push({kind,head,text,ko}); if(!pillBusy) nextPill();}
function nextPill(){const p=pillQ.shift(); if(!p){pillBusy=false; return;} pillBusy=true;
  const icon={done:"✓",new:"!",found:"✦",mem:"◇"}[p.kind]||"✦";
  pillEl.className="gm-pill"+(p.kind==="done"?" done":""); pillEl.innerHTML=`<span class="ic">${icon}</span><span><small>${p.head}</small><b>${p.text}${p.ko?`<em lang="ko">${p.ko}</em>`:""}</b></span>`;
  requestAnimationFrame(()=>pillEl.classList.add("on")); try{SFX(p.kind==="done"?"toggle":"tick");}catch(e){}
  setTimeout(()=>{pillEl.classList.remove("on"); setTimeout(nextPill,500);},3200);}
const toast=document.createElement("div"); toast.className="gm-toast"; stage.appendChild(toast);
let toastT=null;
const say2=(head,text,kind="found")=>pill(kind,head,text);

const gm=document.createElement("div"); gm.className="gm"; gm.setAttribute("role","dialog"); gm.setAttribute("aria-modal","true"); gm.setAttribute("aria-label","Menu");
const TABS=[["prev","Previously","지난 이야기"],["set","Settings","설정"]];   // Case file, Memory, Seoul and Records live in the Quests journal
gm.innerHTML=`<div class="gm-panel"><span class="tk a"></span><span class="tk b"></span>
  <nav class="gm-nav"><h2>Luminance</h2><div class="sub">Episode 01 · Paused</div>
    <button type="button" data-a="resume"><b>Resume</b><small lang="ko">계속</small></button>
    ${TABS.map(([k,n,ko])=>`<button type="button" data-t="${k}"><b>${n}</b><small lang="ko">${ko}</small></button>`).join("")}
    <div class="sp"></div><button type="button" class="q" data-a="quit"><b>Quit to title</b><small lang="ko">타이틀로</small></button></nav>
  <section class="gm-body" id="gmBody"></section></div>`;
document.body.appendChild(gm);
const body=gm.querySelector("#gmBody");
let open=false, tab="prev", playing=null; const seen=S.seen=S.seen||{};

/* ---------- what can be found, and where it is recorded ---------- */
const MEMORY=[
  {id:"book",group:"pinocchio",name:"The back page",text:"“My son. — Appa.” Written in a hand he doesn't know.",found:()=>S.mem.book},
  {id:"his-book",group:"his",name:"Pinocchio",text:"Old, worn at the corners. The only thing in the room that is truly his.",found:()=>S.mem.book},
  {id:"his-record",group:"his",name:"The record",text:"First Love's Light. When the needle drops, something warm fills the room.",found:()=>S.mem.record},
];
const FRAGS=[];   // grey gaps removed for now; the code below handles an empty list
// one 기억 tag hidden in every room. Add a line here as each room is built; the counts (1 / 2, 2 / 2 …) follow
const TAGS=[
  {id:"t-room01",n:1,room:"Room 01 · Ji-yoo's cell-apartment",img:"img/01-ji-yoo-room.png",wall:"17% 92%/700%",at:{left:"16.6%",top:"69.4%"},tone:"warm",
    text:"Scratched into the window sill, so small he almost missed it.",found:"Scratched into the sill, so small he almost missed it. 기억. Remember.",where:"Window sill",
    info:["Scratched into the sill","Someone was here before him. 기억. Remember."]},
  {id:"t-room02",n:2,room:"Room 02 · Aevum research corridor",img:"img/02-corridor.png?v=2",wall:"86% 80%/700%",at:{left:"85.6%",top:"57.4%"},tone:"cool",
    text:"Scratched into the baseboard by the elevator, where nobody looks down.",found:"Low on the baseboard by the elevator, where nobody looks down. 기억. Remember.",where:"Baseboard",
    info:["Scratched into the baseboard","Here too. Someone keeps leaving it where only a person who looks down would see."]},
];

/* ---------- quests: the main story, and side tasks ---------- */
S.side=S.side||{}; S.q=S.q||{};
const QL=[
  {id:"book",kind:"main",title:"Read Pinocchio",ko:"피노키오 읽기",hint:"Turn to the back page.",started:()=>begun,done:()=>!!S.mem.book},
  {id:"door",kind:"main",title:"See who is knocking",ko:"노크한 사람 확인하기",hint:"Open the door.",started:()=>{try{return !!QUESTS.door;}catch(e){return false;}},done:()=>stage.classList.contains("open")},
  {id:"record",kind:"side",title:"Play the record",ko:"레코드 틀기",hint:"Something to listen to.",started:()=>begun,done:()=>!!S.mem.record},
  {id:"window",kind:"side",title:"Look outside",ko:"밖을 보기",hint:"The sky looks perfect.",started:()=>begun,done:()=>!!S.side.window},
  {id:"tag",kind:"side",get title(){return `Find the “Remember” tags · ${TAGS.filter(t=>S.tags.includes(t.id)).length} / ${TAGS.length}`;},ko:"“기억” 찾기",hint:"Someone is leaving one word, 기억 (“Remember”), scratched into walls and sprayed across the city. Find them. Each one is logged in the Case file.",started:()=>begun,done:()=>TAGS.every(t=>S.tags.includes(t.id))},
];
let qFilter="all";
let memSel=null;   // the memory being held on the right
let caseFile="tags", tagSel=null;   // the Case file opens on the "Remember" tag file; the tag shown on the right
const CKS2=`<span class="ck a"></span><span class="ck b"></span>`;
// the cast, from the storyboard's cast files. Ji-yoo is known from the start; others unlock when he meets them
const CAST=[{"id": "hae", "name": "Han Hae", "img": "img/char-hae.png", "role": "Detective · Rogue Response Unit", "group": "Leads", "summary": "28, small and slim, short loose hair, a soft round face with exhausted eyes. She lives in her late father's apartment and has worn his analog watch every day since she was eight. Distant with bots, and unaware she is about to become the first person to hand one a choice.", "facts": [["Age", "28"], ["Work", "RRU, Special Investigations, three years out of the academy"], ["Home", "Her father's old apartment in old Seoul"], ["Relic", "Her father's analog watch"], ["Augments", "None. She keeps the body she was given"]]}, {"id": "ji-yoo", "name": "Ji-yoo", "img": "img/char-ji-yoo.png", "role": "Subject 001 · pre-luminant bot", "group": "Leads", "summary": "Late 20s in appearance, gentle and soft-featured, the kind of face you want to protect. Twenty-two years inside Aevum, never allowed to choose. His port is hidden under his skin below the collarbone. The worn Pinocchio from his maker is the only thing he has ever owned.", "facts": [["Designation", "Subject 001"], ["Look", "Soft features, hair across the forehead, cream knit henley"], ["Dot", "None. Later a dark pendant shaped like the Aevum logo"], ["Port", "Hidden under the skin, below the collarbone"], ["Relic", "Pinocchio, inscribed \"My son. — Appa\""]]}, {"id": "mr-kim", "name": "Mr. Kim", "img": "img/char-mr-kim.png", "role": "The husband · Seongbuk-gu", "group": "The case", "summary": "Mid-40s. A regular man in regular pajamas who came downstairs at five for water. His face is peaceful, like someone who had no time to be afraid. Hae calls him hyung-ah.", "facts": [["Age", "Mid-40s"], ["Home", "Seongbuk-gu apartment"], ["Wife", "Traveling for business; the Mira-class was his spouse at home"]]}, {"id": "jin-woo", "name": "Unknown", "img": "img/char-jin-woo.png", "role": "Not yet introduced", "group": "The case", "summary": "Not introduced yet.", "facts": []}, {"id": "scientist", "name": "Dr. Lee Ha-Eun", "img": "img/char-scientist.png", "role": "The Scientist · Aevum", "group": "Aevum", "summary": "Mid-30s. Aevum's head technician on Subject 001, assigned to Ji-yoo for twelve years. Kind enough, but professional. She has knocked on his door thousands of times, and she watches the gaps in his data without knowing what they are. Today she asks permission to come in for the first time, and hands him the pendant.", "facts": [["Age", "Mid-30s"], ["Also", "The Scientist, to Ji-yoo"], ["Role", "Head technician on Subject 001, twelve years"], ["Watches", "His live feed, and the gaps in it"], ["Arc", "Slowly realizing the gaps mean something Aevum has no word for"], ["Appears in", "His room, corridor, elevator, lab, her office, Diagnostic Bay 3"]]}, {"id": "dr-seo", "name": "Dr. Seo", "img": "img/char-dr-seo.png", "role": "Head of science · Aevum", "group": "Aevum", "summary": "Mid-50s, more rumpled than the other executives, lab credentials under the suit. Ha-Eun's boss. Reports the twentieth identical failure.", "facts": [["Age", "Mid-50s"]]}, {"id": "sun-jin", "name": "Cho Sun-Jin", "img": "img/char-sun-jin.png", "role": "Head of Aevum", "group": "Aevum", "summary": "60s, silver hair, a perfectly cut dark suit, not told no in twenty years. Lies calmly. Says Hae's name and feels nothing.", "facts": [["Age", "60s"], ["Line", "\"Hostile is useful.\""]]}, {"id": "choi-yujin", "name": "Choi Yu-jin", "img": "img/char-choi-yujin.png", "role": "Aevum liaison", "group": "Aevum", "summary": "Late 30s, sleek black tailoring, hair pulled back severely. Runs recoveries and press. Calm, polite, and always authorized to say exactly nothing.", "facts": [["Age", "Late 30s"], ["Line", "\"It's the only one I'm authorized to give, Detective.\""]]}, {"id": "kind-doctor", "name": "The kind doctor", "img": "img/char-kind-doctor.png", "role": "Aevum doctor", "group": "Aevum", "summary": "50s, kind face, white coat. Passes Ji-yoo in the lower corridor and smiles warmly.", "facts": [["Age", "50s"]]}, {"id": "the-doctor", "name": "The doctor", "img": "img/char-the-doctor.png", "role": "Aevum diagnostics", "group": "Aevum", "summary": "Early 50s, slightly out of breath. Brings Ha-Eun the news of another Mira and runs the comparison: same as the last one.", "facts": [["Age", "Early 50s"]]}, {"id": "executives", "name": "Aevum executives", "img": "img/char-executives.png", "role": "Two board members, projected", "group": "Aevum", "summary": "Anonymous and expensively dressed. They attend as holograms from another building and another city, gestures transmitting, bodies elsewhere.", "facts": [["Count", "Two"]]}, {"id": "director-park", "name": "Director Park", "img": "img/char-director-park.png", "role": "Government liaison · Ministry", "group": "The state", "summary": "50s, gray hair, a blue lapel pin, the neutral face of a man paid to attend and report back. Appears only as a projection.", "facts": [["Age", "50s"]]}, {"id": "captain-park", "name": "Captain Park Jong-Hyun", "img": "img/char-captain-park.png", "role": "RRU captain", "group": "The state", "summary": "Runs the briefing. Keeps a faded photo of two young men on his desk. Chooses to give Hae one more normal evening before telling her about the pilot.", "facts": [["Role", "Assigns Hae the Mira case"], ["Line", "\"She has earned a quiet evening.\""]]}, {"id": "jang", "name": "Detective Jang", "img": "img/char-jang.png", "role": "Hae's sunbae", "group": "The state", "summary": "Late 50s, soft belly, kind eyes, suspenders. His right arm is an Aevum augment from the elbow down. Brings Hae food without asking.", "facts": [["Age", "Late 50s"], ["Augment", "Mechanical right forearm and hand"], ["Line", "\"Mira's don't go rogue.\""]]}, {"id": "kim-yura", "name": "Detective Kim Yura", "img": "img/char-kim-yura.png", "role": "RRU detective", "group": "The state", "summary": "Early 30s, sharp ponytail, polished uniform. Bought augmented eyes for a career edge; they catch light a half-beat too long. Wanted the case Hae got.", "facts": [["Age", "Early 30s"], ["Augment", "Surgically replaced eyes"]]}, {"id": "forensic-tech", "name": "Forensic tech", "img": "img/char-forensic-tech.png", "role": "Crime scene", "group": "The state", "summary": "Mid-40s, kind and tired. Walks Hae through the scene and the timeline.", "facts": [["Age", "Mid-40s"]]}, {"id": "receptionist-bot", "name": "Receptionist bot", "img": "img/char-receptionist-bot.png", "role": "Precinct front desk", "group": "The state", "summary": "Late-30s appearance, professional uniform, a clean cool-white dot above her collar. Greets Hae, then smiles at the empty space in front of her.", "facts": []}, {"id": "mail-bot", "name": "Mail bot", "img": "img/char-mail-bot.png", "role": "Precinct", "group": "The state", "summary": "Wheels through the bullpen with a cart, dropping paper case files at desks.", "facts": []}, {"id": "mi-sook", "name": "Mi-sook", "img": "img/char-mi-sook.png", "role": "Hae's neighbor", "group": "The city", "summary": "Early 70s, gray hair pulled back, soft cardigan, a worn straw broom. Has told Hae to eat before she leaves a thousand times.", "facts": [["Age", "Early 70s"], ["Line", "\"Eat before you leave.\""]]}, {"id": "halmoni", "name": "Halmoni", "img": "img/char-halmoni.png", "role": "Pojangmacha owner", "group": "The city", "summary": "70s, plain apron, hands that have stirred soup for fifty years. Knows Hae's order and turns off the TV when Aevum comes on.", "facts": [["Age", "70s"], ["Line", "\"Eat, Hae-ya.\""]]}, {"id": "barista-bot", "name": "Barista bot", "img": "img/char-barista-bot.png", "role": "Corner coffee stand", "group": "The city", "summary": "Early-30s appearance, soft warm features, a dot above his apron.", "facts": [["Signs", "A pause before the smile, a counter tap, a repeated phrase"]]}, {"id": "mrs-choi", "name": "Mrs. Choi", "img": "img/char-mrs-choi.png", "role": "Coffee stand regular", "group": "The city", "summary": "A woman in her 40s who laughs with the barista every morning.", "facts": [["Age", "40s"]]}, {"id": "wealthy-woman", "name": "The wealthy woman", "img": "img/char-wealthy-woman.png", "role": "Pre-transfer client", "group": "The city", "summary": "60s, expensive tailoring under a medical gown. Meets Ji-yoo's eyes through an open door. Neither knows the other knows.", "facts": [["Age", "60s"]]}, {"id": "jaeha", "name": "Jaeha-class husband", "img": "img/char-jaeha.png", "role": "Neighbor · male companion bot", "group": "The city", "summary": "Aevum's male companion line. He looks like a handsome man in his early 30s: tall, broad, sharp-jawed, hair swept back, a smile that is perfectly steady. His wife is in her 50s. He hasn't aged a day, and that is the unsettling part. At the cordon he says they were such a nice couple, and his wife's hand tightens on his arm.", "facts": [["Class", "Jaeha-class companion"], ["Looks", "Early 30s, never ages"], ["Wife", "In her 50s, human"], ["Dot", "Steady cool white, just above his collar"], ["Line", "\"They were such a nice couple. I wonder what happened.\""]]}, {"id": "jaeha-wife", "name": "His wife", "img": "img/char-jaeha-wife.png", "role": "Neighbor · married to the Jaeha-class", "group": "The city", "summary": "Mid-50s, elegant and well-kept, holding her bot husband's arm at the cordon. He hasn't aged since the day they met; she has. When he says they were such a nice couple, she looks up at him sharply, and her hand tightens. Hae knows she will choose to stay.", "facts": [["Age", "Mid-50s"], ["Husband", "Jaeha-class companion, still looks early 30s"], ["Married", "Six years next door to the Seongbuk-gu couple"], ["Line", "\"Detective, what happened? Are we safe?\""]]}];
const KO={"ji-yoo":"지유","hae":"한해"};
S.met=S.met||["ji-yoo"]; let charSel="ji-yoo";
const met=id=>S.met.includes(id);
const qState=q=>q.done()?"done":q.started()?"active":"hidden";

/* ---------- each tab ---------- */
const objective=()=>{const q=document.querySelector("#quests .quest:not(.done)")||document.querySelector("#quests .quest"); return q?q.innerText.replace(/\n+/g," · "):"Look around the room.";};
const render={
  prev:()=>`<h3>Previously</h3><div class="ko" lang="ko">지난 이야기</div>
    <h4>Episode 01 · Pre-Luminant</h4>
    <p class="gm-lead">Two mornings, one case. Ji-yoo, Aevum's pre-luminant bot, wakes in a staged apartment and gets one last deep read before he leaves the building. Detective Han Hae is handed the Mira-class case.</p>
    <h4>Where you are</h4><p>Room 01 · Ji-yoo's cell-apartment, inside Aevum headquarters.</p>
    <h4>Right now</h4><div class="gm-obj"><b>Quest</b><span>${objective()}</span></div>`,
  case:()=>`<h3>Case file</h3><div class="ko" lang="ko">사건 파일 · 한해 형사</div>
    <p style="margin-top:14px">Detective Han Hae's file opens when her chapters begin, from her morning in Room 06.</p>
    <h4>Evidence <em>0</em></h4><div class="gm-grid"><div class="gm-card locked"><b>The Mira-class case</b><span>Handed to her at the briefing.</span></div><div class="gm-card locked"><b>Case files</b><span>Swept into her bag on the way out.</span></div></div>
    <h4>Crack signs <em>0 / 3</em></h4><p>A field guide that fills in as you notice bots slipping. Watch closely: a pause before the smile, a tap, a repeated phrase.</p>
    <div class="gm-pips"><i></i><i></i><i></i></div>
    <h4>People <em>0</em></h4><div class="gm-grid"><div class="gm-card locked"><b>Detective Jang</b><span>Her sunbae.</span></div><div class="gm-card locked"><b>Mi-sook</b><span>Her neighbor, one flight up.</span></div><div class="gm-card locked"><b>Captain Park</b><span>RRU.</span></div></div>`,
  mem:()=>{const card=m=>m.found()?`<div class="gm-card${seen[m.id]?"":" new"}"><b>${m.name}</b><span>${m.text}</span></div>`:`<div class="gm-card locked"><b>Not found yet</b><span>Somewhere in the room.</span></div>`;
    const got=FRAGS.filter(f=>S.frag.includes(f.id)).length;
    return `<h3>Memory</h3><div class="ko" lang="ko">기억 · 지유</div>
    <h4>Pinocchio <em>${MEMORY.filter(m=>m.group==="pinocchio"&&m.found()).length} / 1</em></h4><div class="gm-grid">${MEMORY.filter(m=>m.group==="pinocchio").map(card).join("")}</div>
    <h4>Things that are truly his <em>${MEMORY.filter(m=>m.group==="his"&&m.found()).length} / 2</em></h4><div class="gm-grid">${MEMORY.filter(m=>m.group==="his").map(card).join("")}</div>
    <h4>기억 · Remember <em>${S.tags.length} / ${TAGS.length}</em></h4><p>Someone is tagging 기억 across Seoul. One is hidden in every room.</p>
    <div class="gm-grid">${TAGS.map(t=>S.tags.includes(t.id)?`<div class="gm-card"><b lang="ko">기억</b><span>${t.room}. ${t.text}</span></div>`:`<div class="gm-card locked"><b>${t.room.split(" · ")[0]}</b><span>Not found yet.</span></div>`).join("")}</div>`;},
  seoul:()=>`<h3>Seoul, 3062</h3><div class="ko" lang="ko">서울</div><h4>Places</h4><div id="gmPlaces"><p>Loading…</p></div>`,
  rec:()=>{const R=[{id:"room",name:"Ji-yoo's room",by:"Scene 01",src:"music/scene 01 - ji-yoo's room.mp3",got:true},{id:"first",name:"First Love's Light",by:"On his record player",src:"music/First Loves Light.mp3",got:!!S.mem.record}];
    return `<h3>Records</h3><div class="ko" lang="ko">음반</div><h4>Your collection <em>${R.filter(r=>r.got).length} / ${R.length}</em></h4>`+
    R.map(r=>`<div class="gm-rec${r.got?"":" locked"}${playing&&playing.id===r.id?" playing":""}" data-r="${r.id}"><button type="button" ${r.got?"":"disabled"} aria-label="Play ${r.name}" data-src="${r.got?r.src:""}">${playing&&playing.id===r.id?"❚❚":"▶"}</button>
      <div><b>${r.got?r.name:"Not found yet"}</b><span>${r.got?r.by:"Listen for it."}</span></div><span class="eq"><i></i><i></i><i></i></span></div>`).join("");},
  quests:()=>{const list=QL.filter(q=>qState(q)!=="hidden"&&(qFilter==="all"||q.kind===qFilter));
    const sec=(k,label,ko)=>{const qs=list.filter(q=>q.kind===k); if(!qs.length) return "";
      return `<h4>${label} <em>${qs.filter(q=>q.done()).length} / ${qs.length}</em></h4>`+qs.sort((a,b)=>a.done()-b.done()).map(q=>`<div class="gm-q${q.done()?" done":""}${(S.q[q.id]||{}).seen?"":" new"}"><i class="ck"></i><div><b>${q.title}<small lang="ko">${q.ko}</small></b><span>${q.hint}</span></div><span class="kind ${q.kind}">${q.kind==="main"?"Main":"Side"}</span></div>`).join("");};
    return `<h3>Quests</h3><div class="ko" lang="ko">퀘스트 · Episode 01</div>`+(qFilter!=="side"?sec("main","Main story","메인 스토리"):"")+(qFilter!=="main"?sec("side","Side","서브"):"");},
  set:()=>{const s=S.settings, tog=(k,on)=>`<button type="button" class="gm-tog" role="switch" aria-checked="${on}" data-s="${k}"></button>`;
    return `<h3>Settings</h3><div class="ko" lang="ko">설정</div>
    <div class="gm-set"><div><b>Music</b><span>Background music and records</span></div><input type="range" min="0" max="1.5" step=".05" value="${s.music}" data-r="music" aria-label="Music volume"></div>
    <div class="gm-set"><div><b>Sound effects</b><span>Steps, pages, the knock</span></div><input type="range" min="0" max="1.5" step=".05" value="${s.sfx}" data-r="sfx" aria-label="Sound effects volume"></div>
    <div class="gm-set"><div><b>Korean labels</b><span>Show 한국어 under the action labels</span></div>${tog("ko",s.ko)}</div>
    <div class="gm-set"><div><b>Hold to skip</b><span>Off: a single press of E skips the cinematic</span></div>${tog("hold",s.hold)}</div>
    <div class="gm-set"><div><b>Reduce motion</b><span>Calms the dust, music notes and glitch</span></div>${tog("calm",s.calm)}</div>`;},
};

let mode="menu";
const nav=gm.querySelector(".gm-nav"), navMenu=nav.innerHTML;
const navQuests=`<h2>Luminance</h2><div class="sub">Episode 01 · Quests</div>
  <button type="button" data-a="resume"><b>Resume</b><small lang="ko">계속</small></button>
  <button type="button" data-f="all"><b>All</b><small lang="ko">전체</small></button>
  <button type="button" data-f="main"><b>Main story</b><small lang="ko">메인</small></button>
  <button type="button" data-f="side"><b>Side</b><small lang="ko">서브</small></button><div class="sp"></div>
  <button type="button" data-go="menu"><b>Menu</b><small lang="ko">메뉴</small></button>`;
function setMode(m){mode=m; nav.innerHTML=m==="quests"?navQuests:navMenu;
  nav.querySelectorAll("button[data-t]").forEach(b=>b.onclick=()=>{show(b.dataset.t); try{SFX("tick");}catch(e){}});
  nav.querySelectorAll("button[data-f]").forEach(b=>b.onclick=()=>{qFilter=b.dataset.f; show("quests"); try{SFX("tick");}catch(e){}});
  nav.querySelector("[data-a=resume]").onclick=closeMenu;
  const q=nav.querySelector("[data-a=quit]"); if(q) q.onclick=()=>{try{localStorage.setItem("lum-mode","title");}catch(e){} (window.top||window).location.href="index.html";};
  const g=nav.querySelector("[data-go=menu]"); if(g) g.onclick=()=>{setMode("menu"); show("prev");};}
function show(t){tab=t;
  nav.querySelectorAll("button[data-t]").forEach(b=>b.setAttribute("aria-current",b.dataset.t===t));
  nav.querySelectorAll("button[data-f]").forEach(b=>b.setAttribute("aria-current",t==="quests"&&b.dataset.f===qFilter));
  body.innerHTML=render[t](); body.scrollTop=0; wire(t);
  if(t==="mem"){MEMORY.forEach(m=>{if(m.found()) seen[m.id]=true;}); FRAGS.forEach(f=>{if(S.frag.includes(f.id)) seen[f.id]=true;}); TAGS.forEach(x=>{if(S.tags.includes(x.id)) seen[x.id]=true;});}
  if(t==="rec") S.seenRec=!!S.mem.record;
  if(t==="quests") QL.forEach(q=>{if(qState(q)!=="hidden"){S.q[q.id]=Object.assign(S.q[q.id]||{},{seen:true,seenDone:q.done()});}});
  save(); badges();}
function wire(t){
  if(t==="seoul") fetch("lore/areas.json").then(r=>r.json()).then(d=>{const el=document.getElementById("gmPlaces"); if(!el) return;
    el.innerHTML=[...d.areas].sort((x,y)=>(y.id==="aevum")-(x.id==="aevum")).map(a=>{const here=a.id==="aevum"; return `<div class="gm-place${here?"":" locked"}"><img src="${a.photo}" alt=""><div><b>${a.name}${here?`<span class="here">You are here</span>`:""}</b><small>${a.where||""}</small><span>${here?(a.lore||[]).slice(0,2).join(" "):"Not visited yet."}</span></div></div>`;}).join("");}).catch(()=>{});
  if(t==="rec") body.querySelectorAll(".gm-rec button[data-src]").forEach(b=>b.onclick=()=>{const id=b.closest(".gm-rec").dataset.r; togglePlay(id,b.dataset.src);});
  if(t==="set"){
    body.querySelectorAll("input[data-r]").forEach(i=>i.oninput=()=>{S.settings[i.dataset.r]=+i.value; save(); apply();});
    body.querySelectorAll(".gm-tog").forEach(b=>b.onclick=()=>{const k=b.dataset.s; S.settings[k]=!S.settings[k]; b.setAttribute("aria-checked",S.settings[k]); save(); apply(); try{SFX("toggle");}catch(e){}});}
}

/* records: play a track from the menu; the room's own music steps aside while it plays */
let player=null;
function togglePlay(id,src){
  if(playing&&playing.id===id){player.pause(); playing=null;}
  else{if(player) player.pause(); player=new Audio(src); player.loop=true; player.volume=.5*(S.settings.music||1); player.play().catch(()=>{}); playing={id};}
}
function stopPlayer(){if(player){player.pause(); player=null;} playing=null;}

/* open / close: the game pauses (no walking or actions) while it's open */
let wasRoom=0, wasRec=0;
function pauseGame(){window.LUM_PAUSED=true; try{keys.clear(); goal=null;}catch(e){} try{wasRoom=room.volume; wasRec=record.volume; room.volume=wasRoom*.35; record.volume=wasRec*.35;}catch(e){}}
function resumeGame(){window.LUM_PAUSED=false; try{room.volume=wasRoom; record.volume=wasRec;}catch(e){}}
function openMenu(t,m="menu"){if(m==="quests"){openJournal(); return;} if(jopen) closeJournal(); if(open) return; open=true; setMode("menu"); pauseGame();
  gm.classList.add("on"); show(t||"prev"); try{SFX("open");}catch(e){} setTimeout(()=>gm.querySelector(".gm-nav button[aria-current=true]")?.focus(),50);}
function closeMenu(){if(!open) return; open=false; gm.classList.remove("on"); stopPlayer();
  resumeGame(); btn.focus({preventScroll:true}); btn.blur();}
btn.onclick=()=>openMenu(null,"menu"); qbtn.onclick=()=>openJournal();
gm.addEventListener("click",e=>{if(e.target===gm) closeMenu();});

// Esc or M opens it during play; Esc closes it. The game's own keys are held back while it's open
addEventListener("keydown",e=>{
  const playingRoom=typeof begun!=="undefined"&&begun&&!document.getElementById("epi");
  if(jopen){if(e.key==="Escape"||e.key==="q"||e.key==="Q"){closeJournal(); e.preventDefault();} else if(e.key==="m"||e.key==="M"){openMenu(null,"menu"); e.preventDefault();}
    e.stopImmediatePropagation(); return;}
  if(open){if(e.key==="Escape"||e.key==="m"||e.key==="M"){closeMenu(); e.preventDefault();}
    else if(e.key==="q"||e.key==="Q"){openJournal(); e.preventDefault();}
    e.stopImmediatePropagation(); return;}
  if(!playingRoom) return;
  try{if(bookOpen) return;}catch(e2){}
  if(e.key==="Escape"||e.key==="m"||e.key==="M"){openMenu(null,"menu"); e.preventDefault(); e.stopImmediatePropagation();}
  else if(e.key==="q"||e.key==="Q"){openJournal(); e.preventDefault(); e.stopImmediatePropagation();}
},{capture:true});

/* ==================== the Journal: a full-screen takeover behind the Quests button ====================
   Tabs across the top with icons: Quests, Case file, Memory, Seoul (the live hologram map, train and all), Records.
   Cards borrow the storyboard's look: the picture, a frosted hologram caption, corner brackets, a slow scan sweep */
const jcss=`
.jr{position:fixed;inset:0;z-index:62;display:grid;grid-template-rows:auto minmax(0,1fr);color:#082a5c;
  background:radial-gradient(ellipse 90% 70% at 50% 0%,#f6fcff,#e2f1fd 55%,#cfe4f7);opacity:0;pointer-events:none;transition:opacity .4s}
.jr::before{content:"";position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(31,124,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(31,124,255,.06) 1px,transparent 1px);background-size:44px 44px;
  -webkit-mask:radial-gradient(ellipse at 50% 30%,#000,transparent 85%);mask:radial-gradient(ellipse at 50% 30%,#000,transparent 85%)}
.jr.on{opacity:1;pointer-events:auto}
.jr-top{position:relative;z-index:2;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:16px;padding:18px 28px 14px;border-bottom:1px solid rgba(70,160,230,.35);
  background:linear-gradient(180deg,rgba(255,255,255,.7),rgba(255,255,255,.35));backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.jr-brand{display:flex;align-items:center;gap:12px}
.jr-brand i{width:10px;height:10px;border-radius:50%;background:#fff;border:1px solid #33c6ff;box-shadow:0 0 10px 3px rgba(51,198,255,.55)}
.jr-brand b{font:400 16px var(--display);letter-spacing:.18em;text-transform:uppercase;color:#082a5c}
.jr-brand small{font:500 10px var(--mono);letter-spacing:.2em;text-transform:uppercase;color:#2a6fb8}
.jr-tabs{display:flex;gap:6px;padding:5px;border-radius:999px;background:rgba(255,255,255,.55);border:1px solid rgba(120,200,255,.6);box-shadow:0 0 18px rgba(51,198,255,.18),inset 0 0 0 1px rgba(255,255,255,.6)}
.jr-tab{all:unset;position:relative;cursor:var(--cur-hover,pointer);display:flex;align-items:center;gap:9px;padding:9px 18px 9px 14px;border-radius:999px;transition:background .2s,box-shadow .2s;color:#2a5d93}
.jr-tab svg{width:20px;height:20px;flex:none}
.jr-tab svg *{fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.jr-tab b{font:600 11.5px var(--mono);letter-spacing:.16em;text-transform:uppercase}
.jr-tab small{font:500 10.5px "Apple SD Gothic Neo","Noto Sans KR",sans-serif;opacity:.7}
.jr-tab:hover{background:rgba(255,255,255,.7)}
.jr-tab[aria-selected="true"]{background:#fff;color:#0a5fd6;box-shadow:0 0 0 1px rgba(51,198,255,.6),0 0 18px rgba(51,198,255,.45),0 6px 14px rgba(20,60,130,.12)}
.jr-tab[aria-selected="true"] svg{filter:drop-shadow(0 0 4px rgba(51,198,255,.8))}
.jr-tab .gm-badge{right:-2px;top:-6px}
.jr-x{all:unset;justify-self:end;cursor:var(--cur-hover,pointer);display:flex;align-items:center;gap:10px;padding:8px 14px;border-radius:999px;font:600 11px var(--mono);letter-spacing:.16em;text-transform:uppercase;color:#2a5d93;background:rgba(255,255,255,.6);border:1px solid rgba(120,200,255,.6)}
.jr-x:hover{background:#fff;box-shadow:0 0 14px rgba(51,198,255,.4)}
.jr-x kbd{font:600 9.5px var(--mono);padding:1px 5px;border:1px solid rgba(42,111,184,.4);border-radius:3px}
.jr-pane{position:relative;z-index:1;overflow:auto;padding:30px 6vw 60px;scrollbar-width:thin}
.jr-pane.map{padding:0;overflow:hidden}
.jr-pane.map iframe{width:100%;height:100%;border:0;display:block}
.jr h2{margin:0;font:400 28px var(--display);letter-spacing:.1em;color:#082a5c;text-shadow:0 0 14px rgba(120,210,255,.6)}
.jr .ko{font:500 13px "Apple SD Gothic Neo","Noto Sans KR",sans-serif;color:#2a6fb8;letter-spacing:.1em;margin:4px 0 6px}
.jr .lead{max-width:760px;font:400 15px/1.6 "IBM Plex Sans",ui-sans-serif,system-ui,sans-serif;color:#2d5d93;margin:8px 0 0}
.jr h4{margin:34px 0 16px;display:flex;align-items:center;gap:12px;font:600 11px var(--mono);letter-spacing:.22em;text-transform:uppercase;color:#0a5fd6}
.jr h4::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(51,150,230,.6),transparent)}
.jr h4 em{font-style:normal;color:#2a6fb8;letter-spacing:.1em}
.jr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:22px}
/* a card like the storyboard's: the picture, a frosted hologram caption, corner brackets */
.jc{position:relative;aspect-ratio:16/10;border-radius:10px;overflow:hidden;background:#0d1a2e;box-shadow:0 10px 26px rgba(20,60,130,.18),0 0 0 1px rgba(120,200,255,.55);transition:transform .3s cubic-bezier(.2,1.3,.3,1),box-shadow .3s}
.jc:hover{transform:translateY(-4px);box-shadow:0 16px 34px rgba(20,60,130,.24),0 0 0 1px rgba(51,198,255,.9),0 0 24px rgba(51,198,255,.4)}
.jc>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.jc .ck{position:absolute;width:16px;height:16px;z-index:2;filter:drop-shadow(0 0 4px rgba(51,198,255,.9))}
.jc .ck.a{left:8px;top:8px;border-left:2px solid #bff4ff;border-top:2px solid #bff4ff}.jc .ck.b{right:8px;top:8px;border-right:2px solid #bff4ff;border-top:2px solid #bff4ff}
.jc .ck.c{left:8px;bottom:8px;border-left:2px solid #bff4ff;border-bottom:2px solid #bff4ff}.jc .ck.d{right:8px;bottom:8px;border-right:2px solid #bff4ff;border-bottom:2px solid #bff4ff}
.jc .cap{position:absolute;left:12px;right:12px;bottom:12px;z-index:1;padding:10px 13px 11px;border-radius:6px;display:grid;gap:3px;overflow:hidden;
  background:linear-gradient(180deg,rgba(240,250,255,.74),rgba(220,240,255,.6));backdrop-filter:blur(9px) saturate(1.3);-webkit-backdrop-filter:blur(9px) saturate(1.3);
  border:1px solid rgba(120,200,255,.75);box-shadow:inset 0 0 0 1px rgba(255,255,255,.4),0 0 18px rgba(51,198,255,.3)}
.jc .cap::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(31,124,255,.06) 0 1px,transparent 1px 3px)}
.jc .cap small{font:500 10px var(--mono);letter-spacing:.16em;text-transform:uppercase;color:#0a5fd6}
.jc .cap b{font:600 15px "IBM Plex Sans",ui-sans-serif,system-ui,sans-serif;color:#082a5c}
.jc .cap span{font:400 12.5px/1.45 "IBM Plex Sans",ui-sans-serif,system-ui,sans-serif;color:#2d5d93}
.jc .new{position:absolute;right:14px;top:14px;z-index:2;font:600 9.5px var(--mono);letter-spacing:.2em;text-transform:uppercase;padding:3px 8px;border-radius:3px;background:#fff;color:#0a5fd6;box-shadow:0 0 12px rgba(51,198,255,.8)}
.jc.locked>img{filter:grayscale(1) brightness(.45) blur(3px) contrast(.9);transform:scale(1.06)}
.jc.locked .cap{background:linear-gradient(180deg,rgba(220,235,250,.5),rgba(200,225,245,.4))}
.jc.locked .cap{background:linear-gradient(180deg,rgba(236,246,255,.86),rgba(220,236,252,.78))}.jc.locked .cap b{color:#1d4a7a}.jc.locked .cap span{color:#355d8a;font-style:italic}
.jc.locked::before{content:"";position:absolute;inset:0;z-index:1;background:repeating-linear-gradient(135deg,rgba(255,255,255,.05) 0 10px,transparent 10px 20px)}
.jc.portrait{aspect-ratio:3/4}
.jc.portrait>img{object-position:50% 12%}
.jc.portrait.locked>img{filter:brightness(0) saturate(0);opacity:.55;transform:none}
.jc .static{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(150,150,150,.9) 0 2px,rgba(95,95,95,.9) 2px 4px);mix-blend-mode:luminosity;opacity:.55}
.jc .tagmark{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%) rotate(-6deg);font:700 46px "Apple SD Gothic Neo","Noto Sans KR",sans-serif;color:rgba(255,255,255,.9);text-shadow:0 0 14px rgba(51,198,255,.9),0 0 30px rgba(51,198,255,.6)}
@media (prefers-reduced-motion:no-preference){
  .jc .cap::before{content:"";position:absolute;left:0;right:0;top:-40%;height:40%;pointer-events:none;background:linear-gradient(180deg,transparent,rgba(255,255,255,.28),transparent);animation:jsweep 5s linear infinite}
  .jc:nth-child(3n) .cap::before{animation-delay:-1.7s}.jc:nth-child(3n+1) .cap::before{animation-delay:-3.4s}
  @keyframes jsweep{to{top:140%}}
}
/* Memory: the finds on the left, Ji-yoo's profile on the right (from his storyboard cast file) */
.jm{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:40px;align-items:start}
.jm .jr-grid{grid-template-columns:repeat(auto-fill,minmax(250px,1fr))}
.jprof{position:sticky;top:0;border-radius:12px;overflow:hidden;background:linear-gradient(180deg,rgba(255,255,255,.82),rgba(232,245,255,.7));
  border:1px solid rgba(120,200,255,.75);box-shadow:0 0 0 1px rgba(255,255,255,.5) inset,0 0 24px rgba(51,198,255,.25),0 14px 30px rgba(20,60,130,.14)}
.jprof .pic{position:relative;aspect-ratio:4/4.4;background:radial-gradient(ellipse at 50% 35%,#ffffff,#cfe7fb 70%)}
.jprof .pic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 8%}
.jprof .pic::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 60%,rgba(232,245,255,.95));pointer-events:none}
.jprof .pic .ck{position:absolute;width:16px;height:16px;z-index:2;filter:drop-shadow(0 0 4px rgba(51,198,255,.9))}
.jprof .pic .ck.a{left:10px;top:10px;border-left:2px solid #33a8f0;border-top:2px solid #33a8f0}.jprof .pic .ck.b{right:10px;top:10px;border-right:2px solid #33a8f0;border-top:2px solid #33a8f0}
.jprof .file{position:absolute;left:14px;top:14px;z-index:2;font:600 9.5px var(--mono);letter-spacing:.2em;text-transform:uppercase;padding:3px 8px;border-radius:3px;background:rgba(255,255,255,.85);color:#0a5fd6;box-shadow:0 0 10px rgba(51,198,255,.5)}
.jprof .bd{padding:4px 22px 22px;margin-top:-34px;position:relative}
.jprof h3{margin:0;font:400 24px var(--display);letter-spacing:.1em;color:#082a5c;text-shadow:0 0 12px rgba(120,210,255,.7)}
.jprof h3 small{font:500 14px "Apple SD Gothic Neo","Noto Sans KR",sans-serif;letter-spacing:.08em;color:#2a6fb8;margin-left:8px}
.jprof .role{display:inline-block;margin:8px 0 12px;font:600 10px var(--mono);letter-spacing:.16em;text-transform:uppercase;padding:4px 9px;border-radius:3px;background:#0a5fd6;color:#fff}
.jprof p{margin:0 0 16px;font:400 13.5px/1.6 "IBM Plex Sans",ui-sans-serif,system-ui,sans-serif;color:#2d5d93}
.jprof dl{display:grid;grid-template-columns:auto 1fr;gap:9px 14px;margin:0;padding-top:14px;border-top:1px solid rgba(51,150,230,.3)}
.jprof dt{font:600 9.5px var(--mono);letter-spacing:.16em;text-transform:uppercase;color:#0a5fd6;padding-top:2px}
.jprof dd{margin:0;font:400 13px/1.45 "IBM Plex Sans",ui-sans-serif,sans-serif;color:#082a5c}
.jprof .prog{display:flex;gap:6px;margin-top:16px;padding-top:14px;border-top:1px solid rgba(51,150,230,.3);font:600 10px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:#2a6fb8;align-items:center}
.jprof .prog i{flex:1;height:5px;border-radius:3px;background:rgba(51,150,230,.18);overflow:hidden}.jprof .prog i b{display:block;height:100%;background:linear-gradient(90deg,#1f7cff,#33c6ff);box-shadow:0 0 8px #33c6ff}
@media (max-width:1100px){.jm{grid-template-columns:1fr}.jprof{position:relative}}
/* Hae's file: an error state, since Ji-yoo hasn't met her. Her portrait is only a traced outline on a dead screen */
.jprof.err{border-color:rgba(255,120,120,.55);box-shadow:0 0 0 1px rgba(255,255,255,.4) inset,0 0 22px rgba(255,90,110,.18),0 14px 30px rgba(20,60,130,.14)}
.jprof.err .pic{background:radial-gradient(ellipse at 50% 40%,#0e2242,#050d1d 75%);overflow:hidden}
.jprof.err .pic::after{background:repeating-linear-gradient(0deg,rgba(255,255,255,.05) 0 1px,transparent 1px 3px),linear-gradient(180deg,transparent 62%,rgba(232,245,255,.95))}
/* her photo, ruined: drawn tiny then blown up into big pixels, colour-inverted and blurred */
.jprof.err .pic canvas{position:absolute;inset:-6px;width:calc(100% + 12px);height:calc(100% + 12px);image-rendering:pixelated;filter:invert(1) blur(2.2px) contrast(1.15) saturate(.7);opacity:.9}
.jprof.err .pic canvas.ghost{filter:invert(1) blur(1.5px) sepia(1) saturate(6) hue-rotate(-45deg);mix-blend-mode:screen;opacity:.55}
.jprof.err .pic .ck{filter:drop-shadow(0 0 4px rgba(255,90,110,.9))}.jprof.err .pic .ck.a,.jprof.err .pic .ck.b{border-color:#ff7a8a}
.jprof.err .file{background:rgba(255,236,238,.9);color:#d6334a;box-shadow:0 0 10px rgba(255,90,110,.5)}
.jprof .lost{position:absolute;left:50%;top:76%;z-index:3;transform:translate(-50%,-50%);text-align:center;padding:7px 16px 8px;border-radius:4px;background:rgba(10,6,16,.78);border:1px solid rgba(255,110,130,.6);box-shadow:0 0 16px rgba(255,90,110,.45);white-space:nowrap;font:600 12px var(--mono);letter-spacing:.3em;color:#ff8a98;text-shadow:0 0 10px rgba(255,90,110,.9)}
.jprof .lost small{display:block;margin-top:4px;font:500 11px "Apple SD Gothic Neo","Noto Sans KR",sans-serif;letter-spacing:.14em;color:#ffb3bd}
.jprof .errline{display:block;margin:-4px 0 12px;font:600 10px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:#d6334a}
.jprof .redact{display:inline-block;height:11px;border-radius:2px;background:#0b1e3a;vertical-align:middle;box-shadow:0 0 0 1px rgba(255,255,255,.2) inset}
.jprof.err .role{background:#5b7398}
@media (prefers-reduced-motion:no-preference){
  .jprof.err .pic canvas.ghost{animation:ghost 2.6s steps(1) infinite}
  @keyframes ghost{0%,72%,100%{transform:translate(0,0);clip-path:inset(0 0 0 0);opacity:.35}74%{transform:translate(5px,-1px);clip-path:inset(20% 0 55% 0);opacity:.9}77%{transform:translate(-4px,1px);clip-path:inset(55% 0 20% 0);opacity:.8}80%{transform:translate(2px,0);clip-path:inset(35% 0 40% 0)}}
  .jprof .lost{animation:lost 3.4s steps(1) infinite}
  @keyframes lost{0%,100%{opacity:1}62%{opacity:.25}64%{opacity:1}66%{opacity:.4}68%{opacity:1}}
}
/* character cards */
.jr-grid.chars{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:16px}
.jch{all:unset;box-sizing:border-box;cursor:var(--cur-hover,pointer);display:block;position:relative;aspect-ratio:3/4;border-radius:10px;overflow:hidden;background:#0d1a2e;
  box-shadow:0 10px 26px rgba(20,60,130,.18),0 0 0 1px rgba(120,200,255,.55);transition:transform .3s cubic-bezier(.2,1.3,.3,1),box-shadow .3s}
.jch:hover,.jch:focus-visible{transform:translateY(-4px);box-shadow:0 16px 34px rgba(20,60,130,.24),0 0 0 1px rgba(51,198,255,.9),0 0 24px rgba(51,198,255,.4)}
.jch.sel{box-shadow:0 0 0 2px #33c6ff,0 0 26px rgba(51,198,255,.6),0 14px 30px rgba(20,60,130,.22)}
.jch .cap{left:8px;right:8px;bottom:8px;padding:7px 9px 8px}.jch .cap b{font-size:13px}.jch .cap small{font-size:8.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.jch.locked canvas{position:absolute;inset:-4px;width:calc(100% + 8px);height:calc(100% + 8px);image-rendering:pixelated;filter:invert(1) blur(1.6px) contrast(1.1) saturate(.6);opacity:.85}
.jch.locked .cap small{color:#d6334a}
/* people not met yet: a soft black-and-white photo with the storyboard's pixel shimmer sweeping over it, over and over */
.jch.locked img.bw{filter:grayscale(1) contrast(1.05) blur(4.5px);transform:scale(1.08);opacity:.92;object-position:50% 10%}
.jprof.err .pic img.bw{filter:grayscale(1) contrast(1.05) blur(9px);transform:scale(1.1);opacity:.92;object-position:50% 10%}
.jprof.err .pic img.bw{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.jch.locked canvas.pxloop,.jprof.err .pic canvas.pxloop{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;filter:none;opacity:1;image-rendering:auto}   /* no colour flip: the shimmer stays white */
.jch.locked .cap,.jprof.err .lost{z-index:3}
/* the character file leans like a hologram panel, and follows the cursor on hover */
.jm .jprof{--rx:3deg;--ry:-8deg;--gx:30%;--gy:20%;transform:perspective(1100px) rotateX(var(--rx)) rotateY(var(--ry));transform-origin:50% 40%;
  transition:transform .6s cubic-bezier(.2,1,.3,1),box-shadow .4s;will-change:transform}
.jm .jprof.hov{transition:transform .12s ease-out,box-shadow .4s;box-shadow:0 0 0 1px rgba(255,255,255,.5) inset,0 0 34px rgba(51,198,255,.4),0 24px 44px rgba(20,60,130,.22)}
.jm .jprof::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:4;border-radius:inherit;opacity:0;transition:opacity .4s;
  background:radial-gradient(circle at var(--gx) var(--gy),rgba(255,255,255,.45),rgba(255,255,255,0) 45%)}
.jm .jprof.hov::after{opacity:1}
@media (prefers-reduced-motion:reduce){.jm .jprof{transform:none}}
/* Memory: tap a memory and it comes up on the right to touch */
.jc.pick{cursor:var(--cur-hover,pointer)}
.jc.sel{box-shadow:0 0 0 2px #33c6ff,0 0 26px rgba(51,198,255,.6),0 14px 30px rgba(20,60,130,.22)}
.jobj .stage{position:relative;aspect-ratio:4/3.3;overflow:hidden;cursor:var(--cur-hover,pointer);background:radial-gradient(ellipse at 50% 45%,#2a2f45,#0c1222 75%);touch-action:manipulation}
.jobj .stage::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.03) 0 1px,transparent 1px 3px)}
.jobj .stage .ck{position:absolute;width:16px;height:16px;z-index:3;filter:drop-shadow(0 0 4px rgba(51,198,255,.9))}
.jobj .stage .ck.a{left:10px;top:10px;border-left:2px solid #bff4ff;border-top:2px solid #bff4ff}.jobj .stage .ck.b{right:10px;top:10px;border-right:2px solid #bff4ff;border-top:2px solid #bff4ff}
.jobj .stage canvas{position:absolute;inset:6% 4%;width:92%;height:88%;object-fit:contain}
.jobj .stage canvas.ink{opacity:0;filter:brightness(1.25) drop-shadow(0 0 2px rgba(255,220,140,1)) drop-shadow(0 0 8px rgba(255,170,60,1)) drop-shadow(0 0 20px rgba(255,160,50,.9)) drop-shadow(0 0 40px rgba(255,190,90,.6))}
.jobj .stage canvas.ink.glow{animation:inkglow 3.2s ease-out forwards}
@keyframes inkglow{0%{opacity:0}18%{opacity:1}70%{opacity:.85}100%{opacity:.35}}
.jobj .hint{display:inline-flex;align-items:center;gap:8px;margin-top:2px;font:600 10px var(--mono);letter-spacing:.18em;text-transform:uppercase;color:#0a5fd6}
.jobj .hint small{font:500 11px "Apple SD Gothic Neo","Noto Sans KR",sans-serif;letter-spacing:.08em;text-transform:none;color:#2a6fb8}
.jobj .hint i{width:8px;height:8px;border-radius:50%;background:#33c6ff;box-shadow:0 0 0 0 rgba(51,198,255,.6);animation:tap 1.6s ease-out infinite}
@keyframes tap{70%{box-shadow:0 0 0 10px rgba(51,198,255,0)}}
.jobj .bd{margin-top:0;padding-top:18px}
.jobj .bd small.k{display:block;font:600 10px var(--mono);letter-spacing:.18em;text-transform:uppercase;color:#0a5fd6;margin-bottom:4px}
.jobj .empty{display:grid;place-items:center;text-align:center;height:100%;padding:30px;color:#9fc3d6;font:400 14px/1.6 "IBM Plex Sans",sans-serif}
/* the record player */
.tt{position:absolute;inset:12% 10%;border-radius:12px;background:linear-gradient(160deg,#5a4434,#2e2219);box-shadow:inset 0 0 0 2px rgba(255,255,255,.06),0 18px 30px rgba(0,0,0,.5)}
.tt .plat{position:absolute;left:8%;top:9%;height:82%;aspect-ratio:1;border-radius:50%;background:#1b1b1d;box-shadow:inset 0 0 0 3px #333}
.tt .vinyl{position:absolute;inset:4%;border-radius:50%;background:repeating-radial-gradient(circle,#141414 0 1.5px,#1f1f22 1.5px 3px);box-shadow:0 0 0 1px #000}
.tt .vinyl::before{content:"";position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 20deg,rgba(255,255,255,0),rgba(255,255,255,.12) 10%,rgba(255,255,255,0) 22%,rgba(255,255,255,0) 50%,rgba(255,255,255,.1) 60%,rgba(255,255,255,0) 72%)}
.tt .label{position:absolute;inset:34%;border-radius:50%;background-size:cover;background-position:center;box-shadow:0 0 0 2px #c9a46a}
.tt .label::after{content:"";position:absolute;inset:44%;border-radius:50%;background:#ddd}
.tt .arm{position:absolute;right:9%;top:10%;width:7%;height:62%;transform-origin:50% 6%;transform:rotate(-4deg);transition:transform 1s cubic-bezier(.4,0,.2,1)}
.tt .arm::before{content:"";position:absolute;left:50%;top:0;width:18px;height:18px;margin-left:-9px;border-radius:50%;background:radial-gradient(#ddd,#888)}
.tt .arm::after{content:"";position:absolute;left:50%;top:6%;width:4px;height:94%;margin-left:-2px;border-radius:2px;background:linear-gradient(#e8e8e8,#9a9a9a);box-shadow:-5px 92% 0 2px #bbb}
.tt.on .arm{transform:rotate(24deg)}
.tt.on .vinyl{animation:spin 1.8s linear infinite}
.tt .lamp{position:absolute;right:6%;bottom:8%;width:9px;height:9px;border-radius:50%;background:#553;box-shadow:none;transition:all .3s}.tt.on .lamp{background:#9fffb0;box-shadow:0 0 10px #6f6}
/* the 기억 tag */
.tagwall{position:absolute;inset:0;background:url("img/01-ji-yoo-room.png") 17% 92%/700% no-repeat;filter:saturate(.8) brightness(.9)}
.tagword{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-6deg);font:700 92px "Apple SD Gothic Neo","Noto Sans KR",sans-serif;color:rgba(70,52,36,.55);text-shadow:0 1px 0 rgba(255,250,240,.4);transition:color .4s}
.tagword.lit{animation:taglit 2.8s ease-out forwards}
@keyframes taglit{0%{color:rgba(70,52,36,.55)}25%{color:#fff;text-shadow:0 0 14px #33c6ff,0 0 34px rgba(51,198,255,.8)}100%{color:rgba(180,230,255,.9);text-shadow:0 0 10px rgba(51,198,255,.7)}}
/* case file: a file switcher, and the "Remember" tag log (a snapshot of where each was found) */
.cf-files{display:flex;gap:10px;margin:6px 0 22px;flex-wrap:wrap}
.cf-f{all:unset;cursor:pointer;display:flex;align-items:baseline;gap:10px;padding:9px 16px;border-radius:4px 14px 4px 14px;border:1px solid rgba(51,150,230,.35);background:rgba(255,255,255,.45);color:#0a3a75}
.cf-f b{font:600 12px var(--mono);letter-spacing:.14em;text-transform:uppercase}.cf-f small{font-size:11px;color:#2a6fb8}.cf-f em{font:500 10px var(--mono);font-style:normal;letter-spacing:.12em;opacity:.7}
.cf-f.on{background:linear-gradient(135deg,#1b4f8a,#0e2f5c);color:#fff;border-color:rgba(125,218,255,.8);box-shadow:0 0 16px rgba(51,198,255,.35)}.cf-f.on small{color:#bff4ff}
.cf-f:focus-visible{outline:2px solid #33a8f0;outline-offset:2px}
.tglog{display:grid;gap:10px}
.tg{all:unset;box-sizing:border-box;display:grid;grid-template-columns:150px 1fr;gap:16px;align-items:center;padding:10px;border-radius:10px;border:1px solid rgba(51,150,230,.25);background:rgba(255,255,255,.55);cursor:pointer;transition:background .2s,box-shadow .2s}
.tg:hover,.tg.sel{background:rgba(255,255,255,.9);box-shadow:0 0 0 1px rgba(51,198,255,.6),0 8px 20px rgba(20,60,130,.12)}
.tg:focus-visible{outline:2px solid #33a8f0;outline-offset:2px}
.tg .shot{position:relative;aspect-ratio:1344/752;border-radius:6px;background-size:600% auto;background-color:#cfe7fb;overflow:hidden}
.tg .shot i{position:absolute;left:50%;top:50%;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;border:2px solid #33c6ff;box-shadow:0 0 10px rgba(51,198,255,.8)}
.tg small{display:block;font:600 9.5px var(--mono);letter-spacing:.16em;text-transform:uppercase;color:#0a5fd6}
.tg b{display:block;margin:3px 0;font:600 15px "IBM Plex Sans",sans-serif;color:#082a5c}
.tg span>span{font-size:12.5px;color:#2d5d93}
.tg.locked{cursor:default;opacity:.6}.tg.locked .shot{background:repeating-linear-gradient(135deg,rgba(51,150,230,.12) 0 6px,transparent 6px 12px)}
.tg .nw{display:inline-block;margin-left:8px;font:600 9px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:#fff;background:#1f7cff;padding:2px 6px;border-radius:3px;vertical-align:2px}
.tg .shot u,.jtag .snap u{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-4deg);text-decoration:none;font:700 11px "Apple SD Gothic Neo","Noto Sans KR",sans-serif;color:rgba(40,52,70,.7)}
.jtag .snap u{font-size:24px;color:rgba(40,52,70,.62)}
.jtag .snap{background-size:600% auto;background-repeat:no-repeat;aspect-ratio:1344/752!important}
.jtag .snap::after{display:none}
.jtag .snap.empty{background:repeating-linear-gradient(135deg,rgba(51,150,230,.12) 0 8px,transparent 8px 16px)}
.jtag .ring{position:absolute;left:50%;top:50%;width:64px;height:64px;margin:-32px 0 0 -32px;border-radius:50%;border:2px solid #33c6ff;box-shadow:0 0 18px rgba(51,198,255,.9),inset 0 0 12px rgba(51,198,255,.5)}
@media (prefers-reduced-motion:no-preference){.jtag .ring{animation:tgring 2.4s ease-in-out infinite}@keyframes tgring{50%{transform:scale(1.15);opacity:.6}}}
.jtag .tw{position:absolute;right:12px;bottom:10px;font:700 26px "Apple SD Gothic Neo","Noto Sans KR",sans-serif;color:#fff;text-shadow:0 0 12px #33c6ff,0 0 26px rgba(51,198,255,.8)}
.jtag .bd{margin-top:0;padding-top:16px}
/* choices: a quiet numbered list */
.chl{display:grid;gap:8px;margin-bottom:26px}
.ch{display:grid;grid-template-columns:34px 1fr auto;gap:12px;align-items:baseline;padding:10px 14px;border-radius:4px 12px 4px 12px;background:rgba(255,255,255,.55);border:1px solid rgba(51,150,230,.25)}
.ch b{font:600 12px var(--mono);color:#1f7cff}.ch span{font:400 14px "IBM Plex Sans",sans-serif;color:#082a5c}.ch small{font:500 10px var(--mono);letter-spacing:.14em;color:#2a6fb8;text-transform:uppercase}
.ch.empty{grid-template-columns:1fr}.ch.empty span{color:#2d5d93;font-style:italic}
/* quests: rows like hologram panels */
.jq-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:30px}
.jq{display:grid;grid-template-columns:24px 1fr auto;gap:14px;align-items:start;padding:15px 18px;margin-bottom:12px;border-radius:8px;
  background:linear-gradient(180deg,rgba(255,255,255,.78),rgba(232,245,255,.62));border:1px solid rgba(120,200,255,.7);box-shadow:0 0 16px rgba(51,198,255,.16),0 6px 14px rgba(20,60,130,.08)}
.jq i{width:18px;height:18px;margin-top:2px;border-radius:50%;border:2px solid #33a8f0;box-shadow:0 0 8px rgba(51,198,255,.5)}
.jq.done i{background:#33c6ff;border-color:#33c6ff}
.jq.done{opacity:.6}.jq.done b{text-decoration:line-through;text-decoration-color:rgba(10,95,214,.5)}
.jq b{display:block;font:600 15px "IBM Plex Sans",ui-sans-serif,sans-serif;color:#082a5c}
.jq b small{font:500 11.5px "Apple SD Gothic Neo","Noto Sans KR",sans-serif;color:#2a6fb8;margin-left:8px}
.jq span{display:block;font:400 13px/1.45 "IBM Plex Sans",sans-serif;color:#3d6ea8;margin-top:3px}
.jq .k{font:600 9.5px var(--mono);letter-spacing:.2em;text-transform:uppercase;padding:3px 8px;border-radius:3px;white-space:nowrap}
.jq .k.main{background:#0a5fd6;color:#fff}.jq .k.side{color:#0a5fd6;border:1px solid rgba(10,95,214,.45)}
.jq.new{box-shadow:0 0 0 1px #33c6ff,0 0 22px rgba(51,198,255,.45)}
.jr-pips{display:flex;gap:8px}.jr-pips i{width:12px;height:12px;border-radius:50%;border:2px solid #33a8f0}
/* records: an album card with the vinyl peeking out, spinning while it plays */
.jrec{position:relative;display:grid;grid-template-columns:150px 1fr auto;align-items:center;gap:22px;padding:16px 22px 16px 16px;margin-bottom:16px;border-radius:10px;
  background:linear-gradient(180deg,rgba(255,255,255,.8),rgba(232,245,255,.62));border:1px solid rgba(120,200,255,.7);box-shadow:0 0 16px rgba(51,198,255,.16),0 6px 14px rgba(20,60,130,.08);max-width:820px}
.jrec .sleeve{position:relative;width:150px;height:150px}
.jrec .sleeve img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:6px;z-index:1;box-shadow:0 8px 18px rgba(20,60,130,.25)}
.jrec .disc{position:absolute;top:8px;left:38px;width:134px;height:134px;border-radius:50%;background:radial-gradient(circle,#e8f6ff 0 6%,#111 7% 22%,#1d1d1d 23% 100%);box-shadow:inset 0 0 0 2px #2a2a2a;transition:left .5s}
.jrec .disc::after{content:"";position:absolute;inset:14%;border-radius:50%;background:repeating-radial-gradient(circle,rgba(255,255,255,.06) 0 1px,transparent 1px 3px)}
.jrec.playing .disc{left:62px;animation:spin 2.4s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.jrec b{display:block;font:600 17px "IBM Plex Sans",ui-sans-serif,sans-serif;color:#082a5c}
.jrec span{font:400 13.5px "IBM Plex Sans",sans-serif;color:#3d6ea8}
.jrec button{all:unset;cursor:var(--cur-hover,pointer);width:46px;height:46px;border-radius:50%;display:grid;place-items:center;font-size:15px;color:#fff;background:linear-gradient(135deg,#33c6ff,#1f7cff);box-shadow:0 0 18px rgba(51,198,255,.6)}
.jrec button:disabled{background:#c7d8ea;box-shadow:none;cursor:default}
.jrec.locked{opacity:.6}.jrec.locked .sleeve img{filter:grayscale(1) brightness(.6) blur(2px)}
`;
const jst=document.createElement("style"); jst.textContent=jcss; document.head.appendChild(jst);

const ICON={
  quests:`<svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11"/><path d="M3.5 6l1.2 1.2L7 4.8M3.5 12l1.2 1.2L7 10.8"/><circle cx="5" cy="18" r="1.3"/></svg>`,
  case:`<svg viewBox="0 0 24 24"><path d="M3 7.5V18a1.5 1.5 0 0 0 1.5 1.5h15A1.5 1.5 0 0 0 21 18V9a1.5 1.5 0 0 0-1.5-1.5H11L9 5H4.5A1.5 1.5 0 0 0 3 6.5z"/><path d="M8 13.5h8M8 16.5h5"/></svg>`,
  mem:`<svg viewBox="0 0 24 24"><path d="M12 3l2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3z"/><circle cx="12" cy="12" r="1.6"/></svg>`,
  chars:`<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.3"/><path d="M3 19.5c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5"/><circle cx="17" cy="9" r="2.4"/><path d="M15.8 14.2c2.6.1 4.6 2 5.2 4.8"/></svg>`,
  seoul:`<svg viewBox="0 0 24 24"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/></svg>`,
  rec:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3.5a8.5 8.5 0 0 1 8.2 6.2"/></svg>`,
};
const JT=[["quests","Quests","퀘스트"],["chars","Characters","인물"],["case","Case file","사건 파일"],["mem","Memory","기억"],["seoul","Seoul","서울"],["rec","Records","음반"]];
const edgeSvg=document.createElementNS("http://www.w3.org/2000/svg","svg"); edgeSvg.setAttribute("width","0"); edgeSvg.setAttribute("height","0"); edgeSvg.style.position="absolute";
const edgeF=(id,r,g,b)=>`<filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0" result="g0"/><feGaussianBlur in="g0" stdDeviation="1.4" result="g"/>
  <feConvolveMatrix in="g" order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true" result="e"/>
  <feComponentTransfer in="e"><feFuncR type="linear" slope="16" intercept="-.12"/><feFuncG type="linear" slope="16" intercept="-.12"/><feFuncB type="linear" slope="16" intercept="-.12"/></feComponentTransfer>
  <feColorMatrix type="matrix" values="0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  .33 .33 .33 0 0"/>
  <feGaussianBlur stdDeviation=".35"/></filter>`;
edgeSvg.innerHTML=edgeF("jrEdge",.55,.9,1)+edgeF("jrEdgeRed",1,.35,.45); document.body.appendChild(edgeSvg);
const jr=document.createElement("div"); jr.className="jr"; jr.setAttribute("role","dialog"); jr.setAttribute("aria-modal","true"); jr.setAttribute("aria-label","Quests");
jr.innerHTML=`<header class="jr-top"><div class="jr-brand"><i></i><b>Luminance</b><small>Episode 01</small></div>
  <nav class="jr-tabs" role="tablist">${JT.map(([k,n,ko])=>`<button type="button" class="jr-tab" role="tab" data-j="${k}">${ICON[k]}<b>${n}</b><small lang="ko">${ko}</small><span class="gm-badge" data-jb="${k}"></span></button>`).join("")}</nav>
  <button type="button" class="jr-x" aria-label="Close">Close<kbd>Esc</kbd></button></header><section class="jr-pane" id="jrPane"></section>`;
document.body.appendChild(jr);
const pane=jr.querySelector("#jrPane");
let jopen=false, jtab="quests", mapFrame=null;
const CK=`<span class="ck a"></span><span class="ck b"></span><span class="ck c"></span><span class="ck d"></span>`;
const card=(o)=>`<div class="jc${o.locked?" locked":""}${o.portrait?" portrait":""}${o.m?" pick":""}${o.m&&o.m===memSel?" sel":""}"${o.m?` data-m="${o.m}" role="button" tabindex="0" aria-label="Hold ${o.title}"`:""}>${o.img?`<img src="${o.img}" alt="" loading="lazy">`:""}${o.extra||""}${CK}${o.new?`<span class="new">New</span>`:""}
  <div class="cap"><small>${o.kicker||""}</small><b>${o.title}</b>${o.text?`<span>${o.text}</span>`:""}</div></div>`;

const MEMIMG={"book":"img/cinematic/intro/pause-frame-inscription.png","his-book":"img/cinematic/intro/stills/shot03-nightstand.png","his-record":"img/cinematic/intro/stills/shot05-record-player.png"};
const jrender={
  quests:()=>{const col=(k,label,ko)=>{const qs=QL.filter(q=>q.kind===k&&qState(q)!=="hidden").sort((a,b)=>a.done()-b.done());
      return `<div><h4>${label} · ${ko} <em>${qs.filter(q=>q.done()).length} / ${qs.length}</em></h4>${qs.map(q=>`<div class="jq${q.done()?" done":""}${(S.q[q.id]||{}).seen?"":" new"}"><i></i><div><b>${q.title}<small lang="ko">${q.ko}</small></b><span>${q.hint}</span></div><span class="k ${q.kind}">${q.kind==="main"?"Main":"Side"}</span></div>`).join("")}</div>`;};
    return `<h2>Quests</h2><div class="ko" lang="ko">퀘스트</div><p class="lead">Right now: ${objective()}</p><div class="jq-cols">${col("main","Main story","메인 스토리")}${col("side","Side","서브")}</div>`;},
  case:()=>{
    const tabs=`<nav class="cf-files"><button type="button" class="cf-f${caseFile==="tags"?" on":""}" data-cf="tags"><b>“Remember” tags</b><small lang="ko">기억</small><em>${TAGS.filter(t=>S.tags.includes(t.id)).length} / ${TAGS.length}</em></button><button type="button" class="cf-f${caseFile==="hae"?" on":""}" data-cf="hae"><b>Han Hae</b><small lang="ko">한해 형사</small><em>Locked</em></button></nav>`;
    if(caseFile==="tags"){
      const found=TAGS.filter(t=>S.tags.includes(t.id));
      if(!tagSel||!S.tags.includes(tagSel)) tagSel=found.length?found[found.length-1].id:null;
      const t=TAGS.find(x=>x.id===tagSel), Z=6;
      const bp=(v,z)=>((parseFloat(v)/100*z-.5)/(z-1)*100).toFixed(2)+"%";
      const row=x=>S.tags.includes(x.id)
        ?`<button type="button" class="tg${x.id===tagSel?" sel":""}${seen[x.id]?"":" new"}" data-tg="${x.id}"><span class="shot" style="background-image:url('${x.img}');background-position:${bp(x.at.left,Z)} ${bp(x.at.top,Z)}"><i></i><u lang="ko">기억</u></span><span><small>Tag ${String(x.n).padStart(2,"0")} · ${x.room.split(" · ")[0]}</small><b>Found: ${x.where}${seen[x.id]?"":`<em class="nw">New</em>`}</b><span>${x.room.split(" · ")[1]}${(S.tagT||{})[x.id]?` · logged ${new Date(S.tagT[x.id]).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}`:""}</span></span></button>`
        :`<div class="tg locked"><span class="shot"></span><span><small>Tag ${String(x.n).padStart(2,"0")} · ${x.room.split(" · ")[0]}</small><b>Not found yet</b><span>Somewhere in ${x.room.split(" · ")[1]}.</span></span></div>`;
      const side=t?`<aside class="jprof jtag"><div class="pic snap" style="background-image:url('${t.img}');background-position:${bp(t.at.left,Z)} ${bp(t.at.top,Z)}"><span class="ring"></span><u lang="ko">기억</u><span class="tw" lang="ko">기억</span><span class="file">Tag ${String(t.n).padStart(2,"0")} / ${TAGS.length}</span>${CKS2}</div>
        <div class="bd"><h3>“Remember” <small lang="ko">기억</small></h3><span class="role">${t.where} · ${t.room.split(" · ")[0]}</span><p>${t.info[1]}</p>
        <dl><dt>Found</dt><dd>${t.text}</dd><dt>Where</dt><dd>${t.room}</dd>${(S.tagT||{})[t.id]?`<dt>Logged</dt><dd>${new Date(S.tagT[t.id]).toLocaleString([], {weekday:"short",hour:"numeric",minute:"2-digit"})}</dd>`:""}<dt>Who</dt><dd>Unknown.</dd></dl></div></aside>`
        :`<aside class="jprof jtag"><div class="pic snap empty"><span class="tw" lang="ko">기억</span>${CKS2}</div><div class="bd"><h3>“Remember” <small lang="ko">기억</small></h3><p>Nothing logged yet. Look closely in every room: low, small, easy to miss.</p></div></aside>`;
      return `<h2>Case file</h2><div class="ko" lang="ko">사건 파일</div>${tabs}
      <div class="jm"><div><h4>“Remember” tags · 기억 <em>${found.length} / ${TAGS.length}</em></h4>
      <p class="lead" style="margin:-4px 0 16px">Someone is leaving one word, 기억, “Remember”, scratched small into walls and sprayed across the city. Nobody says who. Each one you find is logged here: what it was on, and where.</p>
      <div class="tglog">${TAGS.map(row).join("")}</div><p class="lead" style="margin-top:14px;opacity:.7">More will be logged as the story opens up new rooms.</p></div>${side}</div>`;
    }
    return `<h2>Case file</h2><div class="ko" lang="ko">사건 파일 · 한해 형사</div>${tabs}<p class="lead">Detective Han Hae's file opens when her chapters begin, from her morning in Room 06.</p>
    <h4>Evidence <em>0 / 3</em></h4><div class="jr-grid">
      ${card({locked:1,img:"img/16-seongbuk-kitchen.png",kicker:"Evidence 01",title:"The Mira-class case",text:"Handed to her at the briefing."})}
      ${card({locked:1,img:"img/08-hae-apartment.png",kicker:"Evidence 02",title:"Case files",text:"Swept into her bag on the way out."})}
      ${card({locked:1,img:"img/17-cordon.png",kicker:"Evidence 03",title:"The cordon",text:"Aevum's recovery vehicle waits at the tape."})}</div>
    <h4>Crack signs <em>0 / 3</em></h4><p class="lead" style="margin:-4px 0 16px">A field guide that fills in as you notice bots slipping.</p><div class="jr-grid">
      ${card({locked:1,img:"img/char-barista-bot.png",kicker:"Sign 01",title:"A pause before the smile",text:"Not noticed yet."})}
      ${card({locked:1,img:"img/11-coffee-stand.png",kicker:"Sign 02",title:"A tap on the counter",text:"Not noticed yet."})}
      ${card({locked:1,img:"img/char-mira-class.png",kicker:"Sign 03",title:"A repeated phrase",text:"Not noticed yet."})}</div>
`;},
  mem:()=>{const order=["his-book","book","his-record"], has=id=>id==="f001"?S.frag.includes("f001"):id.startsWith("t-room")?S.tags.includes(id):(MEMORY.find(m=>m.id===id)||{found:()=>false}).found();
    if(!memSel||!has(memSel)) memSel=order.find(has)||null;
    const mc=m=>m.found()?card({m:m.id,img:MEMIMG[m.id],kicker:m.group==="pinocchio"?"Pinocchio":"Truly his",title:m.name,text:m.text,new:!seen[m.id]}):card({locked:1,img:MEMIMG[m.id],kicker:"Memory",title:"Not found yet",text:"Somewhere in the room."});
    const INFO={"his-book":["Truly his","Pinocchio","Old, worn at the corners. The only thing in the room that is truly his.","Touch to open it","눌러서 펼치기"],
      "book":["Pinocchio","The back page","“My son. — Appa.” Written in a hand he doesn't know.","Touch the words","글씨를 만져 보기"],
      "his-record":["Truly his","The record","First Love's Light. When the needle drops, something warm fills the room.","Touch to play","눌러서 재생"],
      ...Object.fromEntries(TAGS.map(t=>[t.id,["기억 · Remember · "+t.n+" / "+TAGS.length,t.info[0],t.info[1],"Touch the word","만져 보기"]]))};
    const I=memSel&&INFO[memSel], CKS=`<span class="ck a"></span><span class="ck b"></span>`;
    const st=!memSel?`<div class="empty">Nothing kept yet. Find things in the room and they'll be here to hold.</div>`
      :memSel==="his-book"||memSel==="book"?`<canvas class="bookcv" width="1228" height="834"></canvas><canvas class="ink" width="1228" height="834"></canvas>`
      :memSel==="his-record"?`<div class="tt${playing&&playing.id==="first"?" on":""}"><span class="plat"><span class="vinyl"><span class="label" style="background-image:url('img/cinematic/intro/stills/shot06-record-side.png')"></span></span></span><span class="arm"></span><span class="lamp"></span></div>`
      :memSel==="f001"?`<canvas class="static" width="240" height="150" style="image-rendering:pixelated"></canvas>`
      :`<span class="tagwall" style="${(t=>t?`background:url('${t.img}') ${t.wall} no-repeat`:"")(TAGS.find(t=>t.id===memSel))}"></span><span class="tagword" lang="ko">기억</span>`;
    const obj=`<aside class="jprof jobj"><div class="stage" data-o="${memSel||""}">${st}${CKS}</div>
      <div class="bd">${I?`<small class="k">${I[0]}</small><h3>${I[1]}</h3><p>${I[2]}</p><span class="hint"><i></i>${I[3]}<small lang="ko">${I[4]}</small></span>`:`<h3>Memory</h3>`}</div></aside>`;
    return `<div class="jm"><div><h2>Memory</h2><div class="ko" lang="ko">기억 · 지유</div><p class="lead">What Ji-yoo keeps, and what Aevum can't read.</p>
    <h4>Pinocchio <em>${MEMORY.filter(m=>m.group==="pinocchio"&&m.found()).length} / 1</em></h4><div class="jr-grid">${MEMORY.filter(m=>m.group==="pinocchio").map(mc).join("")}</div>
    <h4>Choices · 선택 <em>${S.choices.length}</em></h4><p class="lead" style="margin:-4px 0 14px">Twenty-two years of not choosing. These are the first ones he made himself.</p>
    <div class="chl">${S.choices.length?S.choices.map((c,i)=>`<div class="ch"><b>${String(i+1).padStart(2,"0")}</b><span>${c.text}</span><small>Room ${String(c.room).padStart(2,"0")}</small></div>`).join(""):`<div class="ch empty"><span>None yet. Nobody has ever asked him what he wants.</span></div>`}</div>
    <h4>Things that are truly his <em>${MEMORY.filter(m=>m.group==="his"&&m.found()).length} / 2</em></h4><div class="jr-grid">${MEMORY.filter(m=>m.group==="his").map(mc).join("")}</div>
</div>${obj}</div>`;},
  chars:()=>{const rd=w=>`<span class="redact" style="width:${w}px"></span>`;
    const groups=[...new Set(CAST.map(c=>c.group))];
    const cardOf=c=>{const known=met(c.id), shown=known||c.id==="hae";
      return `<button type="button" class="jc portrait jch${known?"":" locked"}${charSel===c.id?" sel":""}" data-c="${c.id}" aria-label="${shown?c.name:"Unknown"}">
        ${known?`<img src="${c.img}" alt="" loading="lazy">`:`<img class="bw" src="${c.img}" alt=""><canvas class="pxloop" data-src="${c.img}"></canvas>`}${CK}${known&&c.id!=="ji-yoo"&&!(S.seenChars||[]).includes(c.id)?`<span class="new">New</span>`:""}
        <div class="cap"><small>${known?c.role:"File · ERR"}</small><b>${shown?c.name:"Unknown"}</b>${known?"":`<span>Not yet met</span>`}</div></button>`;};
    const c=CAST.find(x=>x.id===charSel)||CAST[0], known=met(c.id), shown=known||c.id==="hae";
    const prof=known?`<aside class="jprof"><div class="pic"><img src="${c.img}" alt="${c.name}"><span class="ck a"></span><span class="ck b"></span><span class="file">${c.group} · File</span></div>
        <div class="bd"><h3>${c.name}${KO[c.id]?`<small lang="ko">${KO[c.id]}</small>`:""}</h3><span class="role">${c.role}</span><p>${c.summary}</p>
        <dl>${c.facts.map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl></div></aside>`
      :`<aside class="jprof err"><div class="pic" role="img" aria-label="A corrupted, unreadable photo"><img class="bw" src="${c.img}" alt=""><canvas class="pxloop" data-src="${c.img}"></canvas><span class="ck a"></span><span class="ck b"></span>
        <span class="file">File · ERR</span><span class="lost">SIGNAL LOST<small lang="ko">신호 없음</small></span></div>
        <div class="bd"><h3>${shown?c.name:"Unknown"}${shown&&KO[c.id]?`<small lang="ko">${KO[c.id]}</small>`:""}</h3><span class="role">${shown?c.role.split(" · ")[0]:"Unknown"}</span><span class="errline">ERR · File unavailable · not yet met</span>
        <p>${rd(230)} ${rd(160)} ${rd(200)} ${rd(120)}</p><dl>${[["Age",40],["Role",170],["Home",150],["Notes",120]].map(([k,w])=>`<dt>${k}</dt><dd>${rd(w)}</dd>`).join("")}</dl></div></aside>`;
    return `<div class="jm"><div><h2>Characters</h2><div class="ko" lang="ko">인물</div><p class="lead">People Ji-yoo has met: ${S.met.length} of ${CAST.length}. More files open as the story goes on.</p>`+
      groups.map(g=>`<h4>${g}</h4><div class="jr-grid chars">${CAST.filter(x=>x.group===g).map(cardOf).join("")}</div>`).join("")+`</div>${prof}</div>`;},
  seoul:()=>"",
  rec:()=>{const R=[{id:"room",name:"Ji-yoo's room",by:"Scene 01 · the room's own music",cover:"img/01-ji-yoo-room.png",src:"music/scene 01 - ji-yoo's room.mp3",got:true},
      {id:"first",name:"First Love's Light",by:"On his record player",cover:"img/cinematic/intro/stills/shot06-record-side.png",src:"music/First Loves Light.mp3",got:!!S.mem.record}];
    return `<h2>Records</h2><div class="ko" lang="ko">음반</div><p class="lead">Music you've found. Play any of it here.</p><h4>Your collection <em>${R.filter(r=>r.got).length} / ${R.length}</em></h4>`+
      R.map(r=>`<div class="jrec${r.got?"":" locked"}${playing&&playing.id===r.id?" playing":""}" data-r="${r.id}"><div class="sleeve"><span class="disc"></span><img src="${r.cover}" alt=""></div>
        <div><b>${r.got?r.name:"Not found yet"}</b><span>${r.got?r.by:"Listen for it."}</span></div><button type="button" ${r.got?"":"disabled"} data-src="${r.got?r.src:""}" aria-label="Play">${playing&&playing.id===r.id?"❚❚":"▶"}</button></div>`).join("");},
};
function jshow(t){jtab=t; jr.querySelectorAll(".jr-tab").forEach(b=>b.setAttribute("aria-selected",b.dataset.j===t));
  pane.classList.toggle("map",t==="seoul");
  if(t==="seoul"){
    // the live hologram map, train ride and all
    if(!mapFrame){mapFrame=document.createElement("iframe"); mapFrame.src="holo-map.html?embed&game&known="+S.places.map(pl=>PLACE_N[pl]).filter(Boolean).join(",")+"&been="+S.rooms.map(r=>ROOM_IMG[r]).filter(Boolean).join(","); mapFrame.title="Seoul, 3062";
      mapFrame.addEventListener("load",()=>{try{mapFrame.contentWindow.addEventListener("keydown",e=>{if(e.key==="Escape"||e.key==="q"||e.key==="Q"){closeJournal(); e.preventDefault();}});}catch(e){}});}
    pane.innerHTML=""; pane.appendChild(mapFrame);
  } else {if(mapFrame&&mapFrame.parentNode) mapFrame.remove(); pane.innerHTML=jrender[t](); pane.scrollTop=0;}
  pane.querySelectorAll("canvas.pxloop").forEach(pxPrep);
  pane.querySelectorAll("canvas.pix").forEach(cv=>{const im=new Image(); im.onload=()=>{
    const w=+cv.dataset.w, box=cv.parentNode.getBoundingClientRect(), h=Math.max(1,Math.round(w*box.height/box.width));
    cv.width=w; cv.height=h; const c=cv.getContext("2d"), sc=Math.max(w/im.width,h/im.height), dw=im.width*sc, dh=im.height*sc;
    c.drawImage(im,(w-dw)/2,(h-dh)*.08,dw,dh);}; im.src=cv.dataset.src;});
  if(t==="case"){
    pane.querySelectorAll("[data-cf]").forEach(b=>b.onclick=()=>{caseFile=b.dataset.cf; try{SFX("tick");}catch(e){} jshow("case");});
    pane.querySelectorAll("[data-tg]").forEach(b=>b.onclick=()=>{tagSel=b.dataset.tg; try{SFX("card");}catch(e){} const y=pane.scrollTop; jshow("case"); pane.scrollTop=y;});
    TAGS.forEach(x=>{if(S.tags.includes(x.id)) seen[x.id]=true;}); S.seen=seen; save();}
  if(t==="mem"){pane.querySelectorAll("[data-m]").forEach(b=>{const go=()=>{memSel=b.dataset.m; try{SFX("card");}catch(e){} const y=pane.scrollTop; jshow("mem"); pane.scrollTop=y;};
      b.onclick=go; b.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault(); go();}};}); holdObject(pane.querySelector(".jobj .stage"));}
  {const pf=pane.querySelector(".jm .jprof");
    if((t==="chars"||t==="mem")&&pf&&!matchMedia("(prefers-reduced-motion: reduce)").matches){
      pf.addEventListener("pointermove",e=>{const r=pf.getBoundingClientRect(), x=(e.clientX-r.left)/r.width, y=(e.clientY-r.top)/r.height;
        pf.classList.add("hov"); pf.style.setProperty("--ry",((x-.5)*16)+"deg"); pf.style.setProperty("--rx",((.5-y)*12)+"deg");
        pf.style.setProperty("--gx",(x*100)+"%"); pf.style.setProperty("--gy",(y*100)+"%");});
      pf.addEventListener("pointerleave",()=>{pf.classList.remove("hov"); ["--ry","--rx","--gx","--gy"].forEach(v=>pf.style.removeProperty(v));});}}
  if(t==="chars"){pane.querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{charSel=b.dataset.c; try{SFX("card");}catch(e){} const y=pane.scrollTop; jshow("chars"); pane.scrollTop=y;});
    S.seenChars=[...S.met];}
  if(t==="rec") pane.querySelectorAll(".jrec button[data-src]").forEach(b=>b.onclick=()=>{const id=b.closest(".jrec").dataset.r; togglePlay(id,b.dataset.src); jshow("rec");});
  if(t==="mem"){MEMORY.forEach(m=>{if(m.found()) seen[m.id]=true;}); FRAGS.forEach(f=>{if(S.frag.includes(f.id)) seen[f.id]=true;}); S.seen=seen;}
  if(t==="rec") S.seenRec=!!S.mem.record;
  if(t==="quests") QL.forEach(q=>{if(qState(q)!=="hidden"){S.q[q.id]=Object.assign(S.q[q.id]||{},{seen:true,seenDone:q.done()});}});
  save(); badges();}
// the pixel shimmer, looping: a glowing scan line sweeps down; the rows behind it break into soft black-and-white pixel blocks
// that fade as it moves on, with a few sparks along the line. Adapted from the storyboard's pixel reveal
const PX_SIZES=[14,9,6], PX_D=2600;
function pxPrep(cv){const im=new Image(); im.onload=()=>{const box=cv.getBoundingClientRect(), W=Math.max(1,box.width), H=Math.max(1,box.height), dpr=Math.min(2,devicePixelRatio||1);
    cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr);
    const sc=Math.max(W/im.width,H/im.height), dw=im.width*sc, dh=im.height*sc, dx=(W-dw)/2, dy=(H-dh)*.1;
    const levels=PX_SIZES.map(S=>{const c=document.createElement("canvas"); c.width=Math.max(1,Math.ceil(W/S)); c.height=Math.max(1,Math.ceil(H/S));
      const x=c.getContext("2d"); x.drawImage(im,dx/S,dy/S,dw/S,dh/S); const d=x.getImageData(0,0,c.width,c.height);
      for(let i=0;i<d.data.length;i+=4){const L=d.data[i]*.3+d.data[i+1]*.59+d.data[i+2]*.11; d.data[i]=d.data[i+1]=d.data[i+2]=L;} x.putImageData(d,0,0); return c;});
    cv._px={W,H,dpr,levels,off:Math.random()};}; im.src=cv.dataset.src;}
function pxFrame(now){
  if(jopen) document.querySelectorAll("canvas.pxloop").forEach(cv=>{const P=cv._px; if(!P) return; const {W,H,dpr,levels}=P, ctx=cv.getContext("2d");
    ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,W,H);
    const p=((now/PX_D)+P.off)%1.35, yL=p*H*1.15, BAND=5, TAIL=H*.42;
    for(let y=Math.max(0,yL-TAIL);y<Math.min(H,yL);y+=BAND){
      const k=(yL-y)/TAIL, li=Math.min(PX_SIZES.length-1,Math.floor(k*PX_SIZES.length)), L=levels[li], S=PX_SIZES[li];
      ctx.imageSmoothingEnabled=false; ctx.globalAlpha=(1-k)*.95; ctx.drawImage(L,0,y/S,L.width,BAND/S,0,y,L.width*S,BAND);
      ctx.imageSmoothingEnabled=true; ctx.globalAlpha=(1-k)*.5; ctx.drawImage(L,0,y/S,L.width,BAND/S,0,y,L.width*S,BAND);}
    // a pale hologram wash just ahead of the line, then the line and its sparks
    ctx.globalAlpha=1;
    if(yL>0&&yL<H+6){const g=ctx.createLinearGradient(0,yL,0,yL+H*.12); g.addColorStop(0,"rgba(255,255,255,.3)"); g.addColorStop(1,"rgba(255,255,255,0)"); ctx.fillStyle=g; ctx.fillRect(0,yL,W,H*.12);
      const lg=ctx.createLinearGradient(0,0,W,0); lg.addColorStop(0,"rgba(255,255,255,0)"); lg.addColorStop(.5,"rgba(255,255,255,.95)"); lg.addColorStop(1,"rgba(255,255,255,0)");
      ctx.shadowColor="rgba(255,255,255,.9)"; ctx.shadowBlur=12; ctx.fillStyle=lg; ctx.fillRect(0,yL-1,W,2.5); ctx.shadowBlur=0;
      for(let i=0;i<6;i++){const S=2+Math.random()*4; ctx.fillStyle=`rgba(255,255,255,${.6+Math.random()*.35})`; ctx.fillRect(Math.random()*W,yL-Math.random()*18,S,S);}}
  });
  requestAnimationFrame(pxFrame);}
requestAnimationFrame(pxFrame);
/* the memory objects you can touch */
const BKS={frames:73,cols:9,fw:614,fh:417,fps:24}, bkSheet=new Image(); bkSheet.src="img/book-ui/book-open-sheet.webp";
let staticRaf=0;
function holdObject(stg){cancelAnimationFrame(staticRaf); if(!stg) return; const o=stg.dataset.o;
  if(o==="his-book"||o==="book"){
    const cv=stg.querySelector(".bookcv"), ink=stg.querySelector(".ink"), c=cv.getContext("2d");
    const draw=i=>{const sh=`translateX(${(-24*(1-i/(BKS.frames-1))).toFixed(2)}%)`; cv.style.transform=sh; ink.style.transform=sh;
      c.clearRect(0,0,cv.width,cv.height); c.drawImage(bkSheet,(i%BKS.cols)*BKS.fw,Math.floor(i/BKS.cols)*BKS.fh,BKS.fw,BKS.fh,0,0,cv.width,cv.height);};
    let frame=o==="book"?BKS.frames-1:0, run=0;
    const ready=()=>{draw(frame);
      if(o==="book"){   // lift the handwriting off the last frame, so it can glow
        const x=ink.getContext("2d"); x.drawImage(cv,0,0); const R=[740,290,330,220], d=x.getImageData(...R);
        for(let i=0;i<d.data.length;i+=4){const L=d.data[i]*.3+d.data[i+1]*.59+d.data[i+2]*.11, a=Math.max(0,Math.min(1,(105-L)/45)); d.data[i]=235; d.data[i+1]=150; d.data[i+2]=45; d.data[i+3]=a*255;}
        x.clearRect(0,0,ink.width,ink.height); x.putImageData(d,R[0],R[1]);
        // thicken the strokes a little so the glow reads at this size
        const t=document.createElement("canvas"); t.width=ink.width; t.height=ink.height; t.getContext("2d").drawImage(ink,0,0);
        for(const [dx,dy] of [[2,0],[-2,0],[0,2],[0,-2],[1,1],[-1,-1],[1,-1],[-1,1]]) x.drawImage(t,dx,dy);}};
    if(bkSheet.complete) ready(); else bkSheet.onload=ready;
    const play=(from,to)=>{const id=++run, t0=performance.now(), dir=Math.sign(to-from);
      const go=now=>{if(id!==run) return; const n=Math.round((now-t0)/1000*BKS.fps), i=from+dir*Math.min(n,Math.abs(to-from)); frame=i; draw(i); if(i!==to) requestAnimationFrame(go);}; requestAnimationFrame(go);};
    stg.onclick=()=>{
      if(o==="his-book"){if(frame===0){play(0,BKS.frames-1); setTimeout(()=>{try{SFX("book");}catch(e){}},870);} else if(frame===BKS.frames-1){play(BKS.frames-1,0); try{SFX("close",{vol:.6});}catch(e){}}}
      else{ink.classList.remove("glow"); void ink.offsetWidth; ink.classList.add("glow"); try{SFX("trace",{from:.22,dur:.3});}catch(e){}}};
  }
  if(o==="his-record") stg.onclick=()=>{togglePlay("first","music/First Loves Light.mp3"); stg.querySelector(".tt").classList.toggle("on",!!(playing&&playing.id==="first")); try{SFX("toggle");}catch(e){}};
  if(o==="f001"){
    // a sound wave made of static: the band swells and shrinks along its length, always moving, and glitches as it goes
    const cv=stg.querySelector(".static"), c=cv.getContext("2d"), W=cv.width, H=cv.height, im=c.createImageData(W,H); let burst=0, t0=performance.now();
    const tick=now=>{if(!stg.isConnected) return; const t=(now-t0)/1000, d=im.data; d.fill(0);
      const surge=burst>0?burst/30:0, mid=H/2;
      for(let x=0;x<W;x++){
        if(Math.random()<.04) continue;   // a dropped column now and then
        const env=.18+.82*Math.abs(Math.sin(x*.045+t*2.3))*(.55+.45*Math.sin(x*.011-t*.9)), jag=(Math.random()-.5)*6;
        const hh=Math.max(1,(env*(.32+surge*.5))*H+jag);
        for(let y=Math.max(0,Math.floor(mid-hh));y<Math.min(H,Math.ceil(mid+hh));y++){
          const i=(y*W+x)*4, edge=1-Math.abs(y-mid)/hh, v=60+Math.random()*190*(.55+.45*edge);
          d[i]=d[i+1]=d[i+2]=v; d[i+3]=255*(.35+.65*edge);}}
      c.putImageData(im,0,0);
      // glitches: torn slices shifted sideways, and quick colour splits
      const tears=burst>0?6:2;
      for(let k=0;k<tears;k++){if(Math.random()<.5) continue; const y=mid+(Math.random()-.5)*H*.6, h=2+Math.random()*7, dx=(Math.random()-.5)*(burst>0?40:16);
        c.drawImage(cv,0,y,W,h,dx,y,W,h);}
      if(Math.random()<(burst>0?.6:.12)){c.globalCompositeOperation="screen"; c.globalAlpha=.55; const off=(Math.random()<.5?-1:1)*(2+Math.random()*4);
        c.filter="none"; c.drawImage(cv,off,0); c.fillStyle=Math.random()<.5?"rgba(80,220,255,.35)":"rgba(255,80,190,.3)"; c.fillRect(0,mid-H*.3,W,H*.6);
        c.globalAlpha=1; c.globalCompositeOperation="source-over";}
      // a thin bright centre line
      c.fillStyle="rgba(255,255,255,.55)"; c.fillRect(0,mid,W,1);
      if(burst>0) burst--;
      staticRaf=requestAnimationFrame(tick);}; staticRaf=requestAnimationFrame(tick);
    stg.onclick=()=>{burst=30; try{SFX("tick");}catch(e){}};}
  if(o&&o.startsWith("t-room")){const w=stg.querySelector(".tagword"); stg.onclick=()=>{w.classList.remove("lit"); void w.offsetWidth; w.classList.add("lit"); try{SFX("trace",{from:.22,dur:.3});}catch(e){}};}
}
// the map's own sounds come through the game's
window.LUMsfx=k=>{try{SFX({text:"tick",open:"open",card:"card",toggle:"toggle"}[k]||"tick");}catch(e){}};
function openJournal(t){if(open) closeMenu(); if(jopen){jshow(t||jtab); return;} jopen=true; pauseGame(); jr.classList.add("on"); jshow(t||jtab); try{SFX("open");}catch(e){}}
function closeJournal(){if(!jopen) return; jopen=false; jr.classList.remove("on"); stopPlayer(); if(mapFrame&&mapFrame.parentNode) mapFrame.remove(); resumeGame(); try{stage.focus&&window.focus();}catch(e){}}
jr.querySelectorAll(".jr-tab").forEach(b=>b.onclick=()=>{jshow(b.dataset.j); try{SFX("tick");}catch(e){}});
jr.querySelector(".jr-x").onclick=closeJournal;

/* ---------- the menu tag fades in once play begins; notice what gets found ---------- */
const roomTag=TAGS.find(t=>t.n===(window.LUM_ROOM||1));
const hiddenTag=document.createElement("div"); hiddenTag.lang="ko"; hiddenTag.textContent="기억"; hiddenTag.title="";
if(roomTag){
  hiddenTag.className="gm-tag "+roomTag.tone+(S.tags.includes(roomTag.id)?" found":""); hiddenTag.style.left=roomTag.at.left; hiddenTag.style.top=roomTag.at.top;
  stage.appendChild(hiddenTag);
  hiddenTag.addEventListener("pointerdown",e=>{e.stopPropagation(); if(S.tags.includes(roomTag.id)) return;
    S.tags.push(roomTag.id); S.tagT=S.tagT||{}; S.tagT[roomTag.id]=Date.now(); save(); hiddenTag.classList.add("found"); tagSel=roomTag.id; caseFile="tags";
    const n=TAGS.filter(t=>S.tags.includes(t.id)).length;
    try{say(roomTag.found,roomTag.where);}catch(e2){}
    try{pill("found","“Remember” tag found · 기억 발견",`${n} / ${TAGS.length} · logged in the Case file`);}catch(e2){}
    try{SFX("trace",{from:.22,dur:.3});}catch(e2){}});
}
/* ---------- places: Seoul fills in on the map as he reaches each place (the order he finds them is their number) ---------- */
const PLACE_N={hae:1,coffee:2,pojangmacha:3,train:4,rru:5,seongbuk:6,aevum:7,newcity:8,namsan:9};
S.places=S.places||[]; {const here=window.LUM_PLACE||"aevum"; if(!S.places.includes(here)){S.places.push(here); save();}}
const ROOM_IMG={1:"01-ji-yoo-room",2:"02-corridor"};   // add each new room's painting here
S.rooms=S.rooms||[]; {const r=window.LUM_ROOM||1; if(!S.rooms.includes(r)){S.rooms.push(r); save();}}
/* ---------- choices: twenty-two years of not choosing; every optional thing he does is logged as one he made ---------- */
const CHOICES={window:"He looked out at the sky.", record:"He put on a record, because he wanted to hear it.", exam:"He looked through the open door.", p001:"He stopped to read his own door."};
S.choices=S.choices||[];
function addChoice(id){if(!CHOICES[id]||S.choices.some(c=>c.id===id)) return;
  const first=!S.choices.length;
  S.choices.push({id,text:CHOICES[id],room:window.LUM_ROOM||1,t:Date.now()}); save();
  if(first) try{pill("found","A choice · 선택","The first one he made himself. It's in his journal.");}catch(e){}}
try{HOT.forEach(h=>{if(!CHOICES[h.id]) return; const a=h.act; h.act=function(){addChoice(h.id); return a.apply(this,arguments);};});}catch(e){}
// "Look outside" counts once he has looked
try{const w=HOT.find(h=>h.id==="window"), act=w.act; w.act=function(){S.side.window=true; save(); return act.apply(this,arguments);};}catch(e){}
function badges(){
  const qn=QL.filter(q=>{const st=qState(q), r=S.q[q.id]||{}; return st!=="hidden"&&(!r.seen||(q.done()&&!r.seenDone));}).length;
  const mn=MEMORY.filter(m=>m.found()&&!seen[m.id]).length+FRAGS.filter(f=>S.frag.includes(f.id)&&!seen[f.id]).length, tn=TAGS.filter(t=>S.tags.includes(t.id)&&!seen[t.id]).length;
  const rn=S.mem.record&&!S.seenRec?1:0, tot=qn+mn+rn;
  const qb=document.getElementById("qBadge"), mb=document.getElementById("mBadge");
  qb.textContent=tot; qb.classList.toggle("on",tot>0); mb.classList.remove("on");
  const set=(k,n)=>{const b=document.querySelector(`[data-jb="${k}"]`); if(b){b.textContent=n; b.classList.toggle("on",n>0);}};
  const cn=S.met.filter(id=>id!=="ji-yoo"&&!(S.seenChars||[]).includes(id)).length;
  set("quests",qn); set("mem",mn); set("case",tn); set("rec",rn); set("chars",cn);
  qb.textContent=tot+cn; qb.classList.toggle("on",tot+cn>0);}
let bookQ=false;
setInterval(()=>{
  const playingRoom=typeof begun!=="undefined"&&begun; bar.classList.toggle("on",playingRoom&&!document.getElementById("epi"));
  if(playingRoom){
    // Read Pinocchio joins the room's own quest list, after the knock quest
    try{if(!bookQ&&QUESTS.door){bookQ=true; addQuest("book","Read Pinocchio","Turn to the back page"); if(S.mem.book) doneQuest("book");}
      if(S.mem.book&&QUESTS.book) doneQuest("book");}catch(e){}
    QL.forEach(q=>{const st=qState(q), r=S.q[q.id]=S.q[q.id]||{};
      if(st!=="hidden"&&!r.announced){r.announced=true; save(); if(q.kind==="main"&&!q.done()) pill("new","New quest · 새 퀘스트",q.title,q.ko);}
      if(st==="done"&&!r.doneAnnounced){r.doneAnnounced=true; save(); pill("done",(q.kind==="main"?"Quest complete":"Side quest complete")+" · 완료",q.title,q.ko);}});
  }
  if(stage.classList.contains("open")&&!met("scientist")){S.met.push("scientist"); save(); pill("found","New character · 새 인물","Dr. Lee Ha-Eun · the Scientist");}
  badges();
  try{if(readBook&&!S.mem.book){S.mem.book=true; save();}}catch(e){}
  try{if(recOn&&!S.mem.record){S.mem.record=true; save();}}catch(e){}
},500);
})();
