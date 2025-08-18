from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    prompt = Column(Text)
    scenario = Column(Text)
    scenario_flow = Column(JSON)  # 노드와 엣지 정보를 저장
    stt_module = Column(String(50))
    emotion_module = Column(String(50))
    llm_module = Column(String(50))
    tts_module = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 관계 설정
    conversations = relationship("Conversation", back_populates="agent")

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id"))
    user_message = Column(Text, nullable=False)
    agent_response = Column(Text, nullable=False)
    emotion = Column(String(50))  # 감정 분석 결과
    emotion_scores = Column(JSON)  # 전체 감정 점수
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계 설정
    agent = relationship("Agent", back_populates="conversations")