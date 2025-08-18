from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import schemas, crud
from app.services.scenario_parser import ScenarioParser
from app.services.llm_service import LLMService

router = APIRouter()

@router.post("/parse", response_model=schemas.ScenarioFlow)
def parse_scenario(request: schemas.ScenarioParseRequest, db: Session = Depends(get_db)):
    """텍스트 시나리오를 노드/엣지 구조로 파싱"""
    llm_service = LLMService()
    
    try:
        # 텍스트를 플로우로 변환
        flow = ScenarioParser.parse_text_to_flow(request.text, llm_service)
        
        # agent_id가 제공된 경우 DB 업데이트
        if request.agent_id:
            agent = crud.get_agent(db, agent_id=request.agent_id)
            if not agent:
                raise HTTPException(status_code=404, detail="Agent not found")
            
            # 시나리오 플로우 업데이트
            agent.scenario_flow = flow.dict()
            db.commit()
        
        return flow
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/agents/{agent_id}/flow", response_model=schemas.ScenarioFlow)
def get_agent_scenario_flow(agent_id: int, db: Session = Depends(get_db)):
    """특정 에이전트의 시나리오 플로우 조회"""
    agent = crud.get_agent(db, agent_id=agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    if not agent.scenario_flow:
        # 시나리오 텍스트가 있으면 파싱 시도
        if agent.scenario:
            llm_service = LLMService()
            flow = ScenarioParser.parse_text_to_flow(agent.scenario, llm_service)
            agent.scenario_flow = flow.dict()
            db.commit()
            return flow
        else:
            # 기본 플로우 반환
            return ScenarioParser.create_default_flow("시나리오가 설정되지 않았습니다.")
    
    return schemas.ScenarioFlow(**agent.scenario_flow)

@router.put("/agents/{agent_id}/flow", response_model=schemas.ScenarioFlow)
def update_agent_scenario_flow(
    agent_id: int,
    flow: schemas.ScenarioFlow,
    db: Session = Depends(get_db)
):
    """에이전트의 시나리오 플로우 업데이트"""
    agent = crud.get_agent(db, agent_id=agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    agent.scenario_flow = flow.dict()
    db.commit()
    db.refresh(agent)
    
    return flow