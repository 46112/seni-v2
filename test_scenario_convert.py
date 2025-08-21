#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:8000"

def test_scenario_conversion():
    """시나리오 텍스트를 노드/엣지로 변환 테스트"""
    
    test_scenarios = [
        {
            "name": "간단한 대화",
            "text": """
            1. 상점 주인이 인사를 합니다: "어서오세요! 무엇을 도와드릴까요?"
            2. 손님이 물건을 고릅니다
            3. 가격 협상을 합니다
            4. 구매하거나 떠납니다
            """,
            "llm": "gpt"
        },
        {
            "name": "던전 시나리오",
            "text": """
            던전 입구에서 시작합니다.
            플레이어가 들어가면 고블린 3마리가 나타납니다.
            
            선택지:
            - 전투: 고블린과 싸웁니다. 승리하면 보물상자 발견
            - 도망: 던전 입구로 돌아갑니다
            - 대화: 고블린과 대화를 시도합니다. 성공하면 비밀 통로 정보 획득
            
            보물상자에는 금화 100개와 마법 검이 있습니다.
            비밀 통로로 가면 보스방으로 직행합니다.
            """,
            "llm": "claude"
        },
        {
            "name": "감정 기반 대화",
            "text": """
            AI 상담사가 사용자의 감정을 파악합니다.
            
            기쁨 감정일 때: "오늘 기분이 좋으시네요! 좋은 일이 있으셨나요?"
            슬픔 감정일 때: "힘드신 일이 있으신 것 같네요. 이야기 들어드릴게요."
            분노 감정일 때: "화가 나신 것 같네요. 천천히 깊게 숨을 쉬어보세요."
            
            대화를 진행하며 공감하고 조언을 제공합니다.
            대화 종료 시 기분이 나아졌는지 확인합니다.
            """,
            "llm": "gemini"
        }
    ]
    
    for scenario in test_scenarios:
        print(f"\n{'='*60}")
        print(f"테스트: {scenario['name']} (LLM: {scenario['llm']})")
        print(f"{'='*60}")
        print(f"입력 시나리오:\n{scenario['text']}")
        print(f"{'-'*60}")
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/scenario/convert-to-flow",
                json={
                    "scenario_text": scenario['text'],
                    "llm_module": scenario['llm']
                }
            )
            
            if response.status_code == 200:
                flow = response.json()
                
                print(f"✅ 변환 성공!")
                print(f"\n📊 노드 ({len(flow['nodes'])}개):")
                for node in flow['nodes']:
                    print(f"  - [{node['type']}] {node['data'].get('label', 'No label')}")
                    if node['data'].get('message'):
                        print(f"    메시지: {node['data']['message'][:50]}...")
                    if node['data'].get('options'):
                        print(f"    선택지: {', '.join(node['data']['options'])}")
                
                print(f"\n🔗 엣지 ({len(flow['edges'])}개):")
                for edge in flow['edges']:
                    label = f" ({edge['label']})" if edge.get('label') else ""
                    print(f"  - {edge['source']} → {edge['target']}{label}")
                
            else:
                print(f"❌ 변환 실패: {response.status_code}")
                print(f"오류: {response.text}")
                
        except Exception as e:
            print(f"❌ 요청 실패: {e}")
    
    print(f"\n{'='*60}")
    print("테스트 완료!")
    print(f"{'='*60}")

if __name__ == "__main__":
    test_scenario_conversion()