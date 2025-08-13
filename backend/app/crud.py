from sqlalchemy.orm import Session
from app import models, schemas
from typing import List, Optional

def get_agent(db: Session, agent_id: int) -> Optional[models.Agent]:
    return db.query(models.Agent).filter(models.Agent.id == agent_id).first()

def get_agents(db: Session, skip: int = 0, limit: int = 100) -> List[models.Agent]:
    return db.query(models.Agent).offset(skip).limit(limit).all()

def create_agent(db: Session, agent: schemas.AgentCreate) -> models.Agent:
    db_agent = models.Agent(**agent.dict())
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent

def update_agent(db: Session, agent_id: int, agent: schemas.AgentUpdate) -> Optional[models.Agent]:
    db_agent = get_agent(db, agent_id)
    if db_agent:
        update_data = agent.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_agent, field, value)
        db.commit()
        db.refresh(db_agent)
    return db_agent

def delete_agent(db: Session, agent_id: int) -> bool:
    db_agent = get_agent(db, agent_id)
    if db_agent:
        db.delete(db_agent)
        db.commit()
        return True
    return False