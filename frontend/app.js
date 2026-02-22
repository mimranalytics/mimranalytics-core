const API_BASE = "http://localhost:8000";
const cy = cytoscape({
  container: document.getElementById('cy'),
  layout: { name: 'cose', animate: false },
  style: [
    { selector: 'node', style: { 'label': 'data(id)', 'text-valign': 'center', 'color': '#0f172a', 'background-color': '#60a5fa', 'border-width': 1, 'border-color': '#1e3a8a', 'font-size': 10 }},
    { selector: 'edge', style: { 'curve-style': 'bezier', 'target-arrow-shape': 'triangle', 'target-arrow-color': '#64748b', 'line-color': '#94a3b8', 'width': 2 }},
    { selector: 'node:selected', style: { 'background-color': '#22c55e' } }
  ],
  elements: []
});
async function loadSubgraph(seed, hops){
  const res = await fetch(`${API_BASE}/graph/subgraph?seed=${encodeURIComponent(seed)}&hops=${hops}&limit=300`);
  if(!res.ok) throw new Error(await res.text());
  const {nodes,edges} = await res.json();
  cy.elements().remove();
  cy.add(nodes.map(n=>({data:{id:n.id}})));
  cy.add(edges.map(e=>({data:{id:`${e.src}_${e.dst}_${e.tx_id}`,source:e.src,target:e.dst}})));
  cy.layout({name:'cose',animate:false}).run();
}
async function showDegree(id){
  try{
    const res = await fetch(`${API_BASE}/metrics/degree/${encodeURIComponent(id)}`);
    if(!res.ok) throw new Error(await res.text());
    const {inDeg,outDeg,degree} = await res.json();
    document.getElementById('sel').textContent = id;
    document.getElementById('deg').textContent = `${inDeg} / ${outDeg} / ${degree}`;
  }catch(e){
    document.getElementById('sel').textContent = id;
    document.getElementById('deg').textContent = '—';
  }
}
document.getElementById('load').addEventListener('click', async()=>{
  const seed = document.getElementById('seed').value || 'acct_A';
  const hops = parseInt(document.getElementById('hops').value,10);
  document.getElementById('sel').textContent = '—';
  document.getElementById('deg').textContent = '—';
  try{ await loadSubgraph(seed,hops);}catch(e){ alert('Could not load subgraph: '+e.message); }
});
cy.on('tap','node',(evt)=>{ const id = evt.target.id(); cy.$('node').unselect(); evt.target.select(); showDegree(id); });
