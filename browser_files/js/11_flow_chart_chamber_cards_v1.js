/* 11_flow_chart_chamber_cards_v1.js
   Temporary flow-chart chamber visualization patch.
   Load after the current topology patches, preferably after:
     10_topology_removal_blocked_preview_visibility_v1.js

   Implements AIPP_GUI_Controls.md / Flow Chart Visualization / Chambers:
   - rounded rectangle chamber cards
   - Chamber index
   - label or '-'
   - init_type
   - required initialization inputs in compact table-like rows
   - pyros as formulation - shape - quantity
   - filters as material - weight - method:coefficient
*/
(function(){
  if(window.__aippFlowChartChamberCardsV1Applied) return;
  window.__aippFlowChartChamberCardsV1Applied = true;

  function injectChamberCardCss(){
    if(document.getElementById('aippFlowChartChamberCardCss')) return;
    var style=document.createElement('style');
    style.id='aippFlowChartChamberCardCss';
    style.textContent=[
      '.cyChamberCardOverlay{align-items:stretch!important;justify-content:flex-start!important;text-align:left!important;padding:8px 10px!important;line-height:1.15!important;overflow:hidden!important;pointer-events:auto!important;cursor:pointer!important;}',
      '.cyChamberCardContent{display:flex;flex-direction:column;gap:4px;width:100%;height:100%;overflow:hidden;}',
      '.cyChamberHeader{font-weight:900;font-size:13px;color:#005495;text-align:center;border-bottom:1px solid rgba(0,84,149,.25);padding-bottom:3px;margin-bottom:2px;}',
      '.cyChamberLabel{font-size:10px;font-weight:800;color:#001669;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.cyChamberInit{font-size:10px;color:#213547;text-align:center;}',
      '.cyChamberMiniTable{width:100%;border-collapse:collapse;font-size:9px;table-layout:fixed;margin-top:2px;}',
      '.cyChamberMiniTable td{border:1px solid rgba(0,84,149,.18);padding:1px 3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.cyChamberMiniTable td:first-child{font-weight:800;color:#005495;width:38%;background:#f7fbff;}',
      '.cyChamberSectionTitle{font-size:9px;font-weight:900;color:#005495;margin-top:3px;border-top:1px dashed rgba(0,84,149,.25);padding-top:3px;}',
      '.cyChamberItem{font-size:9px;color:#213547;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '#cyChamberOverlayLayer{pointer-events:none;}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function asText(v){return v===undefined||v===null||v===''?'-':String(v);}
  function trunc(s,n){s=asText(s);return s.length>n?s.slice(0,n-1)+'…':s;}
  function initFields(ch){
    var init=ch&&ch.init_type;
    if(typeof CHAMBER_INIT_FIELDS!=='undefined' && CHAMBER_INIT_FIELDS && CHAMBER_INIT_FIELDS[init]) return CHAMBER_INIT_FIELDS[init];
    var fallback={mPT:['mass','pressure','temperature'],PVT:['pressure','volume','temperature'],mVT:['mass','volume','temperature'],nVT:['moles','volume','temperature'],rho_mVT:['density','volume','temperature']};
    return fallback[init]||['pressure','volume','temperature'];
  }
  function pyros(ch){if(!ch||typeof ch!=='object')return[];if(Array.isArray(ch.pyro))return ch.pyro;if(Array.isArray(ch.pyros))return ch.pyros;return[];}
  function filters(ch){if(!ch||typeof ch!=='object')return[];if(Array.isArray(ch.filters))return ch.filters;if(Array.isArray(ch.filter))return ch.filter;if(ch.filter&&typeof ch.filter==='object')return[ch.filter];return[];}
  function pyroShape(py){var s=py&&py.shape;if(s&&typeof s==='object'&&s.geometry)return s.geometry;if(py&&py.geometry)return py.geometry;return'-';}
  function pyroQty(py){if(!py||typeof py!=='object')return'-';if(py.mass!==undefined&&py.mass!==null&&py.mass!=='')return String(py.mass);if(py.number!==undefined&&py.number!==null&&py.number!=='')return 'x'+String(py.number);if(py.quantity!==undefined&&py.quantity!==null&&py.quantity!=='')return 'x'+String(py.quantity);if(py.piles!==undefined&&py.piles!==null&&py.piles!=='')return 'x'+String(py.piles);return'-';}
  function table(rows){var t=document.createElement('table'),tb=document.createElement('tbody');t.className='cyChamberMiniTable';rows.forEach(function(r){var tr=document.createElement('tr'),k=document.createElement('td'),v=document.createElement('td');k.textContent=r[0];v.textContent=r[1];tr.append(k,v);tb.appendChild(tr);});t.appendChild(tb);return t;}
  function chamberDims(ch){var h=154+Math.min(pyros(ch).length,4)*14+Math.min(filters(ch).length,3)*14;return{w:300,h:Math.max(154,Math.min(240,h))};}

  function chamberContent(ch,index){
    var wrap=document.createElement('div');wrap.className='cyChamberCardContent';
    var h=document.createElement('div');h.className='cyChamberHeader';h.textContent='Chamber '+index;wrap.appendChild(h);
    var lab=document.createElement('div');lab.className='cyChamberLabel';lab.title=asText(ch&&ch.label);lab.textContent=trunc((ch&&ch.label)?ch.label:'-',44);wrap.appendChild(lab);
    var init=document.createElement('div');init.className='cyChamberInit';init.innerHTML='<b>init:</b> '+escapeHtml(asText(ch&&ch.init_type));wrap.appendChild(init);
    wrap.appendChild(table(initFields(ch||{}).map(function(f){return[f,asText(ch&&ch[f])];})));
    var ps=pyros(ch);if(ps.length){var pt=document.createElement('div');pt.className='cyChamberSectionTitle';pt.textContent='Pyros';wrap.appendChild(pt);ps.forEach(function(py){var item=document.createElement('div');item.className='cyChamberItem';var formulation=py&&py.formulation?py.formulation:'-';var txt=trunc(formulation,26)+' - '+trunc(pyroShape(py),10)+' - '+trunc(pyroQty(py),12);item.title=asText(formulation)+' - '+asText(pyroShape(py))+' - '+asText(pyroQty(py));item.textContent=txt;wrap.appendChild(item);});}
    var fs=filters(ch);if(fs.length){var ft=document.createElement('div');ft.className='cyChamberSectionTitle';ft.textContent='Filters';wrap.appendChild(ft);fs.forEach(function(f){var item=document.createElement('div');item.className='cyChamberItem';var txt=asText(f&&f.material)+' - '+asText(f&&f.mass)+' - '+asText(f&&f.method)+':'+asText(f&&f.coefficient);item.title=txt;item.textContent=trunc(txt,58);wrap.appendChild(item);});}
    return wrap;
  }

  var originalStyle=window.cytoscapePrototypeStyle;
  window.cytoscapePrototypeStyle=function(){var s=(typeof originalStyle==='function')?originalStyle():[];s.push({selector:'node[type="chamber"]',style:{'background-color':'#fff','border-color':'#005495','border-width':3,'width':300,'height':180,'label':''}});return s;};

  window.computeAippCytoscapeLayoutPositions=function(){
    var pos={};
    simNodes.filter(function(n){return n.type==='chamber';}).forEach(function(n,i){pos[n.id]={x:210+i*460,y:360};});
    simNodes.filter(function(n){return n.type==='orifice';}).forEach(function(n,i){var o=n.data||{},a=pos['c'+parseInt(o.from)]||{x:210,y:360},b=pos['c'+parseInt(o.to)]||{x:670,y:360};pos[n.id]={x:(a.x+b.x)/2,y:145-i*18};});
    simNodes.filter(function(n){return n.type==='wall';}).forEach(function(n,i){var w=n.data||{},ci=(w.left_connection&&w.left_connection.chamber_index)||(w.right_connection&&w.right_connection.chamber_index)||1,a=pos['c'+ci]||{x:210,y:360};pos[n.id]={x:a.x+(i%3-1)*115,y:a.y+245};});
    return pos;
  };

  window.buildCytoscapeChamberOverlays=function(){
    injectChamberCardCss();
    var layer=ensureCyOverlayLayer();layer.innerHTML='';layer.style.pointerEvents='none';
    if(!cyPrototype)return;
    cyPrototype.nodes('[type="chamber"]').forEach(function(node){var n=simNodes.find(function(x){return x.id===node.id();});if(!n)return;var idx=Number(String(node.id()).replace(/^c/,''))||1,ch=n.data||{},dims=chamberDims(ch),card=document.createElement('div');card.className='cyChamberCardOverlay';card.id='cyOverlay_'+node.id();card.style.width=dims.w+'px';card.style.minHeight=dims.h+'px';card.style.height=dims.h+'px';card.appendChild(chamberContent(ch,idx));card.addEventListener('dblclick',function(e){e.preventDefault();e.stopPropagation();openPopup(n);});layer.appendChild(card);});
  };

  window.updateCytoscapeOverlayPositions=function(){
    cyOverlayRaf=null;if(!cyPrototype)return;
    cyPrototype.nodes('[type="chamber"]').forEach(function(node){var card=document.getElementById('cyOverlay_'+node.id());if(!card)return;var rp=node.renderedPosition(),w=parseFloat(card.style.width)||300,h=parseFloat(card.style.height)||180;card.style.left=(rp.x-w/2)+'px';card.style.top=(rp.y-h/2)+'px';});
  };

  setTimeout(injectChamberCardCss,0);
})();
