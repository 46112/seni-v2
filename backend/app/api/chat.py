from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import os
import tempfile
import uuid
from app import crud
from app.database import get_db
from app.models import Conversation
try:
    from app.services.stt_service import STTService
    from app.services.emotion_service import EmotionService
    from app.services.llm_service import LLMService
    from app.services.tts_service import TTSService
except ImportError:
    # 임시로 더미 클래스 사용
    class STTService:
        def __init__(self, service_type): pass
        async def speech_to_text(self, path): return "테스트 음성 인식 결과"
    
    class EmotionService:
        def __init__(self, service_type): pass
        async def analyze_emotion(self, text): return "긍정"
    
    class LLMService:
        def __init__(self, service_type): pass
        def generate_response(self, message, system_prompt, emotion=None): 
            return f"안녕하세요! '{message}'에 대한 응답입니다."
    
    class TTSService:
        def __init__(self, service_type): pass
        async def text_to_speech(self, text): return None

router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatRequest(BaseModel):
    message: str
    use_tts: bool = True

class ChatResponse(BaseModel):
    response: str
    emotion: Optional[str] = None
    audio_url: Optional[str] = None

class GreetingResponse(BaseModel):
    greeting: str
    emotion: Optional[str] = None

@router.get("/{agent_id}/greeting", response_model=GreetingResponse)
async def get_agent_greeting(
    agent_id: int,
    db: Session = Depends(get_db)
):
    # 에이전트 정보 조회
    agent = crud.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    try:
        # LLM을 통한 맞춤형 인사말 생성
        llm_service = LLMService(agent.llm_module)
        
        # 시스템 프롬프트와 시나리오 조합
        system_prompt = agent.prompt or "당신은 도움이 되는 AI 어시스턴트입니다."
        if agent.scenario:
            system_prompt += f"\n\n시나리오: {agent.scenario}"
        
        # 인사말 생성을 위한 프롬프트
        greeting_prompt = "사용자가 처음 대화를 시작했습니다. 당신의 성격과 역할에 맞는 짧은 인사말을 한 문장으로 해주세요. 자기소개와 함께 도움을 제공할 준비가 되었음을 알려주세요."
        
        greeting_text = llm_service.generate_response(
            message=greeting_prompt,
            system_prompt=system_prompt,
            emotion=None
        )
        
        return GreetingResponse(
            greeting=greeting_text,
            emotion=None
        )
        
    except Exception as e:
        print(f"Greeting generation error: {e}")
        # 에러 발생시 기본 인사말 반환
        return GreetingResponse(
            greeting=f"안녕하세요! {agent.name}입니다. 무엇을 도와드릴까요?",
            emotion=None
        )

@router.post("/{agent_id}", response_model=ChatResponse)
async def chat_with_agent(
    agent_id: int, 
    request: ChatRequest, 
    db: Session = Depends(get_db)
):
    # 에이전트 정보 조회
    agent = crud.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    try:
        # 1. 감정 인식 (텍스트 기반)
        emotion = None
        emotion_scores = None
        if agent.emotion_module:
            emotion_service = EmotionService(agent.emotion_module)
            emotion, emotion_scores = await emotion_service.analyze_emotion(request.message)
        
        # 2. LLM을 통한 응답 생성
        llm_service = LLMService(agent.llm_module)
        
        # 시스템 프롬프트와 시나리오 조합
        system_prompt = agent.prompt or "당신은 도움이 되는 AI 어시스턴트입니다."
        if agent.scenario:
            system_prompt += f"\n\n시나리오: {agent.scenario}"
        
        response_text = llm_service.generate_response(
            message=request.message,
            system_prompt=system_prompt,
            emotion=emotion
        )
        
        # 3. 대화 내역 DB에 저장
        conversation = Conversation(
            agent_id=agent_id,
            user_message=request.message,
            agent_response=response_text,
            emotion=emotion,
            emotion_scores=emotion_scores
        )
        db.add(conversation)
        db.commit()
        
        # 4. TTS 음성 생성
        audio_url = None
        if request.use_tts and agent.tts_module:
            tts_service = TTSService(agent.tts_module)
            audio_url = await tts_service.text_to_speech(response_text)
        
        return ChatResponse(
            response=response_text,
            emotion=emotion,
            audio_url=audio_url
        )
        
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="대화 처리 중 오류가 발생했습니다.")

@router.post("/voice/{agent_id}")
async def chat_with_voice(
    agent_id: int,
    audio: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # 에이전트 정보 조회
    agent = crud.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    try:
        # 1. STT - 음성을 텍스트로 변환
        stt_service = STTService(agent.stt_module)
        
        # 임시 파일로 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
            content = await audio.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            transcribed_text = await stt_service.speech_to_text(tmp_file_path)
        finally:
            # 임시 파일 삭제
            os.unlink(tmp_file_path)
        
        # 2. 감정 인식
        emotion = None
        if agent.emotion_module:
            emotion_service = EmotionService(agent.emotion_module)
            emotion = await emotion_service.analyze_emotion(transcribed_text)
        
        # 3. LLM 응답 생성
        llm_service = LLMService(agent.llm_module)
        system_prompt = agent.prompt or "당신은 도움이 되는 AI 어시스턴트입니다."
        if agent.scenario:
            system_prompt += f"\n\n시나리오: {agent.scenario}"
        
        response_text = llm_service.generate_response(
            message=transcribed_text,
            system_prompt=system_prompt,
            emotion=emotion
        )
        
        # 4. TTS 음성 생성
        audio_url = None
        if agent.tts_module:
            tts_service = TTSService(agent.tts_module)
            audio_url = await tts_service.text_to_speech(response_text)
        
        return {
            "transcribed_text": transcribed_text,
            "response": response_text,
            "emotion": emotion,
            "audio_url": audio_url
        }
        
    except Exception as e:
        print(f"Voice chat error: {e}")
        raise HTTPException(status_code=500, detail="음성 대화 처리 중 오류가 발생했습니다.")