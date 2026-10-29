// Viso ekrano meniu: klaviatūra, Escape ir fokusavimo valdymas.
const b=document.querySelector('.site-header .menu');
const n=document.getElementById('navigation');
function setMenuOpen(open,restoreFocus=false){
  n.classList.toggle('open',open);
  n.inert=!open;
  document.body.classList.toggle('navigation-open',open);
  b.setAttribute('aria-expanded',String(open));
  b.setAttribute('aria-label',open?'Uždaryti meniu':'Atverti meniu');
  if(open){
    const first=n.querySelector('.nav-panel-links a');
    if(first)first.focus({preventScroll:true});
  }else if(restoreFocus){
    b.focus({preventScroll:true});
  }
}
b.addEventListener('click',()=>setMenuOpen(!n.classList.contains('open'),true));
n.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenuOpen(false)));
n.addEventListener('click',event=>{if(event.target===n)setMenuOpen(false,true);});
document.querySelector('.site-header .logo').addEventListener('click',()=>setMenuOpen(false));
document.addEventListener('keydown',event=>{
  if(!n.classList.contains('open'))return;
  if(event.key==='Escape'){
    event.preventDefault();
    setMenuOpen(false,true);
    return;
  }
  if(event.key!=='Tab')return;
  const focusables=[b,...n.querySelectorAll('a[href]')];
  const first=focusables[0],last=focusables[focusables.length-1];
  if(event.shiftKey&&document.activeElement===first){
    event.preventDefault();last.focus();
  }else if(!event.shiftKey&&document.activeElement===last){
    event.preventDefault();first.focus();
  }
});
window.addEventListener('hashchange',()=>{if(n.classList.contains('open'))setMenuOpen(false);});
const video=document.getElementById('background-video');
const videoToggle=document.getElementById('video-toggle');
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
// Fonas paleidžiamas automatiškai; reduced-motion tebenaudojamas 3D judesiui.
// Paleidimą gali riboti pačios naršyklės ar telefono energijos taupymo politika.
let shouldPlay=true;
// Autoplay leidžiamas mobiliosiose naršyklėse tik tyliai ir pačiame puslapyje.
video.muted=true;
video.defaultMuted=true;
video.playsInline=true;
function syncVideoControl(){
 const paused=video.paused;
 videoToggle.setAttribute('aria-pressed',String(paused));
 videoToggle.setAttribute('aria-label',paused?'Paleisti fono vaizdo įrašą':'Pristabdyti fono vaizdo įrašą');
 videoToggle.querySelector('.video-icon').textContent=paused?'▶':'Ⅱ';
 videoToggle.querySelector('.video-label').textContent=paused?'Paleisti foną':'Pristabdyti foną';
}
function playBackground(){
 if(!shouldPlay||document.hidden)return;
 video.muted=true;
 const attempt=video.play();
 if(attempt&&typeof attempt.then==='function')attempt.then(syncVideoControl).catch(syncVideoControl);
 else syncVideoControl();
}
videoToggle.addEventListener('click',()=>{
 shouldPlay=video.paused;
 if(shouldPlay){video.autoplay=true;playBackground();}
 else{video.autoplay=false;video.pause();}
});
video.addEventListener('play',syncVideoControl);
video.addEventListener('pause',syncVideoControl);
video.addEventListener('error',()=>document.body.classList.add('video-unavailable'));
video.querySelector('source').addEventListener('error',()=>document.body.classList.add('video-unavailable'));
// Kai kurie telefonai priima pirmą play() kvietimą tik įkėlus vaizdo duomenis.
video.addEventListener('canplay',()=>{if(shouldPlay&&video.paused)playBackground();},{once:true});
window.addEventListener('pageshow',()=>{if(shouldPlay&&video.paused)playBackground();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else if(shouldPlay)playBackground();});
// Jei naršyklė atmetė automatinį paleidimą, pirma sąveika bet kur puslapyje
// suteikia dar vieną galimybę paleisti foną neieškant atskiro video mygtuko.
function retryBackgroundOnInteraction(){
 if(shouldPlay&&video.paused&&!document.hidden)playBackground();
}
document.addEventListener('touchstart',retryBackgroundOnInteraction,{passive:true,once:true});
document.addEventListener('pointerdown',retryBackgroundOnInteraction,{passive:true,once:true});
document.addEventListener('keydown',retryBackgroundOnInteraction,{once:true});
video.autoplay=true;
playBackground();

// Small, eased perspective shifts; static on touch and reduced-motion devices.
const heroStage=document.querySelector('.hero-stage');
const heroScene=document.querySelector('.hero-scene');
const finePointer=window.matchMedia('(hover: hover) and (pointer: fine)');
let tiltFrame=0,tiltX=0,tiltY=0,targetTiltX=0,targetTiltY=0,lastTiltTime=0;
function tiltAllowed(){return finePointer.matches&&!reducedMotion.matches&&!document.hidden;}
function renderTilt(now){
 const dt=lastTiltTime?Math.min(now-lastTiltTime,50):16.67;lastTiltTime=now;
 const ease=1-Math.exp(-dt/280);
 tiltX+=(targetTiltX-tiltX)*ease;tiltY+=(targetTiltY-tiltY)*ease;
 const settled=Math.abs(targetTiltX-tiltX)<.008&&Math.abs(targetTiltY-tiltY)<.008;
 if(settled){tiltX=targetTiltX;tiltY=targetTiltY;}
 heroScene.style.setProperty('--tilt-x',tiltX.toFixed(3)+'deg');
 heroScene.style.setProperty('--tilt-y',tiltY.toFixed(3)+'deg');
 tiltFrame=settled?0:requestAnimationFrame(renderTilt);
}
function queueTilt(){if(!tiltFrame){lastTiltTime=0;tiltFrame=requestAnimationFrame(renderTilt);}}
function resetTilt(immediate=false){targetTiltX=0;targetTiltY=0;if(immediate){cancelAnimationFrame(tiltFrame);tiltFrame=0;tiltX=0;tiltY=0;heroScene.style.removeProperty('--tilt-x');heroScene.style.removeProperty('--tilt-y');}else queueTilt();}
heroStage.addEventListener('pointermove',event=>{if(!tiltAllowed()||event.pointerType==='touch')return;const rect=heroStage.getBoundingClientRect();const x=Math.max(-1,Math.min(1,(event.clientX-rect.left)/rect.width*2-1));const y=Math.max(-1,Math.min(1,(event.clientY-rect.top)/rect.height*2-1));targetTiltX=-y*2.5;targetTiltY=x*3.5;queueTilt();},{passive:true});
heroStage.addEventListener('pointerleave',()=>resetTilt());
heroStage.addEventListener('pointercancel',()=>resetTilt());
heroStage.addEventListener('focusin',()=>resetTilt(true));
window.addEventListener('blur',()=>resetTilt(true));
window.addEventListener('scroll',()=>resetTilt(true),{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)resetTilt(true);});
reducedMotion.addEventListener('change',()=>resetTilt(true));
finePointer.addEventListener('change',()=>resetTilt(true));

const projectDetails=[...document.querySelectorAll('.project-detail')];
const expandProjects=document.querySelector('.projects-expand');
function syncProjectExpand(){const allOpen=projectDetails.every(item=>item.open);expandProjects.innerHTML=allOpen?'Suskleisti visus <span aria-hidden="true">−</span>':'Išskleisti visus <span aria-hidden="true">＋</span>';}
expandProjects.addEventListener('click',()=>{const open=!projectDetails.every(item=>item.open);projectDetails.forEach(item=>{item.open=open;});syncProjectExpand();});
projectDetails.forEach(item=>item.addEventListener('toggle',syncProjectExpand));

const copyCompany=document.querySelector('.copy-company');
const copyStatus=document.querySelector('.copy-status');
const copyManual=document.querySelector('.copy-manual');
function companyText(){const company=document.querySelector('.company-details');const lines=[company.querySelector('.company-name').textContent.trim()];company.querySelectorAll('.company-codes>div').forEach(row=>lines.push(row.querySelector('dt').textContent.trim()+': '+row.querySelector('dd').textContent.trim()));company.querySelectorAll('.bank-accounts>div').forEach(row=>lines.push(row.querySelector('dt').textContent.trim()+'; Nr: '+row.querySelector('dd').textContent.trim()));return lines.join('\n');}
copyCompany.addEventListener('click',async()=>{
 copyCompany.disabled=true;copyStatus.textContent='';copyManual.hidden=true;
 const text=companyText();let copied=false;
 try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(text);copied=true;}}catch(error){}
 if(!copied){
  copyManual.value=text;copyManual.hidden=false;copyManual.focus();copyManual.select();copyManual.setSelectionRange(0,text.length);
  try{copied=document.execCommand('copy');}catch(error){}
 }
 copyCompany.disabled=false;
 if(copied){copyManual.hidden=true;copyStatus.textContent='Visi rekvizitai nukopijuoti.';copyCompany.innerHTML='Nukopijuota <span aria-hidden="true">✓</span>';copyCompany.focus({preventScroll:true});}
 else{copyStatus.textContent='Automatiškai nukopijuoti nepavyko. Nukopijuokite pažymėtą tekstą (Ctrl+C arba ⌘C).';copyManual.focus();copyManual.select();}
});
