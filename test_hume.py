#!/usr/bin/env python3
import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_hume_emotion():
    """Hume AI 감정 분석 테스트"""
    
    # 테스트용 에이전트 생성
    agent_data = {
        "name": "Hume 테스트 에이전트",
        "description": "Hume AI 감정 분석 테스트용",
        "prompt": "당신은 공감 능력이 뛰어난 AI입니다.",
        "scenario": "사용자의 감정을 이해하고 적절히 반응합니다.",
        "stt_module": "openai",
        "emotion_module": "hume",
        "llm_module": "gpt",
        "tts_module": "browser"
    }
    
    print("=== Hume AI 감정 분석 테스트 ===\n")
    
    # 에이전트 생성
    print("1. 테스트 에이전트 생성 중...")
    response = requests.post(f"{BASE_URL}/api/agents/", json=agent_data)
    
    if response.status_code != 200:
        print(f"❌ 에이전트 생성 실패: {response.status_code}")
        return
    
    agent = response.json()
    agent_id = agent['id']
    print(f"✅ 에이전트 생성 성공: ID={agent_id}\n")
    
    # 다양한 감정이 담긴 테스트 메시지
    test_messages = [
        ("오늘 정말 기분이 좋아요! 좋은 일이 생겼거든요.", "기쁨"),
        ("너무 슬퍼요. 친구와 헤어졌어요.", "슬픔"),
        ("정말 화가 나요! 이건 너무 불공평해요!", "분노"),
        ("무서워요. 어두운 곳이 무서워요.", "두려움"),
        ("깜짝 놀랐어요! 갑자기 나타나지 마세요.", "놀람"),
        ("오늘은 그냥 평범한 하루였어요.", "중립")
    ]
    
    print("2. 감정 분석 테스트 중...\n")
    
    for message, expected_emotion in test_messages:
        print(f"메시지: \"{message}\"")
        print(f"예상 감정: {expected_emotion}")
        
        # 채팅 요청
        chat_response = requests.post(
            f"{BASE_URL}/api/chat/{agent_id}",
            json={
                "message": message,
                "use_tts": False
            }
        )
        
        if chat_response.status_code == 200:
            data = chat_response.json()
            detected_emotion = data.get('emotion', '감지 안됨')
            print(f"감지된 감정: {detected_emotion}")
            
            if detected_emotion and detected_emotion != '감지 안됨':
                print("✅ 감정 분석 성공")
            else:
                print("⚠️ 감정이 감지되지 않음")
        else:
            print(f"❌ 채팅 실패: {chat_response.status_code}")
        
        print("-" * 50)
        time.sleep(1)  # API 부하 방지
    
    print("\n=== 테스트 완료 ===")

if __name__ == "__main__":
    test_hume_emotion()