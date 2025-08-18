import os
import tempfile
import uuid
from typing import Optional
from elevenlabs import generate, save
import asyncio

class TTSService:
    def __init__(self, service_type: str):
        self.service_type = service_type
        
    async def text_to_speech(self, text: str) -> Optional[str]:
        """텍스트를 음성으로 변환하고 파일 URL 반환"""
        if self.service_type == "browser":
            # 브라우저 TTS는 프론트엔드에서 처리
            return None
        elif self.service_type == "elevenlabs":
            return await self._elevenlabs_tts(text)
        else:
            raise ValueError(f"Unsupported TTS service: {self.service_type}")
    
    async def _elevenlabs_tts(self, text: str) -> Optional[str]:
        """ElevenLabs TTS"""
        api_key = os.getenv("ELEVENLABS_API_KEY")
        if not api_key:
            print("ElevenLabs API key not found")
            return None
        
        try:
            # ElevenLabs는 동기 함수이므로 비동기로 실행
            def generate_audio():
                audio = generate(
                    text=text,
                    voice="Bella",  # 기본 음성
                    api_key=api_key
                )
                return audio
            
            # 비동기로 실행
            audio = await asyncio.get_event_loop().run_in_executor(
                None, generate_audio
            )
            
            # 임시 파일로 저장
            audio_filename = f"audio_{uuid.uuid4().hex}.mp3"
            audio_path = os.path.join(tempfile.gettempdir(), audio_filename)
            
            save(audio, audio_path)
            
            # 실제 서비스에서는 클라우드 스토리지나 CDN에 업로드 후 URL 반환
            # 여기서는 로컬 파일 경로를 반환 (개발용)
            return f"http://localhost:8000/static/audio/{audio_filename}"
            
        except Exception as e:
            print(f"ElevenLabs TTS error: {e}")
            return None