export default function GraphViz({ query = "BP PLC" }) {
  const nodes = [
    { x: 420, y: 130, r: 38, label: query,          main: true },
    { x: 200, y: 60,  r: 22, label: "Subsidiary A", color: "#4fc3c3" },
    { x: 640, y: 60,  r: 22, label: "Subsidiary B", color: "#4fc3c3" },
    { x: 150, y: 210, r: 20, label: "Director",     color: "#c9a84c" },
    { x: 690, y: 200, r: 20, label: "Shareholder",  color: "#8b7cf6" },
    { x: 420, y: 230, r: 18, label: "Pension Fund", color: "#e8807a" },
    { x: 300, y: 190, r: 16, label: "Holding Co",   color: "#4fc3c3" },
    { x: 540, y: 185, r: 16, label: "JV Entity",    color: "#4fc3c3" },
  ];
  const links = [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[1,6],[2,7]];
  const trunc = (s, n=12) => s.length > n ? s.slice(0,n-1)+"…" : s;

  return (
    <svg viewBox="0 0 840 280" className="graph-svg">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {links.map(([a,b],i) => (
        <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
          stroke="rgba(201,168,76,0.2)" strokeWidth="1" strokeDasharray="4 4"/>
      ))}
      {nodes.map((n,i) => (
        <g key={i} style={{cursor:"pointer"}}>
          {n.main && <circle cx={n.x} cy={n.y} r={n.r+12} fill="rgba(201,168,76,0.08)" className="node-pulse"/>}
          <circle cx={n.x} cy={n.y} r={n.r}
            fill={n.main ? "rgba(201,168,76,0.15)" : `${n.color}18`}
            stroke={n.main ? "#c9a84c" : n.color||"#c9a84c"}
            strokeWidth={n.main?"2":"1"}
            filter={n.main?"url(#glow)":undefined}/>
          <text x={n.x} y={n.y+(n.r>30?5:4)} textAnchor="middle"
            fill={n.main?"#c9a84c":n.color||"#c9a84c"}
            fontSize={n.main?"9":"7.5"}
            fontFamily="'IBM Plex Mono',monospace" fontWeight="500">
            {trunc(n.label)}
          </text>
        </g>
      ))}
    </svg>
  );
}
