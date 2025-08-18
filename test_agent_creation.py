#!/usr/bin/env python3
import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_agent_creation():
    """에이전트 생성 테스트"""
    
    test_agents = [
        {
            "name": "GPT 테스트 에이전트",
            "description": "OpenAI GPT를 사용하는 테스트 에이전트",
            "prompt": "당신은 친절하고 도움이 되는 AI 어시스턴트입니다.",
            "scenario": "사용자의 질문에 최선을 다해 답변합니다.",
            "stt_module": "openai",
            "emotion_module": "hume", 
            "llm_module": "gpt",
            "tts_module": "browser"
        },
        {
            "name": "Claude 테스트 에이전트",
            "description": "Anthropic Claude를 사용하는 테스트 에이전트",
            "prompt": "당신은 창의적이고 분석적인 AI 어시스턴트입니다.",
            "scenario": "복잡한 문제를 단계별로 분석하여 해결합니다.",
            "stt_module": "openai",
            "emotion_module": "hume",
            "llm_module": "claude",
            "tts_module": "browser"
        },
        {
            "name": "Gemini 테스트 에이전트",
            "description": "Google Gemini를 사용하는 테스트 에이전트",
            "prompt": "당신은 다양한 관점에서 생각하는 AI 어시스턴트입니다.",
            "scenario": "창의적이고 혁신적인 아이디어를 제공합니다.",
            "stt_module": "openai",
            "emotion_module": "hume",
            "llm_module": "gemini",
            "tts_module": "browser"
        }
    ]
    
    created_agents = []
    
    for agent_data in test_agents:
        print(f"\n=== {agent_data['name']} 생성 중 ===")
        
        try:
            # 에이전트 생성
            response = requests.post(
                f"{BASE_URL}/api/agents/",
                json=agent_data
            )
            
            if response.status_code == 200:
                agent = response.json()
                created_agents.append(agent)
                print(f"✅ 생성 성공: ID={agent['id']}")
            else:
                print(f"❌ 생성 실패: {response.status_code}")
                print(f"   오류: {response.text}")
                
        except Exception as e:
            print(f"❌ 요청 실패: {e}")
    
    return created_agents

def test_chat_with_agent(agent_id: int, message: str):
    """에이전트와 채팅 테스트"""
    print(f"\n=== 에이전트 {agent_id}와 채팅 테스트 ===")
    print(f"메시지: {message}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/chat/{agent_id}",
            json={
                "message": message,
                "use_tts": False
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 응답: {data['response']}")
            if data.get('emotion'):
                print(f"   감정: {data['emotion']}")
            return True
        else:
            print(f"❌ 채팅 실패: {response.status_code}")
            print(f"   오류: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ 요청 실패: {e}")
        return False

def main():
    print("=" * 50)
    print("에이전트 생성 및 모듈 검증 테스트")
    print("=" * 50)
    
    # 1. 에이전트 생성 테스트
    print("\n[1단계] 에이전트 생성")
    created_agents = test_agent_creation()
    
    if not created_agents:
        print("\n⚠️ 생성된 에이전트가 없습니다. 테스트를 종료합니다.")
        return
    
    # 2. 각 에이전트와 채팅 테스트
    print("\n[2단계] 각 모듈 검증 (채팅 테스트)")
    
    test_messages = [
        "안녕하세요! 오늘 날씨가 좋네요.",
        "파이썬에서 리스트와 튜플의 차이점은 무엇인가요?",
        "행복한 하루 보내세요!"
    ]
    
    for agent in created_agents:
        for message in test_messages[:1]:  # 각 에이전트당 1개 메시지만 테스트
            success = test_chat_with_agent(agent['id'], message)
            if success:
                print(f"   → {agent['name']} 정상 작동 ✅")
            else:
                print(f"   → {agent['name']} 오류 발생 ❌")
            time.sleep(1)  # API 부하 방지
    
    print("\n" + "=" * 50)
    print("테스트 완료!")
    print("=" * 50)
    
    # 결과 요약
    print("\n[결과 요약]")
    print(f"생성된 에이전트: {len(created_agents)}개")
    for agent in created_agents:
        print(f"  - {agent['name']} (ID: {agent['id']})")
        print(f"    LLM: {agent['llm_module']}")
        print(f"    STT: {agent['stt_module']}")
        print(f"    감정: {agent['emotion_module']}")
        print(f"    TTS: {agent['tts_module']}")

if __name__ == "__main__":
    main()