/* NBCS privatumo pasirinkimas: OpenFreeMap ištekliai įkeliami tik sutikus. */
(()=>{
  'use strict';
  const key='nbcs-privacy-choice-v2';
  const oldKey='nbcs-privacy-choice-v1';
  const lifetime=180*24*60*60*1000;
  const mapPlaceholder=document.querySelector('.location-map-placeholder');
  const mapContainer=mapPlaceholder?.parentElement||null;
  const mapSource=mapPlaceholder?.getAttribute('data-map-src')||'';
  const coordinates=[25.2697852,54.7185598]; // Šeškinės Sodų g. 12, Vilnius
  let choice=null;
  let notice=null;
  let mapInstance=null;
  let libraryPromise=null;
  let loadingMap=false;
  let mapRevision=0;

  function savedChoice(){
    try{
      const item=JSON.parse(window.localStorage.getItem(key)||'null');
      if(item&&(item.value==='essential'||item.value==='maps')&&
         Number.isFinite(item.at)&&Date.now()-item.at>=0&&Date.now()-item.at<lifetime){
        return item.value;
      }
    }catch(error){/* Naršyklės saugykla gali būti išjungta. */}
    return null;
  }

  function loadMapLibre(){
    if(window.maplibregl)return Promise.resolve(window.maplibregl);
    if(libraryPromise)return libraryPromise;
    libraryPromise=new Promise((resolve,reject)=>{
      const stylesheet=document.createElement('link');
      stylesheet.rel='stylesheet';
      stylesheet.href='https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.0/dist/maplibre-gl.css';
      document.head.appendChild(stylesheet);
      const script=document.createElement('script');
      script.src='https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.0/dist/maplibre-gl.js';
      script.async=true;
      script.onload=()=>window.maplibregl?resolve(window.maplibregl):reject(new Error('MapLibre unavailable'));
      script.onerror=()=>reject(new Error('MapLibre could not load'));
      document.head.appendChild(script);
    }).catch(error=>{
      libraryPromise=null;
      throw error;
    });
    return libraryPromise;
  }

  function showFallbackMap(){
    if(!mapContainer||choice!=='maps'||!mapSource)return;
    if(mapInstance){
      try{mapInstance.remove();}catch(error){/* Ignoruojame išvalymo klaidas. */}
      mapInstance=null;
    }
    // OpenStreetMap iframe is only a fallback when WebGL or vector tiles fail.
    const iframe=document.createElement('iframe');
    iframe.title='NBCS biuro vieta — Šeškinės Sodų g. 12, Vilnius';
    iframe.src=mapSource;
    iframe.loading='lazy';
    iframe.referrerPolicy='no-referrer-when-downgrade';
    iframe.setAttribute('allowfullscreen','');
    mapContainer.replaceChildren(iframe);
  }

  // NBCS lightened dark palette: change actual vector map paint, not CSS
  // filters or overlays. Keep street names, attribution and interactions intact.
  function tuneDarkMapStyle(map){
    const layers=map.getStyle()?.layers||[];
    const colors={
      background:{'background-color':'#222c35'},
      water:{'fill-color':'#21303c'},
      building:{'fill-color':'#36434d','fill-outline-color':'#56616b'},
      landcover_wood:{'fill-color':'#29372f'},
      landuse_park:{'fill-color':'#293b33'},
      landuse_residential:{'fill-color':'#26323b'}
    };
    for(const layer of layers){
      const paint=colors[layer.id];
      if(paint){
        for(const [property,color] of Object.entries(paint)){
          if(Object.prototype.hasOwnProperty.call(layer.paint||{},property)){
            map.setPaintProperty(layer.id,property,color);
          }
        }
      }
      // The original roads are very dark against a nearly black background.
      // Brighten them slightly to retain separation from the lighter land.
      if(layer.type==='line'&&layer['source-layer']==='transportation'&&
         /^highway_/.test(layer.id)&&!/_casing|_tunnel|_subtle/.test(layer.id)&&
         Object.prototype.hasOwnProperty.call(layer.paint||{},'line-color')){
        map.setPaintProperty(layer.id,'line-color',
          /motorway|major|primary|trunk/.test(layer.id)?'#69757d':'#515c65');
      }
    }
  }

  function addBuildings(map){
    // OpenFreeMap vector tiles may include rendered building heights.
    // Failure of the optional 3D layer must never hide the base map.
    try{
      const style=map.getStyle();
      if(!style.sources.openmaptiles)return;
      if(style.layers.some(layer=>layer.type==='fill-extrusion'&&layer['source-layer']==='building'))return;
      const labelLayer=style.layers.find(layer=>layer.type==='symbol')?.id;
      map.addLayer({
        id:'nbcs-buildings-3d',
        type:'fill-extrusion',
        source:'openmaptiles',
        'source-layer':'building',
        minzoom:15,
        filter:['has','render_height'],
        paint:{
          'fill-extrusion-color':'#52616c',
          'fill-extrusion-height':['to-number',['get','render_height'],0],
          'fill-extrusion-base':['to-number',['get','render_min_height'],0],
          'fill-extrusion-opacity':0.85
        }
      },labelLayer);
    }catch(error){/* 3D neprivalomas, bazinis žemėlapis veikia toliau. */}
  }

  function createMap(maplibregl,revision){
    if(!mapContainer||choice!=='maps'||revision!==mapRevision)return;
    if(typeof maplibregl.supported==='function'&&!maplibregl.supported()){
      showFallbackMap();
      return;
    }
    const element=document.createElement('div');
    element.className='location-openfreemap';
    element.setAttribute('aria-label','NBCS biuro vieta tamsiame OpenFreeMap žemėlapyje');
    mapContainer.replaceChildren(element);
    let map;
    try{
      map=new maplibregl.Map({
        container:element,
        style:'https://tiles.openfreemap.org/styles/dark',
        center:coordinates,
        zoom:16.2,
        pitch:42,
        bearing:-12,
        antialias:true,
        attributionControl:true,
        cooperativeGestures:true
      });
      mapInstance=map;
      map.addControl(new maplibregl.NavigationControl({showCompass:true}),'top-right');
      const marker=new maplibregl.Marker({color:'#9bcc46'})
        .setLngLat(coordinates)
        .setPopup(new maplibregl.Popup({offset:22,maxWidth:'260px'})
          .setHTML('<strong>UAB „NBCS“</strong><div>Šeškinės Sodų g. 12, Vilnius</div>'))
        .addTo(map);
      map.once('load',()=>{
        if(revision!==mapRevision||choice!=='maps')return;
        tuneDarkMapStyle(map);
        addBuildings(map);
        // Accessible external destination when the marker is selected.
        marker.getElement().setAttribute('title','NBCS – Šeškinės Sodų g. 12');
      });
      // A failed style or tile request should never leave the map blank.
      map.on('error',()=>{
        if(revision===mapRevision&&choice==='maps'){
          mapRevision++;
          showFallbackMap();
        }
      });
    }catch(error){
      if(map){try{map.remove();}catch(ignore){}}
      mapInstance=null;
      showFallbackMap();
    }
  }

  function updateMap(){
    if(!mapContainer||!mapPlaceholder)return;
    if(choice==='maps'){
      if(mapInstance||mapContainer.querySelector('iframe')||loadingMap)return;
      loadingMap=true;
      const revision=++mapRevision;
      loadMapLibre().then(api=>{
        if(choice==='maps'&&revision===mapRevision)createMap(api,revision);
      }).catch(()=>{
        if(choice==='maps'&&revision===mapRevision)showFallbackMap();
      }).finally(()=>{
        loadingMap=false;
        if(choice==='maps'&&!mapInstance&&!mapContainer.querySelector('iframe'))updateMap();
      });
    }else{
      ++mapRevision;
      if(mapInstance){
        try{mapInstance.remove();}catch(error){/* Išvalymo klaidą ignoruojame. */}
        mapInstance=null;
      }
      if(!mapContainer.contains(mapPlaceholder))mapContainer.replaceChildren(mapPlaceholder);
    }
  }

  function closeNotice(){if(notice)notice.hidden=true;}

  function selectChoice(next){
    choice=next;
    try{
      window.localStorage.setItem(key,JSON.stringify({value:next,at:Date.now()}));
      window.localStorage.removeItem(oldKey);
    }catch(error){/* Pasirinkimas išlieka iki puslapio perkrovimo. */}
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
        <p class="cookie-notice__description">Privatumo pasirinkimui įsiminti naudojame būtinąją naršyklės saugyklą. Sutikę galėsite matyti „OpenFreeMap“ žemėlapį, kuriam bus įkeliami išoriniai žemėlapio duomenys ir „MapLibre“ biblioteka. Reklaminių ar lankomumo analizės sekimo įrankių nenaudojame. Plačiau – <a href="/privatumo-politika/">privatumo politikoje</a>.</p>
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
    selectChoice('maps');
  });
  window.addEventListener('storage',event=>{
    if(event.key!==key)return;
    choice=savedChoice();
    updateMap();
    if(!choice)showNotice();else closeNotice();
  });
})();
