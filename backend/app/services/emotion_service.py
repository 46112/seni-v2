import os
import httpx
from typing import Optional, Dict, Any
import json
import base64

class EmotionService:
    def __init__(self, service_type: str):
        self.service_type = service_type
        
    async def analyze_emotion(self, text: str) -> tuple[Optional[str], Optional[Dict[str, float]]]:
        """텍스트에서 감정을 분석하고 주요 감정과 전체 점수를 반환"""
        if self.service_type == "hume":
            return await self._hume_emotion(text)
        elif self.service_type == "mago":
            return await self._mago_emotion(text)
        else:
            raise ValueError(f"Unsupported emotion service: {self.service_type}")
    
    async def _hume_emotion(self, text: str) -> tuple[Optional[str], Optional[Dict[str, float]]]:
        """Hume AI Expression Measurement API - 실시간 감정 분석"""
        api_key = os.getenv("HUME_API_KEY")
        secret_key = os.getenv("HUME_SECRET_KEY")
        
        if not api_key:
            print("Hume API key not found")
            return None, None
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # 1. 먼저 액세스 토큰 획득
                access_token = None
                if secret_key:
                    # Basic Auth를 사용한 토큰 요청
                    auth_string = f"{api_key}:{secret_key}"
                    auth_header = base64.b64encode(auth_string.encode()).decode()
                    
                    token_response = await client.post(
                        "https://api.hume.ai/v0/auth/token",
                        headers={
                            "Authorization": f"Basic {auth_header}",
                            "Content-Type": "application/x-www-form-urlencoded"
                        },
                        data={"grant_type": "client_credentials"}
                    )
                    
                    if token_response.status_code == 200:
                        token_data = token_response.json()
                        access_token = token_data.get("access_token")
                    else:
                        print(f"Failed to get Hume access token: {token_response.status_code}, {token_response.text}")
                        # API Key로 fallback
                        headers = {
                            "X-Hume-Api-Key": api_key,
                            "Content-Type": "application/json"
                        }
                else:
                    # API Key만 사용
                    headers = {
                        "X-Hume-Api-Key": api_key,
                        "Content-Type": "application/json"
                    }
                
                # 2. 액세스 토큰을 사용하여 감정 분석 요청
                if access_token:
                    headers = {
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json"
                    }
                
                # Expression Measurement API 엔드포인트
                response = await client.post(
                    "https://api.hume.ai/v0/batch/jobs",
                    headers=headers,
                    json={
                        "models": {
                            "language": {
                                "granularity": "sentence",
                                "identify_speakers": False
                            }
                        },
                        "text": [text],
                        "notify": False
                    }
                )
                
                if response.status_code == 200 or response.status_code == 201:
                    result = response.json()
                    
                    # 즉시 결과가 반환되는 경우 (동기 처리)
                    if "predictions" in result:
                        return self._parse_hume_predictions(result["predictions"])
                    
                    # Job ID가 반환되는 경우 (비동기 처리)
                    elif "job_id" in result:
                        job_id = result["job_id"]
                        
                        # Job 상태 확인 및 결과 가져오기
                        import asyncio
                        for _ in range(10):  # 최대 10초 대기
                            await asyncio.sleep(1)
                            
                            status_response = await client.get(
                                f"https://api.hume.ai/v0/batch/jobs/{job_id}",
                                headers=headers
                            )
                            
                            if status_response.status_code == 200:
                                status_data = status_response.json()
                                
                                if status_data.get("state", {}).get("status") == "COMPLETED":
                                    # 예측 결과 가져오기
                                    pred_response = await client.get(
                                        f"https://api.hume.ai/v0/batch/jobs/{job_id}/predictions",
                                        headers=headers
                                    )
                                    
                                    if pred_response.status_code == 200:
                                        predictions = pred_response.json()
                                        return self._parse_hume_predictions(predictions)
                                    break
                                elif status_data.get("state", {}).get("status") == "FAILED":
                                    print(f"Hume job failed: {status_data}")
                                    break
                    
                    return "중립", {}
                    
                else:
                    print(f"Hume API error: {response.status_code}, {response.text}")
                    return None, None
                    
        except Exception as e:
            print(f"Hume emotion analysis error: {e}")
            return None, None
    
    def _parse_hume_predictions(self, predictions_data):
        """Hume AI 예측 결과 파싱"""
        try:
            if isinstance(predictions_data, list) and len(predictions_data) > 0:
                first_result = predictions_data[0]
                
                # 다양한 응답 구조 처리
                if "results" in first_result:
                    predictions = first_result["results"].get("predictions", [])
                elif "predictions" in first_result:
                    predictions = first_result["predictions"]
                else:
                    return "중립", {}
                
                if predictions and len(predictions) > 0:
                    pred = predictions[0]
                    
                    # 감정 데이터 추출
                    emotions = None
                    if "models" in pred and "language" in pred["models"]:
                        lang_data = pred["models"]["language"]
                        if "grouped_predictions" in lang_data:
                            grouped = lang_data["grouped_predictions"]
                            if grouped and len(grouped) > 0:
                                emotions = grouped[0].get("predictions", [{}])[0].get("emotions", [])
                        elif "predictions" in lang_data:
                            lang_preds = lang_data["predictions"]
                            if lang_preds and len(lang_preds) > 0:
                                emotions = lang_preds[0].get("emotions", [])
                    elif "emotions" in pred:
                        emotions = pred["emotions"]
                    
                    if emotions:
                        # 감정 점수 딕셔너리 생성
                        emotion_scores = {e["name"]: e["score"] for e in emotions}
                        
                        # 가장 높은 점수의 감정 찾기
                        top_emotion = max(emotions, key=lambda x: x["score"])
                        emotion_name = top_emotion["name"]
                        
                        # 한국어 감정 매핑
                        emotion_map = {
                            "Joy": "기쁨",
                            "Sadness": "슬픔",
                            "Anger": "분노",
                            "Fear": "두려움",
                            "Surprise": "놀람",
                            "Disgust": "혐오",
                            "Contempt": "경멸",
                            "Shame": "수치심",
                            "Guilt": "죄책감",
                            "Pride": "자부심",
                            "Embarrassment": "당황",
                            "Amusement": "즐거움",
                            "Interest": "관심",
                            "Calmness": "평온",
                            "Calm": "평온",
                            "Confusion": "혼란",
                            "Disappointment": "실망",
                            "Love": "사랑",
                            "Admiration": "감탄",
                            "Sympathy": "동정",
                            "Satisfaction": "만족",
                            "Excitement": "흥분",
                            "Awe": "경외",
                            "Boredom": "지루함",
                            "Concentration": "집중",
                            "Determination": "결단",
                            "Relief": "안도"
                        }
                        
                        main_emotion = emotion_map.get(emotion_name, emotion_name)
                        return main_emotion, emotion_scores
            
            return "중립", {}
            
        except Exception as e:
            print(f"Error parsing Hume predictions: {e}")
            return "중립", {}
    
    async def _mago_emotion(self, text: str) -> tuple[Optional[str], Optional[Dict[str, float]]]:
        """Mago 감정 분석"""
        api_key = os.getenv("MAGO_API_KEY")
        if not api_key:
            print("Mago API key not found")
            return None, None
        
        # Mago API는 현재 구현되지 않음
        print("Mago API is not implemented yet")
        return None, None