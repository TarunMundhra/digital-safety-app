import networkx as nx
import community as community_louvain
import hashlib
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session
from app.db.models import Entity, EntityLink, FraudCluster
from collections import defaultdict

def build_graph_from_db(db: Session) -> nx.Graph:
    G = nx.Graph()
    entities = db.query(Entity).all()
    links = db.query(EntityLink).all()
    
    for ent in entities:
        G.add_node(ent.id, type=ent.type, value=ent.value, risk=ent.risk_score, state=ent.state_code)
    for link in links:
        G.add_edge(link.entity_a_id, link.entity_b_id, weight=link.weight, type=link.link_type)
    return G

def detect_clusters(db: Session) -> list:
    G = build_graph_from_db(db)
    partition = community_louvain.best_partition(G)
    
    clusters = defaultdict(list)
    for node, cluster_id in partition.items():
        clusters[cluster_id].append(node)
        
    db_clusters = []
    for c_id, members in clusters.items():
        if len(members) > 1:
            fc = FraudCluster(label=f"Cluster-{c_id}", member_entity_ids=members, confidence=0.85)
            db.add(fc)
            db.flush()
            db_clusters.append({"cluster_id": str(fc.id), "members": len(members)})
    db.commit()
    return db_clusters

def get_cross_state_clusters(db: Session) -> list:
    # Phase 11: Proves jurisdiction-sharding capability
    G = build_graph_from_db(db)
    partition = community_louvain.best_partition(G)
    
    clusters = defaultdict(list)
    for node, cluster_id in partition.items():
        clusters[cluster_id].append(node)
        
    cross_state = []
    for c_id, members in clusters.items():
        if len(members) > 1:
            states = set()
            for node_id in members:
                states.add(G.nodes[node_id].get('state'))
            if len(states) > 1:
                cross_state.append({
                    "cluster_id": c_id,
                    "member_count": len(members),
                    "states_involved": list(states)
                })
    return cross_state

def generate_intel_package(db: Session, cluster_id: str) -> str:
    import os
    import tempfile
    cluster = db.query(FraudCluster).filter(FraudCluster.id == cluster_id).first()
    if not cluster: return None
    
    pdf_path = os.path.join(tempfile.gettempdir(), f"intel_package_{cluster_id}.pdf")
    c = canvas.Canvas(pdf_path)
    c.drawString(100, 800, f"Fraud Intelligence Package - Cluster {cluster_id}")
    c.drawString(100, 780, f"Members: {len(cluster.member_entity_ids)}")
    hash_str = hashlib.sha256(str(cluster.member_entity_ids).encode()).hexdigest()
    c.drawString(100, 760, f"SHA-256 Hash: {hash_str}")
    c.save()
    return pdf_path

def get_clusters_bfs(db: Session) -> dict:
    db.query(FraudCluster).delete()
    db.commit()

    G = build_graph_from_db(db)
    if G.number_of_nodes() == 0:
        return {
            "clusters": [],
            "crossStateClusters": [],
            "message": "No entities found in the database"
        }

    components = list(nx.connected_components(G))
    entities = db.query(Entity).all()
    entity_map = {ent.id: ent for ent in entities}
    links = db.query(EntityLink).all()

    clusters = []
    cross_state_clusters = []

    for comp in components:
        if len(comp) <= 1:
            continue
            
        member_entities = [entity_map[node_id] for node_id in comp if node_id in entity_map]
        if not member_entities:
            continue

        type_counts = {}
        for ent in member_entities:
            type_counts[ent.type] = type_counts.get(ent.type, 0) + 1
        dominant_type = max(type_counts, key=type_counts.get) if type_counts else "unknown"

        link_count = 0
        for link in links:
            if link.entity_a_id in comp and link.entity_b_id in comp:
                link_count += 1
        max_possible_links = len(comp) * (len(comp) - 1) / 2
        density = link_count / max_possible_links if max_possible_links > 0 else 0

        avg_risk = sum(ent.risk_score for ent in member_entities) / len(member_entities)
        confidence = min(1.0, density * 0.4 + (avg_risk / 100) * 0.6)

        states = {ent.state_code for ent in member_entities if ent.state_code}
        is_cross_state = len(states) > 1

        cluster_data = {
            "clusterId": "",
            "label": f"{dominant_type.capitalize()} Network ({len(member_entities)} entities)",
            "memberCount": len(member_entities),
            "confidence": round(confidence, 2),
            "members": [
                {
                    "id": str(e.id),
                    "type": e.type,
                    "value": e.value,
                    "riskScore": e.risk_score,
                    "stateCode": e.state_code
                } for e in member_entities
            ],
            "isCrossState": is_cross_state,
            "statesInvolved": list(states)
        }

        fc = FraudCluster(
            label=cluster_data["label"],
            member_entity_ids=[e.id for e in member_entities],
            confidence=cluster_data["confidence"]
        )
        db.add(fc)
        db.flush()

        cluster_data["clusterId"] = str(fc.id)
        clusters.append(cluster_data)

        if is_cross_state:
            cross_state_clusters.append(cluster_data)

    db.commit()
    return {
        "clusters": clusters,
        "crossStateClusters": cross_state_clusters,
        "totalEntities": len(entities),
        "totalLinks": len(links)
    }