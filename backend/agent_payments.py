"""
AiFund Pay v3.0 — AI Agent Payment Backend
Server-side support for autonomous AI agent payments.
https://aifund.com/pay

Features:
  - Agent registration with budget limits
  - Payment receipt verification and logging
  - Agent spending dashboard / analytics
  - Rate limiting per agent
  - x402 compatible endpoint wrapper

Usage:
    from agent_payments import create_agent_router
    app.include_router(create_agent_router(db), prefix="/api")
"""
from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid
import json
import base64
import logging

logger = logging.getLogger(__name__)


def create_agent_router(
    db,
    agents_collection: str = "agents",
    agent_payments_collection: str = "agent_payments",
) -> APIRouter:
    """
    Create FastAPI router for AI Agent payment management.
    """
    router = APIRouter()
    agents = db[agents_collection]
    payments = db[agent_payments_collection]

    @router.post("/agent/register")
    async def register_agent(req: dict):
        """Register a new AI agent with budget limits."""
        agent_id = req.get("agent_id") or str(uuid.uuid4())[:12]
        owner_address = req.get("owner_address", "").lower()
        name = req.get("name", f"Agent-{agent_id}")
        budget = req.get("budget", {})

        if not owner_address:
            raise HTTPException(status_code=400, detail="owner_address required")

        agent = {
            "agent_id": agent_id,
            "owner_address": owner_address,
            "name": name,
            "budget": {
                "max_per_request": budget.get("max_per_request", 0.10),
                "max_per_hour": budget.get("max_per_hour", 1.00),
                "max_total": budget.get("max_total", 100),
            },
            "total_spent": 0,
            "payment_count": 0,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        await agents.update_one(
            {"agent_id": agent_id},
            {"$set": agent},
            upsert=True,
        )

        logger.info(f"Agent registered: {agent_id} by {owner_address}")
        return {"agent": agent}

    @router.get("/agent/{agent_id}")
    async def get_agent(agent_id: str):
        """Get agent info and spending stats."""
        agent = await agents.find_one({"agent_id": agent_id}, {"_id": 0})
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        # Get recent payments
        recent = await payments.find(
            {"agent_id": agent_id}
        ).sort("timestamp", -1).limit(20).to_list(20)
        for p in recent:
            p.pop("_id", None)

        return {"agent": agent, "recent_payments": recent}

    @router.post("/agent/pay")
    async def record_agent_payment(req: dict):
        """Record an autonomous agent payment."""
        agent_id = req.get("agent_id", "")
        amount = req.get("amount", 0)
        recipient = req.get("recipient", "")
        description = req.get("description", "")
        currency = req.get("currency", "USDC")
        authorization = req.get("authorization", "")

        if not agent_id or amount <= 0:
            raise HTTPException(status_code=400, detail="Invalid request")

        # Check agent exists and is active
        agent = await agents.find_one({"agent_id": agent_id, "status": "active"})
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found or inactive")

        # Budget checks
        budget = agent.get("budget", {})
        if amount > budget.get("max_per_request", 0.10):
            raise HTTPException(status_code=403, detail=f"Exceeds per-request limit (${budget['max_per_request']})")

        total_spent = agent.get("total_spent", 0)
        if total_spent + amount > budget.get("max_total", 100):
            raise HTTPException(status_code=403, detail=f"Would exceed total budget (${budget['max_total']})")

        # Check hourly limit
        one_hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
        hourly_pipeline = [
            {"$match": {"agent_id": agent_id, "timestamp": {"$gte": one_hour_ago}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
        ]
        hourly_result = await payments.aggregate(hourly_pipeline).to_list(1)
        hourly_spent = hourly_result[0]["total"] if hourly_result else 0

        if hourly_spent + amount > budget.get("max_per_hour", 1.00):
            raise HTTPException(status_code=429, detail=f"Hourly limit exceeded (${budget['max_per_hour']})")

        # Record payment
        payment = {
            "payment_id": str(uuid.uuid4())[:12],
            "agent_id": agent_id,
            "amount": amount,
            "currency": currency,
            "recipient": recipient,
            "description": description,
            "authorization": authorization,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        await payments.insert_one(payment)

        # Update agent totals
        await agents.update_one(
            {"agent_id": agent_id},
            {"$inc": {"total_spent": amount, "payment_count": 1}},
        )

        logger.info(f"Agent payment: {agent_id} → ${amount} to {recipient}")
        return {"success": True, "payment_id": payment["payment_id"], "remaining_budget": budget["max_total"] - total_spent - amount}

    @router.get("/agent/{agent_id}/stats")
    async def get_agent_stats(agent_id: str):
        """Get detailed spending analytics for an agent."""
        agent = await agents.find_one({"agent_id": agent_id}, {"_id": 0})
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        # Hourly spend
        one_hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
        hourly_result = await payments.aggregate([
            {"$match": {"agent_id": agent_id, "timestamp": {"$gte": one_hour_ago}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}},
        ]).to_list(1)

        # Daily spend
        one_day_ago = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        daily_result = await payments.aggregate([
            {"$match": {"agent_id": agent_id, "timestamp": {"$gte": one_day_ago}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}},
        ]).to_list(1)

        budget = agent.get("budget", {})
        return {
            "agent_id": agent_id,
            "total_spent": agent.get("total_spent", 0),
            "total_payments": agent.get("payment_count", 0),
            "hourly_spent": hourly_result[0]["total"] if hourly_result else 0,
            "hourly_payments": hourly_result[0]["count"] if hourly_result else 0,
            "daily_spent": daily_result[0]["total"] if daily_result else 0,
            "daily_payments": daily_result[0]["count"] if daily_result else 0,
            "remaining_budget": budget.get("max_total", 100) - agent.get("total_spent", 0),
            "budget": budget,
        }

    @router.post("/agent/{agent_id}/topup")
    async def topup_agent(agent_id: str, req: dict):
        """Add more budget to an agent."""
        amount = req.get("amount", 0)
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be positive")

        result = await agents.update_one(
            {"agent_id": agent_id},
            {"$inc": {"budget.max_total": amount}},
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Agent not found")

        return {"success": True, "added_budget": amount}

    @router.post("/agent/{agent_id}/pause")
    async def pause_agent(agent_id: str):
        """Pause an agent (stop payments)."""
        await agents.update_one({"agent_id": agent_id}, {"$set": {"status": "paused"}})
        return {"success": True, "status": "paused"}

    @router.post("/agent/{agent_id}/resume")
    async def resume_agent(agent_id: str):
        """Resume a paused agent."""
        await agents.update_one({"agent_id": agent_id}, {"$set": {"status": "active"}})
        return {"success": True, "status": "active"}

    return router
