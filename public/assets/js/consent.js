/* NBCS pasirinkimas: jokie nebūtini išoriniai žemėlapio ištekliai be sutikimo. */
(()=>{
  'use strict';
  const key='nbcs-privacy-choice-v1';
  const lifetime=180*24*60*60*1000;
  const mapPlaceholder=document.querySelector('.location-map-placeholder');
  const mapContainer=mapPlaceholder?.parentElement||null;
  const mapSource=mapPlaceholder?.getAttribute('data-map-src')||'';
  let choice=null;
  let notice=null;

  function savedChoice(){
    try{
      const item=JSON.parse(window.localStorage.getItem(key)||'null');
      if(item&&(item.value==='essential'||item.value==='maps')&&
         Number.isFinite(item.at)&&Date.now()-item.at>=0&&Date.now()-item.at<lifetime){
        return item.value;
      }
    }catch(error){/* Saugykla gali būti išjungta. */}
    return null;
  }

  function updateMap(){
    if(!mapContainer||!mapPlaceholder||!mapSource)return;
    if(choice==='maps'){
      if(mapContainer.querySelector('iframe'))return;
      const iframe=document.createElement('iframe');
      iframe.title='NBCS biuro vieta — Šeškinės Sodų g. 12, Vilnius';
      iframe.src=mapSource;
      iframe.loading='lazy';
      iframe.referrerPolicy='no-referrer-when-downgrade';
      iframe.allowFullscreen=true;
      mapContainer.replaceChildren(iframe);
    }else if(!mapContainer.contains(mapPlaceholder)){
      // Atšaukus sutikimą žemėlapio elementas pašalinamas.
      mapContainer.replaceChildren(mapPlaceholder);
    }
  }

  function closeNotice(){
    if(notice)notice.hidden=true;
  }

  function selectChoice(next){
    choice=next;
    try{
      window.localStorage.setItem(key,JSON.stringify({value:next,at:Date.now()}));
    }catch(error){/* Pasirinkimas galios iki puslapio perkrovimo. */}
    updateMap();
    closeNotice();
  }

  function showNotice(){
    if(!notice){
      notice=document.createElement('section');
      notice.className='cookie-notice';
      notice.setAttribute('role','region');
      notice.setAttribute('aria-labelledby','cookie-notice-title');
      notice.innerHTML=`
        <h2 class="cookie-notice__title" id="cookie-notice-title">Jūsų privatumas NBCS svetainėje</h2>
        <p class="cookie-notice__description">Jūsų pasirinkimui įsiminti naudojame būtinąją naršyklės saugyklą. Sutikę galėsite matyti „Google Maps“ žemėlapį, kurio teikėjas gali naudoti slapukus. Reklaminių ir analitinių sekimo įrankių šiame puslapyje nenaudojame. Plačiau – <a href="/privatumo-politika/">privatumo politikoje</a>.</p>
        <div class="cookie-notice__actions">
          <button type="button" data-consent="essential">Tik būtini</button>
          <button type="button" data-consent="maps">Sutinku</button>
        </div>`;
      notice.querySelectorAll('[data-consent]').forEach(button=>{
        button.addEventListener('click',()=>selectChoice(button.getAttribute('data-consent')));
      });
      document.body.appendChild(notice);
    }
    notice.hidden=false;
  }

  choice=savedChoice();
  updateMap();
  if(!choice)showNotice();

  document.querySelectorAll('.cookie-settings-trigger').forEach(button=>{
    button.addEventListener('click',showNotice);
  });
  document.querySelector('.location-map-load')?.addEventListener('click',()=>{
    // Atskiras paspaudimas yra aiškus sutikimas įkelti Google Maps.
    selectChoice('maps');
  });
  window.addEventListener('storage',event=>{
    if(event.key!==key)return;
    choice=savedChoice();
    updateMap();
    if(!choice)showNotice();else closeNotice();
  });
})();
