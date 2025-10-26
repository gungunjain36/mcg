import os
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from uagents.communication import send_sync_message
from uagents_core.identity import generate_user_address

# Import the local agent and its message model
from agents.market_analyst import agent as market_analyst
from agents.market_analyst import AnalyzeMarketRequest


class AnalyzeRequest(BaseModel):
    market_address: str
    collection_slug: str
    include_prediction: bool = True


app = FastAPI(title="MCG ASI Gateway", version="0.1.0")

# Allow local development from any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/status")
async def status():
    return {"status": "ok", "agent_market_analyst": market_analyst.address}


@app.post("/asi/analyze")
async def analyze(req: AnalyzeRequest):
    try:
        resp = await send_sync_message(
            destination=market_analyst.address,
            message=AnalyzeMarketRequest(
                market_address=req.market_address,
                collection_slug=req.collection_slug,
                include_prediction=req.include_prediction,
            ),
            response_type=None,
            sender=generate_user_address(),
            resolver=None,
            timeout=30,
        )

        # Try common decode paths
        if hasattr(resp, "decode_payload"):
            try:
                payload = resp.decode_payload()
                return json.loads(payload)
            except Exception:
                # Sometimes payload is already a JSON string
                try:
                    return json.loads(str(payload))
                except Exception:
                    return {"error": "Failed to parse agent response payload"}

        # If it's bytes
        if isinstance(resp, (bytes, bytearray)):
            try:
                return json.loads(resp.decode("utf-8"))
            except Exception:
                return {"error": "Failed to decode bytes response from agent"}

        # If it's already a dict
        if isinstance(resp, dict):
            return resp

        # If it's a MsgStatus-like object
        if getattr(resp, 'status', None) is not None:
            return {
                "error": "Agent delivery status",
                "status": getattr(resp, 'status', None),
                "detail": getattr(resp, 'detail', ''),
                "destination": getattr(resp, 'destination', ''),
            }

        # Fallback: return informative error
        return {"error": f"Unexpected response type: {type(resp).__name__}", "value": repr(resp)}
    except Exception as e:
        return {"error": str(e)}

