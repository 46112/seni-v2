from typing import Dict, Any, Optional
import json
from app.schemas import ScenarioFlow, NodeData, EdgeData

class ScenarioParser:
    """DM 시나리오 텍스트를 노드/엣지 구조로 변환"""
    
    @staticmethod
    def parse_text_to_flow(text: str, llm_service) -> ScenarioFlow:
        """텍스트를 노드와 엣지로 변환"""
        
        prompt = f"""
        다음 DM 시나리오 텍스트를 분석하여 노드와 엣지로 구성된 플로우차트 구조로 변환해주세요.
        
        시나리오 텍스트:
        {text}
        
        다음 JSON 형식으로 응답해주세요:
        {{
            "nodes": [
                {{
                    "id": "node_1",
                    "type": "start|message|condition|action|end",
                    "label": "노드 레이블",
                    "data": {{
                        "message": "메시지 내용 (message 타입인 경우)",
                        "condition": "조건 내용 (condition 타입인 경우)",
                        "action": "액션 내용 (action 타입인 경우)"
                    }},
                    "position": {{"x": 100, "y": 100}}
                }}
            ],
            "edges": [
                {{
                    "id": "edge_1",
                    "source": "node_1",
                    "target": "node_2",
                    "label": "엣지 레이블 (선택사항)",
                    "type": "default"
                }}
            ]
        }}
        
        노드 타입:
        - start: 시작점
        - message: DM이 전달하는 메시지
        - condition: 조건 분기
        - action: 특정 행동 또는 이벤트
        - end: 종료점
        
        노드는 위에서 아래로, 왼쪽에서 오른쪽으로 자연스럽게 배치해주세요.
        """
        
        try:
            # LLM 서비스를 통해 파싱
            response = llm_service.generate_response(prompt, system_prompt="당신은 시나리오를 플로우차트로 변환하는 전문가입니다. JSON 형식으로만 응답하세요.")
            
            # JSON 파싱
            flow_data = json.loads(response)
            
            # ScenarioFlow 객체로 변환
            nodes = [NodeData(**node) for node in flow_data.get("nodes", [])]
            edges = [EdgeData(**edge) for edge in flow_data.get("edges", [])]
            
            return ScenarioFlow(nodes=nodes, edges=edges)
            
        except Exception as e:
            # 기본 플로우 반환
            return ScenarioParser.create_default_flow(text)
    
    @staticmethod
    def create_default_flow(text: str) -> ScenarioFlow:
        """기본 플로우 생성"""
        nodes = [
            NodeData(
                id="start",
                type="start",
                label="시작",
                data={},
                position={"x": 250, "y": 50}
            ),
            NodeData(
                id="main_scenario",
                type="message",
                label="메인 시나리오",
                data={"message": text[:200] + "..." if len(text) > 200 else text},
                position={"x": 250, "y": 150}
            ),
            NodeData(
                id="end",
                type="end",
                label="종료",
                data={},
                position={"x": 250, "y": 250}
            )
        ]
        
        edges = [
            EdgeData(
                id="edge_1",
                source="start",
                target="main_scenario"
            ),
            EdgeData(
                id="edge_2",
                source="main_scenario",
                target="end"
            )
        ]
        
        return ScenarioFlow(nodes=nodes, edges=edges)