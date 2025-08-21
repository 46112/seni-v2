from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
from app.services.llm_service import LLMService

router = APIRouter()

class ScenarioConvertRequest(BaseModel):
    scenario_text: str
    llm_module: str = "gpt"  # 기본값으로 GPT 사용

class Node(BaseModel):
    id: str
    type: str = "default"
    position: Dict[str, float]
    data: Dict[str, Any]

class Edge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    type: str = "smoothstep"
    animated: bool = False

class ScenarioFlowResponse(BaseModel):
    nodes: List[Node]
    edges: List[Edge]

@router.post("/convert-to-flow", response_model=ScenarioFlowResponse)
async def convert_scenario_to_flow(request: ScenarioConvertRequest):
    """텍스트 시나리오를 노드/엣지 구조로 변환"""
    
    try:
        llm_service = LLMService(request.llm_module)
        
        # LLM에게 시나리오를 분석하고 노드/엣지 구조로 변환 요청
        system_prompt = """당신은 대화 시나리오를 분석하여 플로우 차트 구조로 변환하는 전문가입니다.
        
주어진 시나리오를 다음 JSON 구조로 변환해주세요:
{
    "nodes": [
        {
            "id": "node-1",
            "type": "start",
            "position": {"x": 100, "y": 100},
            "data": {"label": "시작", "description": "대화 시작점"}
        },
        {
            "id": "node-2", 
            "type": "dialog",
            "position": {"x": 100, "y": 200},
            "data": {"label": "인사", "message": "안녕하세요!", "speaker": "agent"}
        },
        {
            "id": "node-3",
            "type": "decision",
            "position": {"x": 100, "y": 300},
            "data": {"label": "사용자 응답", "options": ["긍정", "부정", "중립"]}
        }
    ],
    "edges": [
        {"id": "edge-1", "source": "node-1", "target": "node-2", "label": ""},
        {"id": "edge-2", "source": "node-2", "target": "node-3", "label": "대화 진행"}
    ]
}

노드 타입:
- start: 시작점
- dialog: 대화 노드 (agent 또는 user의 발화)
- decision: 분기점 (여러 선택지)
- action: 행동/이벤트
- end: 종료점

노드는 위에서 아래로, 적절한 간격(100-150px)으로 배치하세요.
복잡한 분기는 좌우로 펼쳐서 배치하세요.

중요: 반드시 유효한 JSON만 반환하세요. 설명이나 주석 없이 JSON만 출력하세요."""

        user_message = f"다음 시나리오를 플로우 차트 구조로 변환해주세요:\n\n{request.scenario_text}"
        
        response = llm_service.generate_response(
            message=user_message,
            system_prompt=system_prompt
        )
        
        # JSON 파싱 시도
        try:
            # 응답에서 JSON 부분만 추출 (```json 태그 제거)
            json_str = response
            if "```json" in json_str:
                json_str = json_str.split("```json")[1].split("```")[0]
            elif "```" in json_str:
                json_str = json_str.split("```")[1].split("```")[0]
            
            flow_data = json.loads(json_str.strip())
            
            # 응답 형식 검증 및 정리
            nodes = []
            for node in flow_data.get("nodes", []):
                nodes.append(Node(
                    id=node["id"],
                    type=node.get("type", "default"),
                    position=node["position"],
                    data=node["data"]
                ))
            
            edges = []
            for edge in flow_data.get("edges", []):
                edges.append(Edge(
                    id=edge["id"],
                    source=edge["source"],
                    target=edge["target"],
                    label=edge.get("label", ""),
                    type=edge.get("type", "smoothstep"),
                    animated=edge.get("animated", False)
                ))
            
            return ScenarioFlowResponse(nodes=nodes, edges=edges)
            
        except json.JSONDecodeError as e:
            print(f"JSON 파싱 오류: {e}")
            print(f"응답: {response}")
            
            # 기본 구조 반환
            return ScenarioFlowResponse(
                nodes=[
                    Node(
                        id="node-1",
                        type="start",
                        position={"x": 250, "y": 50},
                        data={"label": "시작", "description": "시나리오 시작"}
                    ),
                    Node(
                        id="node-2",
                        type="dialog",
                        position={"x": 250, "y": 150},
                        data={"label": "대화", "message": request.scenario_text[:100]}
                    ),
                    Node(
                        id="node-3",
                        type="end",
                        position={"x": 250, "y": 250},
                        data={"label": "종료"}
                    )
                ],
                edges=[
                    Edge(id="edge-1", source="node-1", target="node-2"),
                    Edge(id="edge-2", source="node-2", target="node-3")
                ]
            )
            
    except Exception as e:
        print(f"시나리오 변환 오류: {e}")
        raise HTTPException(status_code=500, detail="시나리오 변환 중 오류가 발생했습니다.")

@router.post("/optimize-flow")
async def optimize_flow(flow_data: ScenarioFlowResponse):
    """노드 위치 자동 정렬 및 최적화"""
    
    try:
        nodes = flow_data.nodes
        edges = flow_data.edges
        
        # 노드 간 연결 관계 분석
        node_map = {node.id: node for node in nodes}
        connections = {node.id: {"in": [], "out": []} for node in nodes}
        
        for edge in edges:
            connections[edge.source]["out"].append(edge.target)
            connections[edge.target]["in"].append(edge.source)
        
        # 시작 노드 찾기
        start_nodes = [node_id for node_id, conn in connections.items() if len(conn["in"]) == 0]
        if not start_nodes:
            start_nodes = [nodes[0].id] if nodes else []
        
        # 레벨별로 노드 그룹화
        levels = {}
        visited = set()
        
        def assign_level(node_id, level=0):
            if node_id in visited:
                return
            visited.add(node_id)
            
            if level not in levels:
                levels[level] = []
            levels[level].append(node_id)
            
            for next_node in connections[node_id]["out"]:
                assign_level(next_node, level + 1)
        
        for start_node in start_nodes:
            assign_level(start_node)
        
        # 위치 재조정
        y_spacing = 120
        x_spacing = 200
        
        for level, node_ids in levels.items():
            y = 50 + level * y_spacing
            total_width = len(node_ids) * x_spacing
            start_x = 400 - total_width // 2  # 중앙 정렬
            
            for i, node_id in enumerate(node_ids):
                if node_id in node_map:
                    node_map[node_id].position = {
                        "x": start_x + i * x_spacing,
                        "y": y
                    }
        
        return ScenarioFlowResponse(
            nodes=list(node_map.values()),
            edges=edges
        )
        
    except Exception as e:
        print(f"플로우 최적화 오류: {e}")
        raise HTTPException(status_code=500, detail="플로우 최적화 중 오류가 발생했습니다.")