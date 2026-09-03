from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[2];e=[]
a=(R/'browser_files/js/application/20_aipp_topology_graph_adapter.js').read_text();v=(R/'browser_files/js/application/21_aipp_cytoscape_topology_view.js').read_text();h=(R/'browser_files/js/application/24b_aipp_chamber_hover_card.js').read_text()
for x in ['kind:"chamber"','kind:"orifice"','kind:"wall"','nodeImage','pyroCount','filterCount','SVG_NS="http:"+"//www.w3.org/2000/svg"','xmlns="${SVG_NS}"']:
 if x not in a:e.append('missing adapter contract '+x)
for x in ['kind:"pyro"','kind:"filter"']:
 if x in a:e.append('owned graph leak '+x)
for x in ['phase05b','background-image','data(nodeImage)','setPresentation']:
 if x not in v:e.append('missing presentation contract '+x)
if 'wheelSensitivity' in v:e.append('custom wheel sensitivity remains')
for x in ['aippChamberHoverCard','aipp-hover-row','mouseover','focusin','pan','zoom','resize']:
 if x not in h:e.append('missing hover contract '+x)
for mode in ['dev','test','prod']:
 p=(R/f'browser_files/dist/bundle.{mode}.html').read_text()
 if 'aippChamberHoverCard' not in p:e.append(mode+' hover card missing')
 if 'aippTopologyPresentation' not in p:e.append(mode+' selector missing')
 if mode=='prod' and ('http://' in p or 'https://' in p):e.append(mode+' remote dependency')
print(json.dumps({'status':'PASS' if not e else 'FAIL','errors':e},indent=2));sys.exit(bool(e))
