/* NBCS privatumo pasirinkimas: OpenFreeMap ištekliai įkeliami tik sutikus. */
(()=>{
  'use strict';
  const key='nbcs-privacy-choice-v2';
  const oldKey='nbcs-privacy-choice-v1';
  const lifetime=180*24*60*60*1000;
  const mapPlaceholder=document.querySelector('.location-map-placeholder');
  const mapContainer=mapPlaceholder?.parentElement||null;
  const mapSource=mapPlaceholder?.getAttribute('data-map-src')||'';
  const coordinates=[25.270130,54.717958]; // Pietrytinė Šeškinės Sodų g. 12 komplekso dalis
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


  // NBCS muted slate map: real vector paint colors (never a CSS filter).
  // Keep street labels readable, 3D buildings and the green office marker.
  function tuneNBCSMapStyle(map){
    const palette={
      land:'#566f80',
      residential:'#5e7583',
      commercial:'#677e89',
      industrial:'#617681',
      green:'#6f887c',
      wood:'#557568',
      water:'#406174',
      waterline:'#7899a9',
      building:'#91a2ab',
      edge:'#506979',
      road:'#bac8cf',
      minorRoad:'#9aafba',
      roadCasing:'#617987',
      rail:'#8aa0aa',
      text:'#eef4f6',
      textHalo:'#485f6e',
      roadText:'#263b49',
      roadTextHalo:'#bac8d0'
    };
    for(const layer of map.getStyle()?.layers||[]){
      const id=layer.id;
      const source=layer['source-layer']||'';
      const paint=layer.paint||{};
      const set=(property,value)=>{
        if(Object.prototype.hasOwnProperty.call(paint,property)){
          try{map.setPaintProperty(id,property,value);}
          catch(error){/* One optional style layer must not hide the map. */}
        }
      };
      if(layer.type==='background'){
        set('background-color',palette.land);
        continue;
      }
      if(layer.type==='fill'){
        let fill=palette.land;
        let outline=palette.edge;
        if(source==='water'||/^water/.test(id)){
          fill=palette.water;
          outline=palette.water;
        }else if(source==='building'){
          fill=palette.building;
          outline=palette.edge;
        }else if(source==='park'||source==='landcover'){
          fill=/wood/.test(id)?palette.wood:palette.green;
          outline=palette.green;
        }else if(source==='landuse'){
          fill=/cemetery/.test(id)?palette.green:
            /industrial|commercial|hospital|school/.test(id)?palette.commercial:
            palette.residential;
          outline=palette.edge;
        }else if(/highway|road|aeroway/.test(id)){
          fill=palette.minorRoad;
          outline=palette.roadCasing;
        }
        set('fill-color',fill);
        set('fill-outline-color',outline);
        if(id==='park'||id==='landcover-wood')set('fill-opacity',0.72);
        continue;
      }
      if(layer.type==='line'){
        let line=palette.edge;
        if(source==='waterway'||/^waterway|^ferry/.test(id)){
          line=palette.waterline;
        }else if(source==='transportation'||/^(road|railway|bridge|tunnel|highway)/.test(id)){
          line=/railway|transit/.test(id)?palette.rail:
            /casing/.test(id)?palette.roadCasing:
            /path|service|minor/.test(id)?palette.minorRoad:
            palette.road;
        }
        set('line-color',line);
        continue;
      }
      if(layer.type==='symbol'){
        const isRoad=/^highway-name/.test(id);
        const isWater=/^water/.test(id);
        set('text-color',isRoad?palette.roadText:isWater?'#bfd7df':palette.text);
        set('text-halo-color',isRoad?palette.roadTextHalo:palette.textHalo);
        // POI sprites are precolored; soften rather than hiding their icons.
        if(/^poi_/.test(id)&&layer.layout?.['icon-image']){
          try{map.setPaintProperty(id,'icon-opacity',0.62);}
          catch(error){/* Icons are decorative; street names remain. */}
        }
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
        minzoom:14.3,
        filter:['has','render_height'],
        paint:{
          'fill-extrusion-color':'#91a5af',
          'fill-extrusion-height':['to-number',['get','render_height'],0],
          'fill-extrusion-base':['to-number',['get','render_min_height'],0],
          'fill-extrusion-opacity':0.78
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
    element.setAttribute('aria-label','NBCS biuro vieta prigesintų melsvų spalvų 3D OpenFreeMap žemėlapyje');
    mapContainer.replaceChildren(element);
    let map;
    try{
      map=new maplibregl.Map({
        container:element,
        style:'https://tiles.openfreemap.org/styles/bright',
        center:coordinates,
        zoom:14.9,
        pitch:60,
        bearing:180,
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
        tuneNBCSMapStyle(map);
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
        <p class="cookie-notice__description">Privatumo pasirinkimui įsiminti naudojame būtinąją naršyklės saugyklą. Sutikę galėsite matyti „OpenFreeMap“ žemėlapį. Tam įkeliami išoriniai žemėlapio duomenys ir „MapLibre“ biblioteka. Reklamos ir lankomumo analizės įrankių nenaudojame. Plačiau – <a href="/privatumo-politika/">privatumo politikoje</a>.</p>
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
