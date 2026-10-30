/* NBCS pasirinkimas: jokie nebūtini išoriniai žemėlapio ištekliai be sutikimo. */
(()=>{
  'use strict';
  const key='nbcs-privacy-choice-v1';
  const lifetime=180*24*60*60*1000;
  const mapPlaceholder=document.querySelector('.location-map-placeholder');
  const mapContainer=mapPlaceholder?.parentElement||null;
  const mapSource=mapPlaceholder?.getAttribute('data-map-src')||'';
  // Optional paid Google Maps JavaScript API credentials; empty values retain
  // the existing consent-gated iframe until an owner configures Google Cloud.
  const mapsApiKey=mapPlaceholder?.getAttribute('data-google-maps-api-key')?.trim()||'';
  const googleMapId=mapPlaceholder?.getAttribute('data-google-map-id')?.trim()||'';
  const hasCloudStyle=Boolean(mapsApiKey&&googleMapId);
  let mapsApiPromise=null;
  let styledMapPending=false;
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

  function showEmbeddedMap(){
    if(choice!=='maps'||mapContainer.querySelector('iframe'))return;
    const iframe=document.createElement('iframe');
    iframe.title='NBCS biuro vieta — Šeškinės Sodų g. 12, Vilnius';
    iframe.src=mapSource;
    iframe.loading='lazy';
    iframe.referrerPolicy='no-referrer-when-downgrade';
    iframe.allowFullscreen=true;
    mapContainer.replaceChildren(iframe);
  }

  // Google Maps API loaded exclusively after visitor consent. Requires a
  // published Dark + Monochrome Cloud Map Style linked to googleMapId.
  function loadStyledMapsAPI(){
    if(mapsApiPromise)return mapsApiPromise;
    mapsApiPromise=new Promise((resolve,reject)=>{
      const callback='__nbcsGoogleMapsLoaded';
      const script=document.createElement('script');
      window[callback]=()=>{
        delete window[callback];
        resolve(window.google?.maps);
      };
      script.async=true;
      script.onerror=()=>{
        delete window[callback];
        reject(new Error('Google Maps API unavailable'));
      };
      const params=new URLSearchParams({
        key:mapsApiKey,
        v:'weekly',
        loading:'async',
        language:'lt',
        callback
      });
      script.src='https://maps.googleapis.com/maps/api/js?'+params.toString();
      document.head.appendChild(script);
    });
    return mapsApiPromise;
  }

  async function showStyledMap(){
    await loadStyledMapsAPI();
    // Geocoding uses the configured Maps JavaScript API to place the NBCS pin.
    const response=await new window.google.maps.Geocoder().geocode({
      address:'Šeškinės Sodų g. 12, 08343 Vilnius, Lietuva'
    });
    const location=response.results?.[0]?.geometry?.location;
    if(!location)throw new Error('NBCS address not found');
    const [{Map},{AdvancedMarkerElement}]=await Promise.all([
      window.google.maps.importLibrary('maps'),
      window.google.maps.importLibrary('marker')
    ]);
    if(choice!=='maps')return;
    const element=document.createElement('div');
    element.className='location-google-map';
    element.setAttribute('aria-label','NBCS biuro vieta žemėlapyje');
    mapContainer.replaceChildren(element);
    const map=new Map(element,{
      center:location,
      zoom:16,
      mapId:googleMapId,
      colorScheme:'DARK',
      mapTypeControl:false,
      streetViewControl:false,
      fullscreenControl:true,
      gestureHandling:'cooperative'
    });
    new AdvancedMarkerElement({map,position:location,title:'NBCS – Šeškinės Sodų g. 12'});
  }

  function updateMap(){
    if(!mapContainer||!mapPlaceholder||!mapSource)return;
    if(choice==='maps'){
      if(mapContainer.querySelector('iframe,.location-google-map'))return;
      if(!hasCloudStyle){showEmbeddedMap();return;}
      if(styledMapPending)return;
      styledMapPending=true;
      showStyledMap().catch(()=>{
        // Keep the map working if API credentials, billing or geocoding fail.
        if(choice==='maps')showEmbeddedMap();
      }).finally(()=>{styledMapPending=false;});
    }else if(!mapContainer.contains(mapPlaceholder)){
      // Consent revoked: remove the map element, not third-party stored cookies.
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
