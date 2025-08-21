from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class NodeData(BaseModel):
    id: str
    type: str  # 'start', 'dialog', 'decision', 'action', 'end'
    data: Dict[str, Any]
    position: Dict[str, float]

class EdgeData(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    type: Optional[str] = 'default'

class ScenarioFlow(BaseModel):
    nodes: List[NodeData]
    edges: List[EdgeData]

class AgentBase(BaseModel):
    name: str
    description: str
    prompt: Optional[str] = None
    scenario: Optional[str] = None
    scenario_flow: Optional[Dict[str, Any]] = None
    stt_module: Optional[str] = None
    emotion_module: Optional[str] = None
    llm_module: Optional[str] = None
    tts_module: Optional[str] = None

class AgentCreate(AgentBase):
    pass

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    prompt: Optional[str] = None
    scenario: Optional[str] = None
    scenario_flow: Optional[Dict[str, Any]] = None
    stt_module: Optional[str] = None
    emotion_module: Optional[str] = None
    llm_module: Optional[str] = None
    tts_module: Optional[str] = None

class Agent(AgentBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ScenarioParseRequest(BaseModel):
    text: str
    agent_id: Optional[int] = None

class ChatMessage(BaseModel):
    message: str
    agent_id: int