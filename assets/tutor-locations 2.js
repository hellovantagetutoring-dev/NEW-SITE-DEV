(function(global){
  'use strict';

  var REGISTRY = {
    salisbury: { id: 'salisbury', name: 'Salisbury', type: 'suburb', lat: -27.5436, lng: 153.0328 },
    moorooka: { id: 'moorooka', name: 'Moorooka', type: 'suburb', lat: -27.5278, lng: 153.0156 },
    nathan: { id: 'nathan', name: 'Nathan', type: 'suburb', lat: -27.5583, lng: 153.0367 },
    'mt-gravatt': { id: 'mt-gravatt', name: 'Mount Gravatt', type: 'suburb', lat: -27.5389, lng: 153.0825 },
    mansfield: { id: 'mansfield', name: 'Mansfield', type: 'suburb', lat: -27.5372, lng: 153.1028 },
    sunnybank: { id: 'sunnybank', name: 'Sunnybank', type: 'suburb', lat: -27.5733, lng: 153.0556 },
    macgregor: { id: 'macgregor', name: 'Macgregor', type: 'suburb', lat: -27.5589, lng: 153.0789 },
    wishart: { id: 'wishart', name: 'Wishart', type: 'suburb', lat: -27.5597, lng: 153.1022 },
    rochedale: { id: 'rochedale', name: 'Rochedale', type: 'suburb', lat: -27.5702, lng: 153.1269 },
    carindale: { id: 'carindale', name: 'Carindale', type: 'suburb', lat: -27.5058, lng: 153.1020 },
    'holland-park': { id: 'holland-park', name: 'Holland Park', type: 'suburb', lat: -27.5203, lng: 153.0628 },
    'eight-mile-plains': { id: 'eight-mile-plains', name: 'Eight Mile Plains', type: 'suburb', lat: -27.5833, lng: 153.0933 },
    'ferny-grove': { id: 'ferny-grove', name: 'Ferny Grove', type: 'suburb', lat: -27.4012, lng: 152.9326 },
    'ferny-hills': { id: 'ferny-hills', name: 'Ferny Hills', type: 'suburb', lat: -27.3967, lng: 152.9342, lga: 'Moreton Bay City' },
    'upper-kedron': { id: 'upper-kedron', name: 'Upper Kedron', type: 'suburb', lat: -27.4192, lng: 152.9207 },
    keperra: { id: 'keperra', name: 'Keperra', type: 'suburb', lat: -27.4063, lng: 152.9550 },
    'arana-hills': { id: 'arana-hills', name: 'Arana Hills', type: 'suburb', lat: -27.3981, lng: 152.9560, lga: 'Moreton Bay City' },
    'the-gap': { id: 'the-gap', name: 'The Gap', type: 'suburb', lat: -27.4426, lng: 152.9403 },
    mitchelton: { id: 'mitchelton', name: 'Mitchelton', type: 'suburb', lat: -27.4078, lng: 152.9728 },
    gaythorne: { id: 'gaythorne', name: 'Gaythorne', type: 'suburb', lat: -27.4171, lng: 152.9806 },
    enoggera: { id: 'enoggera', name: 'Enoggera', type: 'suburb', lat: -27.4240, lng: 152.9855 },
    alderley: { id: 'alderley', name: 'Alderley', type: 'suburb', lat: -27.4249, lng: 153.0007 },
    newmarket: { id: 'newmarket', name: 'Newmarket', type: 'suburb', lat: -27.4338, lng: 153.0077 },
    wilston: { id: 'wilston', name: 'Wilston', type: 'suburb', lat: -27.4326, lng: 153.0186 },
    windsor: { id: 'windsor', name: 'Windsor', type: 'suburb', lat: -27.4318, lng: 153.0300 },
    'bowen-hills': { id: 'bowen-hills', name: 'Bowen Hills', type: 'suburb', lat: -27.4424, lng: 153.0387 },
    ashgrove: { id: 'ashgrove', name: 'Ashgrove', type: 'suburb', lat: -27.4456, lng: 152.9928 },
    indooroopilly: { id: 'indooroopilly', name: 'Indooroopilly', type: 'suburb', lat: -27.5030, lng: 152.9752 },
    'mount-ommaney': { id: 'mount-ommaney', name: 'Mount Ommaney', type: 'suburb', lat: -27.5491, lng: 152.9390 },
    robertson: { id: 'robertson', name: 'Robertson', type: 'suburb', lat: -27.5666, lng: 153.0563 },
    'acacia-ridge': { id: 'acacia-ridge', name: 'Acacia Ridge', type: 'suburb', lat: -27.5858, lng: 153.0261 },
    'sunnybank-hills': { id: 'sunnybank-hills', name: 'Sunnybank Hills', type: 'suburb', lat: -27.5955, lng: 153.0516 },
    parkinson: { id: 'parkinson', name: 'Parkinson', type: 'suburb', lat: -27.6434, lng: 153.0301 },
    'browns-plains': { id: 'browns-plains', name: 'Browns Plains', type: 'suburb', lat: -27.6608, lng: 153.0417 },
    annerley: { id: 'annerley', name: 'Annerley', type: 'suburb', lat: -27.5125, lng: 153.0320 },
    pimpama: { id: 'pimpama', name: 'Pimpama', type: 'suburb', lat: -27.8070, lng: 153.3011, lga: 'Gold Coast City' },
    ormeau: { id: 'ormeau', name: 'Ormeau', type: 'suburb', lat: -27.7776, lng: 153.2518, lga: 'Gold Coast City' },
    coomera: { id: 'coomera', name: 'Coomera', type: 'suburb', lat: -27.8397, lng: 153.3390, lga: 'Gold Coast City' },
    southport: { id: 'southport', name: 'Southport', type: 'suburb', lat: -27.9726, lng: 153.3990, lga: 'Gold Coast City' },
    slq: {
      id: 'slq', name: 'State Library of Queensland', type: 'venue',
      lat: -27.4714, lng: 153.0185, tab: 'slq',
      detail: 'Preferred venue · South Bank',
      query: 'State+Library+of+Queensland+South+Bank'
    },
    'uq-st-lucia': {
      id: 'uq-st-lucia', name: 'University of Queensland', type: 'venue',
      lat: -27.4975, lng: 153.0137, tab: 'uq',
      detail: 'St Lucia campus',
      query: 'University+of+Queensland+St+Lucia'
    },
    'griffith-nathan': {
      id: 'griffith-nathan', name: 'Griffith University', type: 'venue',
      lat: -27.5537, lng: 153.0546, tab: 'griffith',
      detail: 'Nathan campus',
      query: 'Griffith+University+Nathan'
    },
    'garden-city': {
      id: 'garden-city', name: 'Garden City', type: 'venue',
      lat: -27.5636, lng: 153.0825, tab: 'garden',
      detail: 'Upper Mount Gravatt',
      query: 'Westfield+Garden+City+Upper+Mount+Gravatt'
    },
    'annerley-library': {
      id: 'annerley-library', name: 'Annerley Library', type: 'venue',
      lat: -27.5108, lng: 153.0345,
      detail: 'Annerley',
      query: 'Annerley+Library+QLD'
    },
    'carindale-library': {
      id: 'carindale-library', name: 'Carindale Library', type: 'venue',
      lat: -27.5045, lng: 153.1012,
      detail: 'Carindale',
      query: 'Carindale+Library+QLD'
    },
    'mount-ommaney-library': {
      id: 'mount-ommaney-library', name: 'Mount Ommaney Library', type: 'venue',
      lat: -27.5525, lng: 152.9388,
      detail: 'Mount Ommaney',
      query: 'Mount+Ommaney+Library+QLD'
    }
  };

  var ID_ALIASES = { 'mt-ommaney': 'mount-ommaney' };
  var REGION_LGA = {
    'bcc': 'Brisbane City',
    'brisbane-lga': 'Brisbane City',
    'gold-coast': 'Gold Coast City',
    'logan': 'Logan City'
  };
  var EXCLUDED_LGAS = ['Moreton Bay City'];
  var EXCLUDED_SUBURB_IDS = {
    'amity': true,
    'dunwich': true,
    'point-lookout': true,
    'ocean-view': true,
    'moreton-bay': true,
    'port-of-brisbane': true
  };
  var WOODRIDGE_BOUNDARY_ID = 'woodridge';
  var MAP_FIT_OPTS = { padding: [24, 24], maxZoom: 11 };
  var DEFAULT_MAP_VIEW = { lat: -27.55, lng: 153.02, zoom: 11 };
  var woodridgeLat = null;
  var ezekielCoveredIdsCache = null;
  var explicitCoveredIdsCache = null;
  var TUTOR_COVERAGE = [
    {
      name: 'Lincoln Murray-Brown',
      radiusFrom: 'ashgrove',
      radiusKm: 10,
      radiusLgas: ['Brisbane City'],
      suburbs: [],
      venues: ['slq', 'uq-st-lucia', 'garden-city', 'annerley-library', 'carindale-library']
    },
    {
      name: 'Ishaan Tiwari',
      suburbs: [],
      venues: ['mount-ommaney-library']
    },
    {
      name: 'Vineth Samaraweera',
      suburbs: ['mt-gravatt', 'mansfield', 'sunnybank', 'macgregor', 'wishart', 'rochedale', 'carindale', 'holland-park', 'eight-mile-plains'],
      venues: ['carindale-library', 'slq', 'garden-city']
    },
    {
      name: 'Keeran Subendranathan',
      suburbs: ['ferny-grove', 'ferny-hills', 'upper-kedron', 'keperra', 'arana-hills', 'the-gap', 'mitchelton', 'gaythorne', 'enoggera', 'alderley', 'newmarket'],
      venues: ['uq-st-lucia', 'slq']
    },
    {
      name: 'Brooklyn Tran',
      suburbs: ['salisbury', 'moorooka', 'nathan'],
      venues: ['griffith-nathan', 'uq-st-lucia', 'garden-city', 'annerley-library', 'slq']
    },
    {
      name: 'Ezekiel Singh',
      radiusFrom: 'mt-gravatt',
      radiusKm: 25,
      radiusLgas: ['Logan City'],
      suburbs: ['pimpama', 'ormeau', 'coomera', 'southport'],
      venues: []
    }
  ];
  var BOUNDARIES_URL = '/assets/suburb-boundaries.geojson?v=1';
  var boundariesPromise = null;
  var boundariesFc = null;
  var boundariesById = {};

  // Default: Esri gray canvas (no API key, muted). Optional CARTO when key is set.
  var TILE_ESRI_LIGHT = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
  var TILE_ESRI_DARK = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
  var TILE_CARTO_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';
  var TILE_CARTO_DARK = 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png';
  var TILE_ESRI_ATTR = 'Tiles &copy; <a href="https://www.esri.com/">Esri</a>';
  var TILE_CARTO_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

  function resolveId(id){
    return ID_ALIASES[id] || id;
  }

  function get(id){
    return REGISTRY[resolveId(id)] || null;
  }

  function isExcludedLga(lga){
    return EXCLUDED_LGAS.indexOf(lga) !== -1;
  }

  function isExcludedFeature(feature){
    return !!(feature && feature.properties && isExcludedLga(feature.properties.lga));
  }

  function isIslandId(id, locality){
    var label = ((id || '') + ' ' + (locality || '')).toLowerCase();
    return label.indexOf('island') !== -1;
  }

  function isOceanNamedSuburb(id, locality){
    return ((id || '') + ' ' + (locality || '')).toLowerCase().indexOf('ocean') !== -1;
  }

  function isMoretonBayNamedSuburb(id, locality){
    return ((id || '') + ' ' + (locality || '')).toLowerCase().indexOf('moreton bay') !== -1;
  }

  function isPortOfBrisbaneNamedSuburb(id, locality){
    var label = ((id || '') + ' ' + (locality || '')).toLowerCase();
    return label.indexOf('port of brisbane') !== -1 || label.indexOf('port-of-brisbane') !== -1;
  }

  function isExplicitlyExcludedSuburb(id, locality){
    var boundaryId = registryToBoundaryId(resolveId(id || ''));
    if(EXCLUDED_SUBURB_IDS[boundaryId]) return true;
    if(isIslandId(boundaryId, locality)) return true;
    if(isOceanNamedSuburb(boundaryId, locality)) return true;
    if(isMoretonBayNamedSuburb(boundaryId, locality)) return true;
    if(isPortOfBrisbaneNamedSuburb(boundaryId, locality)) return true;
    return false;
  }

  function isIslandFeature(feature){
    if(!feature || !feature.properties) return false;
    return isExplicitlyExcludedSuburb(feature.properties.id, feature.properties.locality);
  }

  function getWoodridgeLat(){
    if(woodridgeLat != null) return woodridgeLat;
    var feature = boundariesById[WOODRIDGE_BOUNDARY_ID];
    if(!feature) return null;
    var centroid = featureCentroid(feature);
    woodridgeLat = centroid ? centroid.lat : null;
    return woodridgeLat;
  }

  function isSouthOfWoodridge(feature){
    var cutoff = getWoodridgeLat();
    if(cutoff == null || !feature) return false;
    var centroid = featureCentroid(feature);
    return !!(centroid && centroid.lat < cutoff);
  }

  function ezekielCoverage(){
    for(var i = 0; i < TUTOR_COVERAGE.length; i++){
      if((TUTOR_COVERAGE[i].name || '').indexOf('Ezekiel') !== -1) return TUTOR_COVERAGE[i];
    }
    return null;
  }

  function ezekielCoveredSuburbIds(){
    if(ezekielCoveredIdsCache) return ezekielCoveredIdsCache;
    var set = {};
    coveredSuburbIdsFromCoverage(ezekielCoverage()).forEach(function(id){
      set[registryToBoundaryId(id)] = true;
    });
    ezekielCoveredIdsCache = set;
    return set;
  }

  function explicitCoveredSuburbIds(){
    if(explicitCoveredIdsCache) return explicitCoveredIdsCache;
    var set = {};
    var coverages = TUTOR_COVERAGE;
    if(typeof document !== 'undefined'){
      var cards = document.querySelectorAll('.tutor-card');
      if(cards.length) coverages = coveragesFromCards(cards);
    }
    coverages.forEach(function(cov){
      (cov.suburbs || []).forEach(function(id){
        set[registryToBoundaryId(id)] = true;
      });
    });
    explicitCoveredIdsCache = set;
    return set;
  }

  function isExcludedFromServiceArea(feature){
    var id = feature && feature.properties && feature.properties.id;
    if(id && explicitCoveredSuburbIds()[id]) return false;
    if(isExcludedFeature(feature) || isIslandFeature(feature)) return true;
    if(isSouthOfWoodridge(feature)){
      return !id || !ezekielCoveredSuburbIds()[id];
    }
    return false;
  }

  function isServiceAreaSuburbId(id){
    var boundaryId = registryToBoundaryId(resolveId(id));
    if(explicitCoveredSuburbIds()[boundaryId]) return true;
    var feature = boundariesById[boundaryId];
    if(feature) return !isExcludedFromServiceArea(feature);
    var loc = get(resolveId(id));
    if(!loc || loc.type !== 'suburb') return true;
    if(isExplicitlyExcludedSuburb(loc.id, loc.name)) return false;
    var cutoff = getWoodridgeLat();
    if(cutoff != null && loc.lat < cutoff) return !!ezekielCoveredSuburbIds()[boundaryId];
    return true;
  }

  function locFromFeature(feature){
    if(!feature || !feature.properties) return null;
    var props = feature.properties;
    var centroid = featureCentroid(feature);
    if(!centroid) return null;
    return {
      id: props.id,
      name: props.locality,
      type: 'suburb',
      lat: centroid.lat,
      lng: centroid.lng,
      lga: props.lga,
      locality: props.locality
    };
  }

  function getSuburbLoc(id){
    var loc = get(resolveId(id));
    if(loc && loc.type === 'suburb') return loc;
    var feat = boundariesById[registryToBoundaryId(id)];
    return feat ? locFromFeature(feat) : null;
  }

  function allBoundarySuburbs(){
    if(!boundariesFc || !boundariesFc.features) return [];
    return boundariesFc.features
      .filter(function(f){ return f.properties && f.properties.id && !isExcludedFromServiceArea(f); })
      .map(locFromFeature)
      .filter(Boolean)
      .sort(function(a, b){ return a.name.localeCompare(b.name); });
  }

  function serviceMapSuburbIds(){
    return allBoundarySuburbs().map(function(loc){ return loc.id; });
  }

  function parseRadiusLgas(value){
    if(!value) return null;
    var list = value.trim().split(/\s+/).filter(Boolean);
    if(!list.length) return null;
    return list.map(function(key){
      return REGION_LGA[key] || key;
    });
  }

  function coverageFromCard(card){
    if(!card) return null;
    return {
      name: (card.querySelector('.tutor-name') || {}).textContent || '',
      suburbs: (card.getAttribute('data-suburbs') || '').trim().split(/\s+/).filter(Boolean),
      venues: (card.getAttribute('data-venues') || '').trim().split(/\s+/).filter(Boolean),
      regions: (card.getAttribute('data-regions') || '').trim().split(/\s+/).filter(Boolean),
      radiusFrom: card.getAttribute('data-radius-from') || '',
      radiusKm: parseFloat(card.getAttribute('data-radius-km'), 10) || 0,
      radiusLgas: parseRadiusLgas(card.getAttribute('data-radius-lgas') || '')
    };
  }

  function coveragesFromCards(cards){
    var out = [];
    [].forEach.call(cards || [], function(card){
      var cov = coverageFromCard(card);
      if(cov && cov.name) out.push(cov);
    });
    return out.length ? out : TUTOR_COVERAGE.slice();
  }

  function coveredSuburbIdsFromCoverage(cov){
    if(!cov) return [];
    var set = {};
    (cov.suburbs || []).forEach(function(id){
      var loc = getSuburbLoc(id);
      if(loc) set[registryToBoundaryId(id)] = true;
    });
    if(cov.radiusFrom && cov.radiusKm){
      suburbsWithinRadius(cov.radiusFrom, cov.radiusKm, cov.radiusLgas).forEach(function(id){ set[id] = true; });
    }
    (cov.regions || []).forEach(function(region){
      suburbsInRegion(region).forEach(function(id){ set[id] = true; });
    });
    return Object.keys(set);
  }

  function coverageCoversSuburb(cov, suburbId){
    if(!cov || !suburbId) return false;
    var targetId = registryToBoundaryId(resolveId(suburbId));
    return coveredSuburbIdsFromCoverage(cov).some(function(id){
      return registryToBoundaryId(id) === targetId;
    });
  }

  function coverageCoversVenue(cov, venueId){
    if(!cov || !venueId) return false;
    return (cov.venues || []).indexOf(venueId) !== -1;
  }

  function tutorNamesForSuburb(suburbId, coverages){
    var names = [];
    (coverages || TUTOR_COVERAGE).forEach(function(cov){
      if(!coverageCoversSuburb(cov, suburbId)) return;
      if(cov.name && names.indexOf(cov.name) === -1) names.push(cov.name);
    });
    return names.join(', ');
  }

  function tutorNamesForVenue(venueId, coverages){
    var names = [];
    (coverages || TUTOR_COVERAGE).forEach(function(cov){
      if(!coverageCoversVenue(cov, venueId)) return;
      if(cov.name && names.indexOf(cov.name) === -1) names.push(cov.name);
    });
    return names.join(', ');
  }

  function populateSuburbSelect(select, placeholder){
    if(!select) return;
    var keep = select.querySelector('option[value=""]');
    select.innerHTML = '';
    if(keep){
      select.appendChild(keep);
    }else{
      var blank = document.createElement('option');
      blank.value = '';
      blank.textContent = placeholder || 'Select suburb';
      select.appendChild(blank);
    }
    pickerSuburbs().forEach(function(loc){
      var opt = document.createElement('option');
      opt.value = loc.id;
      opt.textContent = loc.name;
      select.appendChild(opt);
    });
  }

  function regionMatchesLga(region, lga){
    return REGION_LGA[region] === lga;
  }

  function getSuburbLga(id){
    var loc = get(resolveId(id));
    if(loc && loc.lga) return loc.lga;
    var feat = boundariesById[registryToBoundaryId(id)];
    return feat && feat.properties ? feat.properties.lga : null;
  }

  function enrichRegistryFromBoundaries(){
    Object.keys(REGISTRY).forEach(function(id){
      var loc = REGISTRY[id];
      if(!loc || loc.type !== 'suburb') return;
      var feat = boundariesById[registryToBoundaryId(id)];
      if(!feat) return;
      loc.lga = feat.properties.lga;
      loc.locality = feat.properties.locality;
    });
  }

  function loadBoundaries(){
    if(boundariesPromise) return boundariesPromise;
    boundariesPromise = fetch(BOUNDARIES_URL)
      .then(function(res){
        if(!res.ok) throw new Error('boundaries fetch failed');
        return res.json();
      })
      .then(function(fc){
        boundariesFc = fc;
        boundariesById = {};
        woodridgeLat = null;
        ezekielCoveredIdsCache = null;
        explicitCoveredIdsCache = null;
        (fc.features || []).forEach(function(f){
          if(f.properties && f.properties.id) boundariesById[f.properties.id] = f;
        });
        enrichRegistryFromBoundaries();
        return fc;
      })
      .catch(function(){
        boundariesFc = null;
        boundariesById = {};
        return null;
      });
    return boundariesPromise;
  }

  function allByType(type){
    return Object.keys(REGISTRY)
      .map(function(id){ return REGISTRY[id]; })
      .filter(function(loc){ return loc.type === type; })
      .sort(function(a, b){ return a.name.localeCompare(b.name); });
  }

  function googleQuery(loc){
    if(loc && loc.query) return loc.query;
    if(!loc) return '';
    return encodeURIComponent(loc.name + ' QLD').replace(/%20/g, '+');
  }

  function getVenueByTab(tab){
    var venues = allByType('venue');
    for(var i = 0; i < venues.length; i++){
      if(venues[i].tab === tab || venues[i].id === tab) return venues[i];
    }
    return null;
  }

  function distKm(a, b){
    if(!a || !b) return Infinity;
    var R = 6371;
    var dLat = (b.lat - a.lat) * Math.PI / 180;
    var dLng = (b.lng - a.lng) * Math.PI / 180;
    var lat1 = a.lat * Math.PI / 180;
    var lat2 = b.lat * Math.PI / 180;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2)
      + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function idsFromCard(card){
    if(!card) return [];
    var suburbs = (card.getAttribute('data-suburbs') || '').trim().split(/\s+/).filter(Boolean);
    var venues = (card.getAttribute('data-venues') || '').trim().split(/\s+/).filter(Boolean);
    return suburbs.concat(venues);
  }

  function featureCentroid(feature){
    var geom = feature.geometry;
    if(!geom || !geom.coordinates) return null;
    var ring = geom.type === 'MultiPolygon' ? geom.coordinates[0][0] : geom.coordinates[0];
    if(!ring || !ring.length) return null;
    var lat = 0;
    var lng = 0;
    ring.forEach(function(p){
      lng += p[0];
      lat += p[1];
    });
    return { lat: lat / ring.length, lng: lng / ring.length };
  }

  function suburbsWithinRadius(hubId, radiusKm, lgaFilter){
    var hub = getSuburbLoc(hubId);
    if(!hub || !boundariesFc) return [];
    var out = [];
    boundariesFc.features.forEach(function(f){
      if(isExcludedFeature(f) || isIslandFeature(f)) return;
      var props = f.properties || {};
      if(lgaFilter && lgaFilter.length && lgaFilter.indexOf(props.lga) === -1) return;
      var loc = getSuburbLoc(props.id) || locFromFeature(f);
      if(loc && distKm(hub, loc) <= radiusKm) out.push(props.id);
    });
    return out;
  }

  function suburbsInRegion(region){
    var lga = REGION_LGA[region];
    if(!lga || !boundariesFc) return [];
    return boundariesFc.features
      .filter(function(f){ return f.properties && f.properties.lga === lga && !isExcludedFeature(f); })
      .map(function(f){ return f.properties.id; });
  }

  function coveredSuburbIdsFromCard(card){
    return coveredSuburbIdsFromCoverage(coverageFromCard(card));
  }

  function coveredSuburbIdsFromCards(cards){
    var set = {};
    [].forEach.call(cards || [], function(card){
      coveredSuburbIdsFromCard(card).forEach(function(id){ set[id] = true; });
    });
    return Object.keys(set);
  }

  function cardMatchesRadius(card, centerId, radiusKm){
    var center = getSuburbLoc(centerId);
    if(!center || !radiusKm) return false;
    var cov = coverageFromCard(card);
    if(!cov) return false;
    if(!cov.suburbs.length && !cov.radiusFrom && !cov.regions.length && !cov.venues.length) return false;
    for(var i = 0; i < (cov.suburbs || []).length; i++){
      var loc = getSuburbLoc(cov.suburbs[i]);
      if(loc && distKm(center, loc) <= radiusKm) return true;
    }
    if(cov.radiusFrom && cov.radiusKm){
      var targetId = registryToBoundaryId(resolveId(centerId));
      var covered = suburbsWithinRadius(cov.radiusFrom, cov.radiusKm, cov.radiusLgas);
      for(var r = 0; r < covered.length; r++){
        if(registryToBoundaryId(covered[r]) === targetId) return true;
      }
    }
    var centerLga = getSuburbLga(centerId);
    if((cov.regions || []).length && centerLga){
      for(var j = 0; j < cov.regions.length; j++){
        if(regionMatchesLga(cov.regions[j], centerLga)) return true;
      }
    }
    return false;
  }

  function cardCoversSuburb(card, suburbId){
    return coverageCoversSuburb(coverageFromCard(card), suburbId);
  }

  function mapSuburbIdsFromCards(cards){
    var set = {};
    serviceMapSuburbIds().forEach(function(id){ set[id] = true; });
    coveragesFromCards(cards).forEach(function(cov){
      coveredSuburbIdsFromCoverage(cov).forEach(function(id){
        if(isServiceAreaSuburbId(id)) set[registryToBoundaryId(id)] = true;
      });
    });
    return Object.keys(set);
  }

  function allRegistrySuburbIds(){
    return allByType('suburb').map(function(s){ return s.id; });
  }

  function registryToBoundaryId(id){
    if(id === 'mount-ommaney') return 'mt-ommaney';
    return resolveId(id);
  }

  function resolveIncludeSuburbIds(options){
    var ids = options && options.includeSuburbIds;
    if(ids && ids.length) return ids;
    return serviceMapSuburbIds();
  }

  function pickerSuburbs(){
    return allBoundarySuburbs();
  }

  function tutorSuburbDots(cards){
    var seen = {};
    var out = [];
    [].forEach.call(cards || [], function(card){
      (card.getAttribute('data-suburbs') || '').trim().split(/\s+/).filter(Boolean).forEach(function(id){
        if(seen[id]) return;
        var loc = get(id);
        if(!loc) return;
        seen[id] = true;
        out.push(loc);
      });
    });
    return out;
  }

  function cartoBasemapKey(){
    if(global.VT_CARTO_BASEMAP_KEY) return String(global.VT_CARTO_BASEMAP_KEY).trim();
    var meta = typeof document !== 'undefined' && document.querySelector('meta[name="vt-carto-basemap-key"]');
    return meta ? (meta.getAttribute('content') || '').trim() : '';
  }

  function prefersDarkBasemap(){
    return false; /* site is light-only */
  }

  function tileUrl(){
    var key = cartoBasemapKey();
    if(!key) return prefersDarkBasemap() ? TILE_ESRI_DARK : TILE_ESRI_LIGHT;
    var base = prefersDarkBasemap() ? TILE_CARTO_DARK : TILE_CARTO_LIGHT;
    return base + (base.indexOf('?') === -1 ? '?' : '&') + 'key=' + encodeURIComponent(key);
  }

  function tileAttribution(){
    return cartoBasemapKey() ? TILE_CARTO_ATTR : TILE_ESRI_ATTR;
  }

  function tileSubdomains(){
    return cartoBasemapKey() ? 'abcd' : '';
  }

  function tileMaxZoom(){
    return cartoBasemapKey() ? 19 : 16;
  }

  function createIcons(L){
    return {
      venue: L.divIcon({
        className: 'vt-pin vt-pin--venue',
        html: '<span></span>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        popupAnchor: [0, -8]
      }),
      suburb: L.divIcon({
        className: 'vt-pin vt-pin--suburb',
        html: '<span></span>',
        iconSize: [11, 11],
        iconAnchor: [5.5, 5.5],
        popupAnchor: [0, -6]
      }),
      picker: L.divIcon({
        className: 'vt-pin vt-pin--picker',
        html: '<span></span>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        popupAnchor: [0, -8]
      })
    };
  }

  function suburbPopupHtml(loc, extra){
    var name = (loc && loc.name) || 'Suburb';
    return '<strong>' + name + '</strong><br>Home-visit area'
      + (extra ? '<br>' + extra : '')
      + (loc && loc.id ? '<br><a href="https://www.google.com/maps/search/?api=1&query=' + googleQuery(loc) + '" target="_blank" rel="noopener">Open in Google Maps</a>' : '');
  }

  function venuePopupHtml(loc, extra){
    return '<strong>' + loc.name + '</strong><br>' + (loc.detail || 'Meet-up venue')
      + (extra ? '<br>' + extra : '')
      + '<br><a href="https://www.google.com/maps/search/?api=1&query=' + googleQuery(loc) + '" target="_blank" rel="noopener">Open in Google Maps</a>';
  }

  function computeServiceArea(L){
    var subs = allByType('suburb');
    if(!subs.length || !L) return null;
    var north = subs[0];
    var south = subs[0];
    var west = subs[0];
    var east = subs[0];
    subs.forEach(function(s){
      if(s.lat > north.lat) north = s;
      if(s.lat < south.lat) south = s;
      if(s.lng < west.lng) west = s;
      if(s.lng > east.lng) east = s;
    });
    var center = L.latLng((north.lat + south.lat) / 2, (west.lng + east.lng) / 2);
    var radius = Math.max(
      center.distanceTo(L.latLng(north.lat, north.lng)),
      center.distanceTo(L.latLng(south.lat, south.lng))
    ) + 1000;
    return {
      center: center,
      radius: radius,
      suburbList: subs.map(function(s){ return s.name; }).join(', ')
    };
  }

  function addTileLayer(map, L){
    var opts = {
      attribution: tileAttribution(),
      maxZoom: tileMaxZoom()
    };
    var subdomains = tileSubdomains();
    if(subdomains) opts.subdomains = subdomains;
    L.tileLayer(tileUrl(), opts).addTo(map);
  }

  function combineBounds(L, items){
    var fit = null;
    (items || []).forEach(function(b){
      if(!b) return;
      if(Array.isArray(b) && typeof b[0] === 'number'){
        if(!fit) fit = L.latLngBounds(b, b);
        else fit.extend(b);
      }else if(b.getNorthEast){
        if(!fit) fit = b;
        else fit.extend(b);
      }
    });
    return fit && fit.isValid() ? fit : null;
  }

  function plotSuburbBoundaries(map, L, options, bounds){
    if(!boundariesFc || !boundariesFc.features || !boundariesFc.features.length) return null;
    var target = options.layerGroup || map;
    var include = resolveIncludeSuburbIds(options);
    var includeSet = {};
    include.forEach(function(id){ includeSet[registryToBoundaryId(id)] = true; });
    var features = boundariesFc.features.filter(function(f){
      return includeSet[f.properties.id] && !isExcludedFromServiceArea(f);
    });
    if(!features.length) return null;
    return L.geoJSON({ type: 'FeatureCollection', features: features }, {
      style: function(){
        return {
          fillColor: '#F0C45A',
          color: '#8B6FD4',
          weight: 1,
          opacity: 0.65,
          fillOpacity: 0.14
        };
      },
      onEachFeature: function(feature, layer){
        var props = feature.properties || {};
        var loc = getSuburbLoc(props.id) || { id: props.id, name: props.locality, type: 'suburb', lga: props.lga };
        var extra = options.suburbExtra ? options.suburbExtra(loc) : '';
        layer.bindPopup(suburbPopupHtml(loc, extra));
      }
    }).addTo(target);
  }

  function plotSuburbDots(map, L, options, icons, bounds){
    var include = resolveIncludeSuburbIds(options);
    var set = {};
    include.forEach(function(id){ set[registryToBoundaryId(id)] = true; });
    var subs = allByType('suburb').filter(function(s){ return set[s.id]; });
    subs.forEach(function(s){
      bounds.push([s.lat, s.lng]);
      var extra = options.suburbExtra ? options.suburbExtra(s) : '';
      L.marker([s.lat, s.lng], { icon: icons.suburb })
        .addTo(options.layerGroup || map)
        .bindPopup(suburbPopupHtml(s, extra));
    });
  }

  function plotLocations(map, L, options){
    options = options || {};
    var icons = createIcons(L);
    var target = options.layerGroup || map;
    var bounds = [];
    var venueMarkers = {};
    var suburbList = allByType('suburb').map(function(s){ return s.name; }).join(', ');

    if(options.serviceCircle !== false){
      var area = computeServiceArea(L);
      if(area){
        L.circle(area.center, {
          radius: area.radius,
          color: '#6B4CE0',
          weight: 1.5,
          opacity: 0.55,
          fillColor: '#F0C45A',
          fillOpacity: 0.1
        }).addTo(map).bindPopup(
          '<strong>Home visits</strong><br>Service suburbs across greater Brisbane, including '
          + area.suburbList + '.<br>Online available anywhere.'
        );
        suburbList = area.suburbList;
      }
    }

    allByType('venue').forEach(function(v){
      bounds.push([v.lat, v.lng]);
      var extra = options.venueExtra ? options.venueExtra(v) : '';
      var marker = L.marker([v.lat, v.lng], { icon: icons.venue })
        .addTo(target)
        .bindPopup(venuePopupHtml(v, extra));
      venueMarkers[v.id] = marker;
      if(v.tab) venueMarkers[v.tab] = marker;
    });

    var suburbLayer = null;
    if(boundariesFc && boundariesFc.features && boundariesFc.features.length){
      suburbLayer = plotSuburbBoundaries(map, L, options, bounds);
      if(suburbLayer) bounds.push(suburbLayer.getBounds());
    }else{
      plotSuburbDots(map, L, options, icons, bounds);
    }

    var fitBounds = combineBounds(L, bounds);
    return { bounds: bounds, fitBounds: fitBounds, venueMarkers: venueMarkers, icons: icons, suburbList: suburbList, suburbLayer: suburbLayer };
  }

  var MAP_REGIONS_KEY = 'vtMapRegionIds';
  var MAP_REGIONS_EVENT = 'vt-map-regions-change';
  var staticMapRegistry = [];

  function readMapRegionIds(){
    try{
      var raw = sessionStorage.getItem(MAP_REGIONS_KEY);
      if(raw){
        var parsed = JSON.parse(raw);
        if(Array.isArray(parsed) && parsed.length) return parsed;
      }
    }catch(e){}
    return serviceMapSuburbIds();
  }

  function publishMapRegionIds(ids){
    if(!ids || !ids.length) ids = serviceMapSuburbIds();
    try{
      sessionStorage.setItem(MAP_REGIONS_KEY, JSON.stringify(ids));
    }catch(e){}
    global.dispatchEvent(new CustomEvent(MAP_REGIONS_EVENT, { detail: ids }));
    refreshStaticMapRegions();
  }

  function replotStaticRegions(entry, suburbIds){
    if(!entry || !entry.map || !entry.L) return;
    if(entry.suburbLayer){
      entry.map.removeLayer(entry.suburbLayer);
      entry.suburbLayer = null;
    }
    var opts = {
      layerGroup: entry.map,
      includeSuburbIds: suburbIds,
      serviceCircle: false,
      suburbExtra: entry.suburbExtra,
      venueExtra: entry.venueExtra
    };
    if(boundariesFc && boundariesFc.features && boundariesFc.features.length){
      entry.suburbLayer = plotSuburbBoundaries(entry.map, entry.L, opts, []);
    }
    if(entry.mapEntry && entry.mapEntry.fitBounds){
      entry.map.fitBounds(entry.mapEntry.fitBounds, MAP_FIT_OPTS);
    }
    finalizeServiceMap(entry.mapEntry, entry.L, readServiceAreaState());
  }

  function refreshStaticMapRegions(){
    var ids = readMapRegionIds();
    staticMapRegistry.forEach(function(entry){
      replotStaticRegions(entry, ids);
    });
  }

  function initStaticServiceMaps(mapNodes, L, options){
    options = options || {};
    if(!mapNodes || !mapNodes.length || !L) return Promise.resolve();
    var coverages = options.coverages || TUTOR_COVERAGE.slice();
    var suburbExtra = function(loc){
      var tutors = tutorNamesForSuburb(loc.id, coverages);
      return tutors ? 'Tutors · ' + tutors : '';
    };
    var venueExtra = function(loc){
      var tutors = tutorNamesForVenue(loc.id, coverages);
      return tutors ? 'Tutors · ' + tutors : '';
    };

    return loadBoundaries().then(function(){
      [].forEach.call(mapNodes, function(el){
        var plotOpts = {
          serviceCircle: false,
          includeSuburbIds: readMapRegionIds(),
          suburbExtra: suburbExtra,
          venueExtra: venueExtra
        };
        var map = L.map(el, {
          scrollWheelZoom: false,
          dragging: false,
          touchZoom: false,
          doubleClickZoom: false,
          boxZoom: false,
          keyboard: false,
          zoomControl: false,
          attributionControl: true,
          tap: false
        });
        addTileLayer(map, L);
        var result = plotLocations(map, L, plotOpts);
        var mapEntry = {
          map: map,
          picker: null,
          circle: null,
          icons: result.icons,
          fitBounds: result.fitBounds,
          bounds: result.bounds,
          static: true
        };
        registerServiceMap(mapEntry, { deferApply: true });
        staticMapRegistry.push({
          map: map,
          L: L,
          suburbLayer: result.suburbLayer,
          suburbExtra: suburbExtra,
          venueExtra: venueExtra,
          mapEntry: mapEntry
        });
        if(result.fitBounds){
          map.fitBounds(result.fitBounds, MAP_FIT_OPTS);
        }else{
          map.setView([DEFAULT_MAP_VIEW.lat, DEFAULT_MAP_VIEW.lng], DEFAULT_MAP_VIEW.zoom);
        }
        setTimeout(function(){
          finalizeServiceMap(mapEntry, L, readServiceAreaState());
          map.invalidateSize(true);
        }, 140);

        var wrap = el.closest('[data-vt-map-wrap]');
        if(!wrap) return;

        var titleEl = wrap.querySelector('[data-vt-title]');
        var detailEl = wrap.querySelector('[data-vt-detail]');
        var linkEl = wrap.querySelector('[data-vt-link]');
        var tabs = wrap.querySelectorAll('[data-vt-venue]');

        [].forEach.call(tabs, function(tab){
          tab.addEventListener('click', function(){
            var id = tab.getAttribute('data-vt-venue');
            [].forEach.call(tabs, function(t){
              t.classList.toggle('is-active', t === tab);
              t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
            });
            if(id === 'all'){
              var areaState = readServiceAreaState();
              if(areaState.suburb){
                applyServiceAreaToMap(mapEntry, areaState, L);
              }else if(result.fitBounds){
                map.fitBounds(result.fitBounds, MAP_FIT_OPTS);
              }
              if(titleEl) titleEl.textContent = 'Brisbane service area';
              if(detailEl) detailEl.textContent = 'Meet-up venues plus shaded home-visit suburbs. Online available anywhere.';
              if(linkEl) linkEl.href = 'https://www.google.com/maps/search/?api=1&query=Vantage+Tutoring+Brisbane';
              return;
            }
            var v = getVenueByTab(id);
            if(!v) return;
            map.setView([v.lat, v.lng], 14, { animate: false });
            if(titleEl) titleEl.textContent = v.name;
            if(detailEl) detailEl.textContent = v.detail || 'Meet-up venue';
            if(linkEl) linkEl.href = 'https://www.google.com/maps/search/?api=1&query=' + googleQuery(v);
          });
        });
      });

      if(!initStaticServiceMaps._listening){
        initStaticServiceMaps._listening = true;
        global.addEventListener(SERVICE_AREA_EVENT, function(e){
          if(!e.detail) return;
          refreshServiceAreaOnMaps(e.detail);
        });
        global.addEventListener(MAP_REGIONS_EVENT, function(){
          refreshStaticMapRegions();
        });
        global.addEventListener('storage', function(e){
          if(e.key === SERVICE_AREA_KEY && e.newValue){
            try{
              refreshServiceAreaOnMaps(JSON.parse(e.newValue));
            }catch(err){}
          }
          if(e.key === MAP_REGIONS_KEY) refreshStaticMapRegions();
        });
      }
    });
  }
  var SERVICE_AREA_EVENT = 'vt-service-area-change';
  var DEFAULT_SERVICE_RADIUS = 15;
  var serviceMapRegistry = [];

  function readServiceAreaState(){
    try{
      var raw = sessionStorage.getItem(SERVICE_AREA_KEY);
      if(raw){
        var parsed = JSON.parse(raw);
        return {
          suburb: parsed.suburb || '',
          radius: parseInt(parsed.radius, 10) || DEFAULT_SERVICE_RADIUS
        };
      }
    }catch(e){}
    return { suburb: '', radius: DEFAULT_SERVICE_RADIUS };
  }

  function readServiceAreaFromDom(source){
    var stored = readServiceAreaState();
    var suburb = stored.suburb;
    var radius = stored.radius;

    if(source && (source.getAttribute('data-vt-suburb') || source.id === 'filterSuburb')){
      suburb = source.value || '';
    }else{
      [].forEach.call(document.querySelectorAll('select[data-vt-suburb], #filterSuburb'), function(sel){
        if(sel.value) suburb = sel.value;
      });
    }

    if(source && (source.getAttribute('data-vt-radius') || source.id === 'filterRadius')){
      radius = parseInt(source.value, 10) || DEFAULT_SERVICE_RADIUS;
    }else{
      [].forEach.call(document.querySelectorAll('input[data-vt-radius], #filterRadius'), function(input){
        if(input.value) radius = parseInt(input.value, 10) || DEFAULT_SERVICE_RADIUS;
      });
    }

    return {
      suburb: suburb || '',
      radius: radius || DEFAULT_SERVICE_RADIUS
    };
  }

  function syncRadiusLabelFor(input){
    if(!input) return;
    var wrap = input.closest('.loc-filter-radius-wrap');
    var valEl = wrap && wrap.querySelector('[data-vt-radius-val], .loc-filter-radius-val');
    if(valEl) valEl.textContent = input.value + ' km';
    input.setAttribute('aria-valuenow', input.value);
  }

  function applyServiceAreaToMap(entry, state, L){
    if(!entry || !entry.map || !L) return;
    if(entry.circle){
      entry.map.removeLayer(entry.circle);
      entry.circle = null;
    }
    if(entry.picker && entry.map.hasLayer(entry.picker)){
      entry.map.removeLayer(entry.picker);
    }
    if(!state || !state.suburb){
      if(entry.fitBounds){
        entry.map.fitBounds(entry.fitBounds, MAP_FIT_OPTS);
      }else{
        entry.map.setView([DEFAULT_MAP_VIEW.lat, DEFAULT_MAP_VIEW.lng], DEFAULT_MAP_VIEW.zoom);
      }
      entry.map.invalidateSize(true);
      return;
    }
    var center = getSuburbLoc(state.suburb);
    if(!center) return;
    if(!entry.picker && entry.icons){
      entry.picker = L.marker([center.lat, center.lng], { icon: entry.icons.picker, zIndexOffset: 1000 });
    }
    if(!entry.picker) return;
    entry.picker.setLatLng([center.lat, center.lng]).addTo(entry.map);
    entry.picker.bindPopup('<strong>' + center.name + '</strong><br>Your selected suburb · ' + state.radius + ' km radius');
    entry.circle = L.circle([center.lat, center.lng], {
      radius: state.radius * 1000,
      color: '#6B4CE0',
      weight: 1.5,
      opacity: 0.55,
      fillColor: '#F0C45A',
      fillOpacity: 0.1
    }).addTo(entry.map);
    entry.map.fitBounds(entry.circle.getBounds(), { padding: [20, 20], maxZoom: 12 });
    entry.map.invalidateSize(true);
  }

  function finalizeServiceMap(entry, L, state){
    if(!entry || !entry.map || !L) return;
    entry.map.invalidateSize(true);
    applyServiceAreaToMap(entry, state || readServiceAreaState(), L);
    setTimeout(function(){
      if(entry.map) entry.map.invalidateSize(true);
    }, 140);
  }

  function refreshServiceAreaOnMaps(state, L){
    var leaflet = L || (typeof global.L !== 'undefined' ? global.L : null);
    if(!leaflet) return;
    serviceMapRegistry.forEach(function(entry){
      applyServiceAreaToMap(entry, state, leaflet);
    });
  }

  function syncServiceAreaPickers(state, source){
    [].forEach.call(document.querySelectorAll('select[data-vt-suburb]'), function(sel){
      if(sel === source) return;
      if(sel.value !== state.suburb) sel.value = state.suburb;
    });
    [].forEach.call(document.querySelectorAll('input[data-vt-radius]'), function(input){
      if(input === source) return;
      if(String(input.value) !== String(state.radius)){
        input.value = String(state.radius);
        syncRadiusLabelFor(input);
      }
    });
    var filterSuburb = document.getElementById('filterSuburb');
    if(filterSuburb && filterSuburb !== source && !filterSuburb.hasAttribute('data-vt-suburb') && filterSuburb.value !== state.suburb){
      filterSuburb.value = state.suburb;
    }
    var filterRadius = document.getElementById('filterRadius');
    if(filterRadius && filterRadius !== source && !filterRadius.hasAttribute('data-vt-radius')){
      if(String(filterRadius.value) !== String(state.radius)){
        filterRadius.value = String(state.radius);
        syncRadiusLabelFor(filterRadius);
      }
    }
  }

  function setServiceAreaState(state, source){
    var next = state || readServiceAreaFromDom(source);
    next = {
      suburb: next.suburb || '',
      radius: parseInt(next.radius, 10) || DEFAULT_SERVICE_RADIUS
    };
    try{
      sessionStorage.setItem(SERVICE_AREA_KEY, JSON.stringify(next));
    }catch(e){}
    syncServiceAreaPickers(next, source);
    refreshServiceAreaOnMaps(next);
    global.dispatchEvent(new CustomEvent(SERVICE_AREA_EVENT, { detail: next }));
  }

  function registerServiceMap(entry, options){
    options = options || {};
    if(!entry || !entry.map) return;
    serviceMapRegistry.push(entry);
    if(options.deferApply) return;
    applyServiceAreaToMap(entry, readServiceAreaState(), typeof L !== 'undefined' ? L : null);
  }

  function initServiceAreaMirroring(options){
    options = options || {};
    if(!document.querySelector('[data-vt-dynamic-area]')) return Promise.resolve();
    if(!initServiceAreaMirroring._storageBound){
      initServiceAreaMirroring._storageBound = true;
      global.addEventListener('storage', function(e){
        if(e.key !== SERVICE_AREA_KEY) return;
        var state = readServiceAreaState();
        syncServiceAreaPickers(state, null);
        refreshServiceAreaOnMaps(state);
        global.dispatchEvent(new CustomEvent(SERVICE_AREA_EVENT, { detail: state }));
      });
    }
    return loadBoundaries().then(function(){
      var state = readServiceAreaState();
      [].forEach.call(document.querySelectorAll('select[data-vt-suburb]'), function(sel){
        populateSuburbSelect(sel, sel.getAttribute('data-vt-suburb-placeholder') || options.suburbPlaceholder || 'Any area');
        sel.value = state.suburb;
        if(sel._vtServiceBound) return;
        sel._vtServiceBound = true;
        sel.addEventListener('change', function(){
          setServiceAreaState(readServiceAreaFromDom(sel), sel);
        });
      });
      [].forEach.call(document.querySelectorAll('input[data-vt-radius]'), function(input){
        input.value = String(state.radius);
        syncRadiusLabelFor(input);
        if(input._vtServiceBound) return;
        input._vtServiceBound = true;
        input.addEventListener('input', function(){
          setServiceAreaState(readServiceAreaFromDom(input), input);
        });
      });
      refreshServiceAreaOnMaps(state);
    });
  }

  function initServiceMaps(mapNodes, L, options){
    options = options || {};
    if(!mapNodes || !mapNodes.length || !L) return Promise.resolve();
    var coverages = options.coverages || TUTOR_COVERAGE.slice();
    var plotOpts = {
      serviceCircle: false,
      includeSuburbIds: options.includeSuburbIds || serviceMapSuburbIds(),
      suburbExtra: function(loc){
        var tutors = tutorNamesForSuburb(loc.id, coverages);
        return tutors ? 'Tutors · ' + tutors : '';
      },
      venueExtra: function(loc){
        var tutors = tutorNamesForVenue(loc.id, coverages);
        return tutors ? 'Tutors · ' + tutors : '';
      }
    };

    return loadBoundaries().then(function(){
      [].forEach.call(mapNodes, function(el){
        var map = L.map(el, {
          scrollWheelZoom: false,
          attributionControl: true,
          zoomControl: true
        });
        addTileLayer(map, L);
        var result = plotLocations(map, L, plotOpts);
        var mapEntry = {
          map: map,
          picker: null,
          circle: null,
          icons: result.icons,
          fitBounds: result.fitBounds,
          bounds: result.bounds
        };
        registerServiceMap(mapEntry, { deferApply: true });
        setTimeout(function(){
          finalizeServiceMap(mapEntry, L);
        }, 140);

        var wrap = el.closest('[data-vt-map-wrap]');
        if(!wrap){
          setTimeout(function(){ map.invalidateSize(); }, 120);
          global.addEventListener('load', function(){ map.invalidateSize(); });
          return;
        }

        var titleEl = wrap.querySelector('[data-vt-title]');
        var detailEl = wrap.querySelector('[data-vt-detail]');
        var linkEl = wrap.querySelector('[data-vt-link]');
        var tabs = wrap.querySelectorAll('[data-vt-venue]');

        [].forEach.call(tabs, function(tab){
          tab.addEventListener('click', function(){
            var id = tab.getAttribute('data-vt-venue');
            [].forEach.call(tabs, function(t){
              t.classList.toggle('is-active', t === tab);
              t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
            });
            if(id === 'all'){
              var areaState = readServiceAreaState();
              if(areaState.suburb){
                applyServiceAreaToMap(mapEntry, areaState, L);
              }else if(result.fitBounds){
                map.fitBounds(result.fitBounds, MAP_FIT_OPTS);
              }else{
                map.fitBounds(result.bounds, MAP_FIT_OPTS);
              }
              if(titleEl) titleEl.textContent = 'Brisbane service area';
              if(detailEl) detailEl.textContent = 'Meet-up venues plus shaded home-visit suburbs. Online available anywhere.';
              if(linkEl) linkEl.href = 'https://www.google.com/maps/search/?api=1&query=Vantage+Tutoring+Brisbane';
              return;
            }
            var v = getVenueByTab(id);
            if(!v) return;
            map.setView([v.lat, v.lng], 14, { animate: true });
            if(result.venueMarkers[id]) result.venueMarkers[id].openPopup();
            if(titleEl) titleEl.textContent = v.name;
            if(detailEl) detailEl.textContent = v.detail || 'Meet-up venue';
            if(linkEl) linkEl.href = 'https://www.google.com/maps/search/?api=1&query=' + googleQuery(v);
          });
        });

        setTimeout(function(){ map.invalidateSize(); }, 120);
        global.addEventListener('load', function(){ map.invalidateSize(); });
      });
    });
  }

  global.VTLoc = {
    registry: REGISTRY,
    get: get,
    getSuburbLoc: getSuburbLoc,
    resolveId: resolveId,
    loadBoundaries: loadBoundaries,
    allSuburbs: function(){ return allBoundarySuburbs(); },
    allRegistrySuburbIds: allRegistrySuburbIds,
    serviceMapSuburbIds: serviceMapSuburbIds,
    allVenues: function(){ return allByType('venue'); },
    getVenueByTab: getVenueByTab,
    googleQuery: googleQuery,
    distKm: distKm,
    idsFromCard: idsFromCard,
    cardMatchesRadius: cardMatchesRadius,
    cardCoversSuburb: cardCoversSuburb,
    getSuburbLga: getSuburbLga,
    mapSuburbIdsFromCards: mapSuburbIdsFromCards,
    coveredSuburbIdsFromCard: coveredSuburbIdsFromCard,
    coveredSuburbIdsFromCards: coveredSuburbIdsFromCards,
    coveragesFromCards: coveragesFromCards,
    tutorNamesForSuburb: tutorNamesForSuburb,
    tutorNamesForVenue: tutorNamesForVenue,
    populateSuburbSelect: populateSuburbSelect,
    suburbsInRegion: suburbsInRegion,
    regionMatchesLga: regionMatchesLga,
    DEFAULT_MAP_VIEW: DEFAULT_MAP_VIEW,
    MAP_FIT_OPTS: MAP_FIT_OPTS,
    pickerSuburbs: pickerSuburbs,
    tutorSuburbDots: tutorSuburbDots,
    tileUrl: tileUrl,
    createIcons: createIcons,
    addTileLayer: addTileLayer,
    plotLocations: plotLocations,
    initServiceMaps: initServiceMaps,
    initStaticServiceMaps: initStaticServiceMaps,
    initServiceAreaMirroring: initServiceAreaMirroring,
    readMapRegionIds: readMapRegionIds,
    publishMapRegionIds: publishMapRegionIds,
    MAP_REGIONS_EVENT: MAP_REGIONS_EVENT,
    readServiceAreaState: readServiceAreaState,
    readServiceAreaFromDom: readServiceAreaFromDom,
    setServiceAreaState: setServiceAreaState,
    registerServiceMap: registerServiceMap,
    finalizeServiceMap: finalizeServiceMap,
    applyServiceAreaToMap: applyServiceAreaToMap,
    SERVICE_AREA_EVENT: SERVICE_AREA_EVENT,
    DEFAULT_SERVICE_RADIUS: DEFAULT_SERVICE_RADIUS,
    suburbPopupHtml: suburbPopupHtml,
    venuePopupHtml: venuePopupHtml
  };
})(typeof window !== 'undefined' ? window : this);
