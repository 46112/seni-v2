#!/usr/bin/env python3
import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_scenario_flow():
    """시나리오 플로우 자동 변환 테스트"""
    
    # 1. 에이전트 생성 (시나리오 포함)
    agent_data = {
        "name": "던전 마스터",
        "description": "D&D 던전 마스터 역할을 하는 AI",
        "prompt": "당신은 경험 많은 던전 마스터입니다. 플레이어의 선택에 따라 이야기를 진행하세요.",
        "scenario": """
        던전 입구에서 시작합니다.
        플레이어가 들어가면 첫 번째 방에 도착합니다.
        
        첫 번째 방: 고블린 3마리가 있습니다.
        - 전투: 고블린과 싸웁니다. 승리하면 10골드와 체력 포션 획득
        - 은신: 몰래 지나갑니다. 성공하면 다음 방으로
        - 대화: 고블린과 대화를 시도합니다. 성공하면 정보 획득
        
        두 번째 방: 함정이 있는 복도
        - 함정 해제: 기술 체크. 성공하면 안전하게 통과
        - 우회: 다른 길로 돌아갑니다. 시간이 더 걸림
        
        보스방: 오크 족장
        - 전투로 승리하면 보물 획득
        - 협상으로 해결하면 동료가 됨
        """,
        "stt_module": "openai",
        "emotion_module": "hume",
        "llm_module": "gpt",
        "tts_module": "browser"
    }
    
    print("1. 에이전트 생성 중...")
    response = requests.post(f"{BASE_URL}/api/agents/", json=agent_data)
    
    if response.status_code == 200:
        agent = response.json()
        print(f"✅ 에이전트 생성 성공: ID={agent['id']}")
        print(f"   이름: {agent['name']}")
        print(f"   시나리오: {agent['scenario'][:100]}...")
        
        # 2. 시나리오 자동 변환 확인
        print("\n2. 시나리오 변환 테스트...")
        time.sleep(2)  # API 처리 대기
        
        # 에이전트 정보 다시 조회
        response = requests.get(f"{BASE_URL}/api/agents/{agent['id']}")
        if response.status_code == 200:
            updated_agent = response.json()
            
            if updated_agent.get('scenario_flow'):
                flow = updated_agent['scenario_flow']
                print(f"✅ scenario_flow 존재: {len(flow.get('nodes', []))} 노드, {len(flow.get('edges', []))} 엣지")
                
                print("\n📊 노드 목록:")
                for node in flow.get('nodes', []):
                    print(f"   - [{node.get('type')}] {node.get('data', {}).get('label', 'No label')}")
                    
                print("\n🔗 엣지 목록:")
                for edge in flow.get('edges', []):
                    print(f"   - {edge['source']} → {edge['target']}")
            else:
                print("⚠️ scenario_flow가 아직 생성되지 않았습니다.")
                
                # 수동으로 변환 시도
                print("\n3. 수동 변환 시도...")
                convert_response = requests.post(
                    f"{BASE_URL}/api/scenario/convert-to-flow",
                    json={
                        "scenario_text": agent_data['scenario'],
                        "llm_module": "gpt"
                    }
                )
                
                if convert_response.status_code == 200:
                    flow = convert_response.json()
                    print(f"✅ 변환 성공: {len(flow['nodes'])} 노드, {len(flow['edges'])} 엣지")
                    
                    # 변환된 플로우 저장
                    update_response = requests.put(
                        f"{BASE_URL}/api/agents/{agent['id']}",
                        json={"scenario_flow": flow}
                    )
                    
                    if update_response.status_code == 200:
                        print("✅ scenario_flow 저장 완료")
                    else:
                        print(f"❌ 저장 실패: {update_response.status_code}")
                else:
                    print(f"❌ 변환 실패: {convert_response.status_code}")
        else:
            print(f"❌ 에이전트 조회 실패: {response.status_code}")
            
        print(f"\n💡 브라우저에서 확인: http://localhost:5173/scenario/{agent['id']}")
        
    else:
        print(f"❌ 에이전트 생성 실패: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    test_scenario_flow()