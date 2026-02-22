import os
import psycopg2
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from neo4j import GraphDatabase
from typing import Dict, Any

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

PG_URL = os.environ["PG_URL"]
NEO4J_URL  = os.environ["NEO4J_URL"]
NEO4J_USER = os.environ["NEO4J_USER"]
NEO4J_PASS = os.environ["NEO4J_PASS"]
driver = GraphDatabase.driver(NEO4J_URL, auth=(NEO4J_USER, NEO4J_PASS))

def pg_query(sql, params=()):
    conn = psycopg2.connect(PG_URL)
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return cur.fetchall()
    finally:
        conn.close()

@app.get("/health")
def health():
    return {"status":"ok"}

@app.get("/graph/subgraph")
def subgraph(seed: str, hops: int = 2, limit: int = 300):
    hops = 1 if hops < 1 else 3 if hops > 3 else hops

    # Plain string (NOT an f-string). Only {HOPS} will be replaced below.
    template = """
    MATCH (s:Account {id:$seed})
    CALL {
      WITH s
      MATCH p=(s)-[:SENT_TO*..{HOPS}]->(m)
      RETURN collect(DISTINCT m) AS ns
    }
    WITH s, ns + [s] AS ns
    MATCH (a:Account)-[r:SENT_TO]->(b:Account)
    WHERE a IN ns OR b IN ns
    WITH collect(DISTINCT a) + collect(DISTINCT b) AS nodes, collect(DISTINCT r) AS rels
    RETURN
      [n IN nodes | {id: n.id}][0..$limit] AS nodes,
      [r IN rels  | { src: startNode(r).id, dst: endNode(r).id, tx_id: coalesce(r.tx_id,''), amount: coalesce(r.amount,0) }][0..$limit] AS edges
    """

    q = template.replace("{HOPS}", str(hops))

    with driver.session() as s:
        rec = s.run(q, seed=seed, limit=limit).single()
        if not rec or rec["nodes"] is None:
            raise HTTPException(404, "seed not found or no neighbors")
        return {"nodes": rec["nodes"], "edges": rec["edges"]}


@app.get("/ownership/graph")
def ownership_graph(company_id: str, include_holders: bool = True, include_subs: bool = True):
    """
    Return owner->company and company->subsidiary edges around a company_id.
    """
    q = """
    MATCH (c:Company {id:$cid})
    OPTIONAL MATCH (o)-[r:OWNS]->(c)
    WITH c, collect({owner: {id: o.id, name: coalesce(o.name, o.id), type: labels(o)[0]}, percent: r.percent}) AS owners
    OPTIONAL MATCH (c)-[s:OWNS]->(sub:Company)
    WITH c, owners, collect({sub: {id: sub.id, name: coalesce(sub.name, sub.id)}, percent: s.percent}) AS subs
    RETURN c { .id, .name } AS company, owners, subs
    """
    with driver.session() as s:
        rec = s.run(q, cid=company_id).single()
        if not rec:
            raise HTTPException(404, "company not found")

        company = rec["company"]
        owners = rec["owners"] or []
        subs   = rec["subs"] or []

        # Build a Cytoscape-ish response
        nodes: Dict[str, Dict[str, Any]] = {}
        edges = []

        def put_node(nid, label, ntype):
            if nid not in nodes:
                nodes[nid] = {"data": {"id": nid, "label": f"{label}\n({nid})", "type": ntype}}

        put_node(company["id"], company["name"], "company")

        if include_holders:
            for o in owners:
                ow = o["owner"]; pct = o["percent"]
                put_node(ow["id"], ow["name"], ow["type"].lower())
                edges.append({"data": {"id": f"{ow['id']}->{company['id']}",
                                       "source": ow["id"], "target": company["id"],
                                       "label": f"{pct}%"
                }})

        if include_subs:
            for srel in subs:
                sub = srel["sub"]; pct = srel["percent"]
                put_node(sub["id"], sub["name"], "company")
                edges.append({"data": {"id": f"{company['id']}->{sub['id']}",
                                       "source": company["id"], "target": sub["id"],
                                       "label": f"{pct}%"
                }})

        return {"nodes": list(nodes.values()), "edges": edges}


@app.get("/ownership/companies")
def ownership_companies():
    """
    List all companies (id, name). Returns [] if none exist.
    """
    q = """
    MATCH (c:Company)
    RETURN c.id AS id, coalesce(c.name, c.id) AS name
    ORDER BY name
    """
    with driver.session() as s:
        rows = s.run(q).data()
        return [{"id": r.get("id"), "name": r.get("name")} for r in rows]


@app.get("/governance/full-graph")
def governance_full_graph(company_id: str, max_other_companies: int = 50):
    """
    Company -> Persons with roles on it -> Other Companies those persons also serve.
    Returns Cytoscape-style {nodes, edges}.
    """
    q = """
    MATCH (c:Company {id:$cid})
    OPTIONAL MATCH (p:Person)-[r:ROLE]->(c)
    WITH c, collect({person:p, role:r}) AS persons
    RETURN c, persons
    """
    with driver.session() as s:
        base = s.run(q, cid=company_id).single()
        if not base:
            raise HTTPException(404, "company not found")

        c = base["c"]
        persons = base["persons"] or []

        nodes: Dict[str, Dict[str, Any]] = {}
        edges = []

        def put_node(nid, label, ntype):
            if nid and nid not in nodes:
                nodes[nid] = {"data": {"id": nid, "label": f"{label}\n({nid})", "type": ntype}}

        put_node(c["id"], c.get("name", c["id"]), "company")

        # Add person -> seed company edges (role label)
        pids = []
        for pr in persons:
            p = pr["person"]; r = pr["role"]
            if not p: continue
            pids.append(p["id"])
            put_node(p["id"], p.get("name", p["id"]), "person")
            role_label = (r.get("type") if r else "ROLE") or "ROLE"
            edges.append({"data": {
                "id": f"{p['id']}->{c['id']}#{role_label}",
                "source": p["id"], "target": c["id"], "label": role_label
            }})

        # Fetch each person's other mandates
        if pids:
            q2 = """
            UNWIND $pids AS pid
            MATCH (p:Person {id:pid})-[r:ROLE]->(o:Company)
            RETURN p.id AS pid, p.name AS pname, o.id AS oid, o.name AS oname, r.type AS rtype
            """
            cnt = 0
            for row in s.run(q2, pids=pids):
                if cnt >= max_other_companies: break
                pid, pname = row["pid"], row["pname"] or row["pid"]
                oid, oname = row["oid"], row["oname"] or row["oid"]
                rtype = row["rtype"] or "ROLE"
                if oid == c["id"]:
                    continue  # already added person->seed edge
                put_node(pid, pname, "person")
                put_node(oid, oname, "company")
                edges.append({"data": {
                    "id": f"{pid}->{oid}#{rtype}",
                    "source": pid, "target": oid, "label": rtype
                }})
                cnt += 1

        return {"nodes": list(nodes.values()), "edges": edges}

