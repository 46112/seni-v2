from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AgentBase(BaseModel):
    name: str
    description: str
    prompt: Optional[str] = None
    scenario: Optional[str] = None
    stt_module: Optional[str] = None
    emotion_module: Optional[str] = None
    llm_module: Optional[str] = None
    tts_module: Optional[str] = None

class AgentCreate(AgentBase):
    pass

class AgentUpdate(AgentBase):
    name: Optional[str] = None
    description: Optional[str] = None

class Agent(AgentBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True