import os, time
import psycopg2
from neo4j import GraphDatabase

pg_url  = os.environ['PG_URL']
neo_url = os.environ['NEO4J_URL']
neo_user = os.environ['NEO4J_USER']
neo_pass = os.environ['NEO4J_PASS']

def wait(fn, name):
    for _ in range(60):
        try:
            fn(); return
        except Exception:
            time.sleep(2)
    raise RuntimeError(f"{name} not ready")

def check_pg():
    conn = psycopg2.connect(pg_url)
    conn.close()

def check_neo():
    with GraphDatabase.driver(neo_url, auth=(neo_user, neo_pass)) as d:
        d.verify_connectivity()

def seed_neo4j_minimal():
    q = '''
    MERGE (a:Account {id:"acct_A"})
    MERGE (b:Account {id:"acct_B"})
    MERGE (c:Account {id:"acct_C"})
    MERGE (a)-[:SENT_TO {tx_id:"tx_1", amount:2500, ts:timestamp()}]->(b)
    MERGE (b)-[:SENT_TO {tx_id:"tx_2", amount:3000, ts:timestamp()}]->(c)
    MERGE (a)-[:SENT_TO {tx_id:"tx_3", amount:1200, ts:timestamp()}]->(c)
    MERGE (c)-[:SENT_TO {tx_id:"tx_4", amount: 500, ts:timestamp()}]->(a)
    '''
    with GraphDatabase.driver(neo_url, auth=(neo_user, neo_pass)) as d:
        d.execute_query(q)
def seed_ownership():
    q = """
    // Companies
    MERGE (c1:Company {id:"556000-1111"}) SET c1.name="Nordic Widgets AB"
    MERGE (c2:Company {id:"559000-7777"}) SET c2.name="Boreal Holding AB"
    MERGE (c3:Company {id:"556990-2222"}) SET c3.name="Nordic Widgets Logistics AB"
    MERGE (c4:Company {id:"FI-2999999-9"}) SET c4.name="NW Research Oy"
    MERGE (c5:Company {id:"556222-3333"}) SET c5.name="Skandi Foods AB"
    MERGE (c6:Company {id:"559123-8888"}) SET c6.name="Taste Group AB"
    MERGE (c7:Company {id:"NO-812345678"}) SET c7.name="Skandi Foods Norge AS"
    MERGE (c8:Company {id:"969700-4444"}) SET c8.name="Aurora Consulting KB"

    // Persons
    MERGE (p1:Person {id:"P-ANNA"}) SET p1.name="Anna Berg"
    MERGE (p2:Person {id:"P-ERIK"}) SET p2.name="Erik Lind"
    MERGE (p3:Person {id:"P-LARS"}) SET p3.name="Lars Nyström"
    MERGE (p4:Person {id:"P-KARIN"}) SET p4.name="Karin Persson"
    MERGE (p5:Person {id:"P-SOFIA"}) SET p5.name="Sofia Karlsson"
    MERGE (p6:Person {id:"P-OMAR"}) SET p6.name="Omar Ali"
    MERGE (p7:Person {id:"P-PETER"}) SET p7.name="Peter Holm"
    MERGE (p8:Person {id:"P-NINA"}) SET p8.name="Nina Aalto"

    // Direct ownership (owner -> company)
    MERGE (p1)-[:OWNS {percent:60}]->(c1)
    MERGE (p2)-[:OWNS {percent:25}]->(c1)
    MERGE (c2)-[:OWNS {percent:15}]->(c1)

    MERGE (p3)-[:OWNS {percent:100}]->(c2)

    MERGE (c1)-[:OWNS {percent:100}]->(c3)
    MERGE (c1)-[:OWNS {percent:70}]->(c4)

    MERGE (c6)-[:OWNS {percent:80}]->(c5)
    MERGE (p4)-[:OWNS {percent:20}]->(c5)
    MERGE (c5)-[:OWNS {percent:100}]->(c7)

    MERGE (p5)-[:OWNS {percent:55}]->(c6)
    MERGE (p6)-[:OWNS {percent:45}]->(c6)

    MERGE (p7)-[:OWNS {percent:50}]->(c8)
    MERGE (p8)-[:OWNS {percent:50}]->(c8)
    """
    with GraphDatabase.driver(neo_url, auth=(neo_user, neo_pass)) as d:
        d.execute_query(q)
def seed_governance():
    q = """
    // Companies (existing + extras for cross-links)
    MERGE (nw:Company {id:"556000-1111"}) SET nw.name="Nordic Widgets AB"
    MERGE (bor:Company {id:"559000-7777"}) SET bor.name="Boreal Holding AB"
    MERGE (nwl:Company {id:"556990-2222"}) SET nwl.name="Nordic Widgets Logistics AB"
    MERGE (nwr:Company {id:"FI-2999999-9"}) SET nwr.name="NW Research Oy"
    MERGE (sf:Company  {id:"556222-3333"}) SET sf.name="Skandi Foods AB"
    MERGE (tg:Company  {id:"559123-8888"}) SET tg.name="Taste Group AB"
    MERGE (sfn:Company {id:"NO-812345678"}) SET sfn.name="Skandi Foods Norge AS"
    MERGE (ac:Company  {id:"969700-4444"}) SET ac.name="Aurora Consulting KB"
    MERGE (dm:Company  {id:"556300-2222"}) SET dm.name="Delta Marine AB"
    MERGE (hp:Company  {id:"559500-9090"}) SET hp.name="Haparanda Plast AB"

    // Persons
    MERGE (anna:Person  {id:"P-ANNA"})  SET anna.name="Anna Berg"
    MERGE (erik:Person  {id:"P-ERIK"})  SET erik.name="Erik Lind"
    MERGE (lars:Person  {id:"P-LARS"})  SET lars.name="Lars Nyström"
    MERGE (karin:Person {id:"P-KARIN"}) SET karin.name="Karin Persson"
    MERGE (sofia:Person {id:"P-SOFIA"}) SET sofia.name="Sofia Karlsson"
    MERGE (omar:Person  {id:"P-OMAR"})  SET omar.name="Omar Ali"
    MERGE (peter:Person {id:"P-PETER"}) SET peter.name="Peter Holm"
    MERGE (nina:Person  {id:"P-NINA"})  SET nina.name="Nina Aalto"
    MERGE (mats:Person  {id:"P-MATS"})  SET mats.name="Mats Grön"
    MERGE (eva:Person   {id:"P-EVA"})   SET eva.name="Eva Lund"

    // Governance roles on Nordic Widgets AB
    MERGE (anna)-[:ROLE {type:"Chair",       since:date("2023-03-01")}]->(nw)
    MERGE (erik)-[:ROLE {type:"BoardMember", since:date("2022-05-15")}]->(nw)
    MERGE (mats)-[:ROLE {type:"BoardMember", since:date("2024-02-01")}]->(nw)
    MERGE (eva) -[:ROLE {type:"CEO",         since:date("2024-09-01")}]->(nw)
    MERGE (peter)-[:ROLE {type:"Auditor",    since:date("2023-01-01")}]->(nw)

    // Cross-board links (people serving other companies too)
    MERGE (anna)-[:ROLE {type:"BoardMember", since:date("2021-06-01")}]->(tg)
    MERGE (anna)-[:ROLE {type:"BoardMember", since:date("2022-10-01")}]->(dm)
    MERGE (erik)-[:ROLE {type:"BoardMember", since:date("2020-01-01")}]->(sf)
    MERGE (mats)-[:ROLE {type:"BoardMember", since:date("2023-11-01")}]->(hp)
    MERGE (eva) -[:ROLE {type:"BoardMember", since:date("2021-04-01")}]->(nwr)
    MERGE (peter)-[:ROLE {type:"Auditor",    since:date("2022-01-01")}]->(sf)
    MERGE (peter)-[:ROLE {type:"Auditor",    since:date("2022-01-01")}]->(tg)
    """
    with GraphDatabase.driver(neo_url, auth=(neo_user, neo_pass)) as d:
        d.execute_query(q)

if __name__ == '__main__':
    print('Waiting for Postgres & Neo4j ...')
    wait(check_pg, 'Postgres')
    wait(check_neo, 'Neo4j')
    print('Seeding Neo4j ...')
    seed_neo4j_minimal()
    print('Seed completed')
    print("Seeding Ownership ...")
    seed_ownership()
    print("Ownership seed completed")
    print("Seeding governance (roles & cross-links) ...")
    seed_governance()
    print("Governance seed completed")
