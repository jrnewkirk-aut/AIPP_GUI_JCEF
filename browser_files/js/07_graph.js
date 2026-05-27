/* ============================================================
   Flowchart visualization (SVG + simple force layout)
   Nodes: chambers (ellipse), orifices (rect), walls (diamond)
   No "Env" nodes (per request)
   ============================================================ */
function buildGraph(parsed){
  simNodes = [];
  simEdges = [];

  const assembly = (parsed && parsed.aipp_calculation && parsed.aipp_calculation.assembly) ? parsed.aipp_calculation.assembly : parsed.assembly;
  if (!assembly || !assembly.chambers){
    clearSvg();
    setStatus("No assembly/chambers found for visualization.", false);
    return;
  }

  // Chambers as base nodes (id = "c1", "c2"...)
  for (let i=0;i<assembly.chambers.length;i++){
    simNodes.push({
      id:"c"+(i+1),
      type:"chamber",
      label:"Ch "+(i+1),
      x:150 + i*180,
      y:260 + (i%2)*40,
      data:assembly.chambers[i]
    });
  }

  // Orifices as nodes (id = "o1"...), edges chamber->orifice->chamber
  if (assembly.orifices){
    for (let i=0;i<assembly.orifices.length;i++){
      const o = assembly.orifices[i];
      const from = parseInt(o.from);
      const to = parseInt(o.to);
      if (!from || !to) continue;

      const oid = "o"+(i+1);
      const midX = (getNode("c"+from).x + getNode("c"+to).x)/2;
      const midY = (getNode("c"+from).y + getNode("c"+to).y)/2;

      simNodes.push({
        id:oid,
        type:"orifice",
        label:"Orf "+(i+1),
        x:midX,
        y:midY - 70,
        data:o
      });

      simEdges.push({a:"c"+from, b:oid, type:"flow"});
      simEdges.push({a:oid, b:"c"+to, type:"flow"});
    }
  }

  // Walls as nodes (id = "w1"...), connect to chambers based on chamber_index fields only
  if (assembly.walls){
    for (let i=0;i<assembly.walls.length;i++){
      const w = assembly.walls[i];
      const wid = "w"+(i+1);

      // place walls near their left chamber if possible
      let anchor = null;
      if (w.left_connection && w.left_connection.chamber_index){
        anchor = getNode("c"+w.left_connection.chamber_index);
      } else if (w.right_connection && w.right_connection.chamber_index){
        anchor = getNode("c"+w.right_connection.chamber_index);
      }

      simNodes.push({
        id:wid,
        type:"wall",
        label:"Wall "+(i+1),
        x: anchor ? (anchor.x - 70) : (120 + i*90),
        y: anchor ? (anchor.y + 120) : (460),
        data:w
      });

      if (w.left_connection && w.left_connection.chamber_index){
        simEdges.push({a:"c"+w.left_connection.chamber_index, b:wid, type:"wall"});
      }
      if (w.right_connection && w.right_connection.chamber_index){
        simEdges.push({a:wid, b:"c"+w.right_connection.chamber_index, type:"wall"});
      }
      // If right_connection is environment (no chamber_index), we do nothing (no env nodes).
    }
  }

  // run a short force layout to spread nodes and avoid overlaps
  runForceLayout(220);
  drawSvg();

  setStatus(`Loaded ${simNodes.length} nodes, ${simEdges.length} links.`, true);
}

function getNode(id){
  const n = simNodes.find(x=>x.id===id);
  return n || {x:500,y:350};
}

function clearSvg(){
  document.getElementById("edges").innerHTML = "";
  document.getElementById("nodes").innerHTML = "";
}

function runForceLayout(iter){
  // Basic repulsion + spring attraction
  const kRepel = 4800;
  const kSpring = 0.02;
  const springLen = 150;
  const damp = 0.85;

  // velocities
  for (const n of simNodes){ n.vx = 0; n.vy = 0; }

  for (let t=0;t<iter;t++){
    // repulsion
    for (let i=0;i<simNodes.length;i++){
      for (let j=i+1;j<simNodes.length;j++){
        const a = simNodes[i], b = simNodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx*dx + dy*dy + 0.01;
        const f = kRepel / d2;
        const fx = f * dx;
        const fy = f * dy;
        a.vx += fx; a.vy += fy;
        b.vx -= fx; b.vy -= fy;
      }
    }

    // springs
    for (const e of simEdges){
      const a = getNode(e.a), b = getNode(e.b);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.sqrt(dx*dx + dy*dy) + 0.01;
      const diff = d - springLen;
      const f = kSpring * diff;
      const fx = f * (dx/d);
      const fy = f * (dy/d);
      a.vx += fx; a.vy += fy;
      b.vx -= fx; b.vy -= fy;
    }

    // integrate
    for (const n of simNodes){
      n.vx *= damp; n.vy *= damp;
      n.x += n.vx * 0.0012;
      n.y += n.vy * 0.0012;

      // bounds
      n.x = Math.max(60, Math.min(940, n.x));
      n.y = Math.max(60, Math.min(640, n.y));
    }
  }
}

function drawSvg(){
  clearSvg();

  // edges
  const edgesG = document.getElementById("edges");
  for (const e of simEdges){
    const a = getNode(e.a), b = getNode(e.b);
    const cls = (e.type === "wall") ? "edge edgeWall" : "edge";
    const arrow = (e.type === "flow") ? ' marker-end="url(#arrow)" ' : '';
    edgesG.insertAdjacentHTML("beforeend",
      `<line class="${cls}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" ${arrow}></line>`
    );
  }

  // nodes
  const nodesG = document.getElementById("nodes");
  for (const n of simNodes){
    nodesG.insertAdjacentHTML("beforeend", nodeSvg(n));
  }

  // attach dblclick handlers
  simNodes.forEach(n=>{
    const el = document.getElementById("node_"+n.id);
    if (!el) return;
    el.addEventListener("dblclick", (evt)=>{
      evt.preventDefault();
      evt.stopPropagation();
      openPopup(n);
    });
  });
}

function nodeSvg(n){
  // Use different shapes
  if (n.type === "chamber"){
    return `
      <g id="node_${n.id}" style="cursor:pointer;">
        <ellipse class="nodeChamber" cx="${n.x}" cy="${n.y}" rx="52" ry="26"></ellipse>
        <text class="label" x="${n.x}" y="${n.y+4}" text-anchor="middle">${escapeHtml(n.label)}</text>
      </g>
    `;
  }
  if (n.type === "orifice"){
    return `
      <g id="node_${n.id}" style="cursor:pointer;">
        <rect class="nodeOrifice" x="${n.x-46}" y="${n.y-18}" width="92" height="36" rx="6"></rect>
        <text class="label labelDark" x="${n.x}" y="${n.y+4}" text-anchor="middle">${escapeHtml(n.label)}</text>
      </g>
    `;
  }
  // wall (diamond)
  return `
    <g id="node_${n.id}" style="cursor:pointer;">
      <path class="nodeWall" d="
        M ${n.x} ${n.y-24}
        L ${n.x+30} ${n.y}
        L ${n.x} ${n.y+24}
        L ${n.x-30} ${n.y}
        Z"></path>
      <text class="label" x="${n.x}" y="${n.y+4}" text-anchor="middle">${escapeHtml(n.label)}</text>
    </g>
  `;
}
