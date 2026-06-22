from locust import HttpUser, task, between
import uuid

class ScamLoadTest(HttpUser):
    wait_time = between(1, 3)
    host = "http://localhost:8000"

    @task(3)
    def analyze_scam(self):
        self.client.post("/api/v1/scam-sessions/analyze", json={
            "transcript": "This is CBI calling. There is a warrant for your arrest. Pay 50000 to avoid jail.",
            "caller_number": f"+9199{str(uuid.uuid4().int)[:8]}",
            "is_video": True,
            "duration": 1200,
            "state_code": "DL"
        })

    @task(1)
    def view_clusters(self):
        self.client.get("/api/v1/graph/clusters")