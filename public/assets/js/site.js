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

// Viršutinė juosta virš video lieka skaidri, o slenkant tampa tamsesnė.
const siteHeader=document.querySelector('header.site-header');
function syncScrolledHeader(){
  siteHeader.classList.toggle('is-scrolled',window.scrollY>20);
}
window.addEventListener('scroll',syncScrolledHeader,{passive:true});
window.addEventListener('pageshow',syncScrolledHeader);
syncScrolledHeader();
const video=document.getElementById('background-video');
const videoToggle=document.getElementById('video-toggle');
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
// Fono paleidimas lieka automatinis; reduced-motion riboja tik antraščių judesį.
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
 // Kai kuriose mobiliosiose naršyklėse play() ne tik atmeta Promise,
 // bet ir išmeta klaidą sinchroniškai. Tai negali sustabdyti hero antraščių JS.
 try{
  video.muted=true;
  const attempt=video.play();
  if(attempt&&typeof attempt.then==='function')attempt.then(syncVideoControl).catch(syncVideoControl);
  else syncVideoControl();
 }catch(error){
  // Video plakatas išlieka matomas, o mygtukas leidžia pabandyti paleisti rankiniu būdu.
  syncVideoControl();
 }
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

// Santūri pagrindinių žinučių rotacija (jokio 3D ar agresyvių efektų).
const heroPhrases=[...document.querySelectorAll('.nbcs-hero-phrase')];
let currentHeroPhrase=0;
let heroRotationTimer=null;
function showHeroPhrase(nextIndex){
  currentHeroPhrase=nextIndex;
  heroPhrases.forEach((phrase,index)=>{
    const active=index===nextIndex;
    phrase.classList.toggle('is-active',active);
    phrase.setAttribute('aria-hidden',String(!active));
  });
}
function syncHeroRotation(){
  if(heroRotationTimer!==null){
    window.clearInterval(heroRotationTimer);
    heroRotationTimer=null;
  }
  if(reducedMotion.matches){
    if(heroPhrases.length)showHeroPhrase(0);
    return;
  }
  if(document.hidden||heroPhrases.length<2)return;
  heroRotationTimer=window.setInterval(()=>{
    showHeroPhrase((currentHeroPhrase+1)%heroPhrases.length);
  },5600);
}
document.addEventListener('visibilitychange',syncHeroRotation);
// Safari po grįžimo iš kitos programėlės ar skirtuko gali neatkurti laikmačio
// vien pagal visibilitychange, todėl jį atnaujiname ir per pageshow / focus.
window.addEventListener('pageshow',syncHeroRotation);
window.addEventListener('focus',syncHeroRotation);
// Senesnėje iOS Safari MediaQueryList neturi addEventListener.
if(typeof reducedMotion.addEventListener==='function'){
  reducedMotion.addEventListener('change',syncHeroRotation);
}else if(typeof reducedMotion.addListener==='function'){
  reducedMotion.addListener(syncHeroRotation);
}
syncHeroRotation();

const projectDetails=[...document.querySelectorAll('.project-detail')];
const expandProjects=document.querySelector('.projects-expand');
function syncProjectExpand(){const allOpen=projectDetails.every(item=>item.open);expandProjects.innerHTML=allOpen?'Suskleisti visus <span aria-hidden="true">−</span>':'Išskleisti visus <span aria-hidden="true">＋</span>';}
expandProjects.addEventListener('click',()=>{const open=!projectDetails.every(item=>item.open);projectDetails.forEach(item=>{item.open=open;});syncProjectExpand();});
projectDetails.forEach(item=>item.addEventListener('toggle',syncProjectExpand));

const copyCompany=document.querySelector('.copy-company');
const copyStatus=document.querySelector('.copy-status');
const copyManual=document.querySelector('.copy-manual');
const companyDetails=document.querySelector('.company-details');
function companyText(){
  const lines=[companyDetails.querySelector('.company-name').textContent.trim()];
  companyDetails.querySelectorAll('.company-codes>div').forEach(row=>{
    lines.push(row.querySelector('dt').textContent.trim()+': '+row.querySelector('.company-code-value').textContent.trim());
  });
  companyDetails.querySelectorAll('.bank-accounts>div').forEach(row=>{
    lines.push(row.querySelector('dt').textContent.trim()+'; Nr: '+row.querySelector('.bank-account-value').textContent.trim());
  });
  return lines.join('\n');
}
async function copyContactText(text){
  copyManual.hidden=true;
  try{
    if(navigator.clipboard?.writeText){
      await navigator.clipboard.writeText(text);
      return true;
    }
  }catch(error){/* Leidimai ar naršyklės politika gali riboti kopijavimą. */}
  copyManual.value=text;
  copyManual.hidden=false;
  copyManual.focus({preventScroll:true});
  copyManual.select();
  copyManual.setSelectionRange(0,text.length);
  try{
    const success=document.execCommand('copy');
    if(success)copyManual.hidden=true;
    return success;
  }catch(error){return false;}
}
function copyFeedback(success,message){
  copyStatus.textContent=success?message:'Automatiškai nukopijuoti nepavyko. Pažymėtas tekstas paruoštas kopijavimui (Ctrl+C arba ⌘C).';
}
copyCompany.addEventListener('click',async()=>{
  if(copyCompany.disabled)return;
  copyCompany.disabled=true;
  copyStatus.textContent='';
  const originalHTML=copyCompany.innerHTML;
  const copied=await copyContactText(companyText());
  copyCompany.disabled=false;
  copyFeedback(copied,'Visi rekvizitai nukopijuoti.');
  if(copied){
    copyCompany.innerHTML='Nukopijuota <span aria-hidden="true">✓</span>';
    window.setTimeout(()=>{copyCompany.innerHTML=originalHTML;},2200);
  }
});
document.querySelectorAll('.copy-code').forEach(button=>{
  button.addEventListener('click',async()=>{
    if(button.disabled)return;
    button.disabled=true;
    copyStatus.textContent='';
    const row=button.closest('.company-codes > div');
    const value=row.querySelector('.company-code-value').textContent.trim();
    const label=row.querySelector('dt').textContent.trim();
    const copied=await copyContactText(value);
    button.disabled=false;
    copyFeedback(copied,label+' nukopijuotas.');
    if(copied){
      button.classList.add('is-copied');
      window.setTimeout(()=>button.classList.remove('is-copied'),1800);
    }
  });
});
