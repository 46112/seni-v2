import os
import tempfile
from typing import Optional
import openai
import azure.cognitiveservices.speech as speechsdk
from google.cloud import speech

class STTService:
    def __init__(self, service_type: str):
        self.service_type = service_type
        
    async def speech_to_text(self, audio_file_path: str) -> str:
        """음성 파일을 텍스트로 변환"""
        if self.service_type == "openai":
            return await self._openai_stt(audio_file_path)
        elif self.service_type == "azure":
            return await self._azure_stt(audio_file_path)
        elif self.service_type == "google":
            return await self._google_stt(audio_file_path)
        else:
            raise ValueError(f"Unsupported STT service: {self.service_type}")
    
    async def _openai_stt(self, audio_file_path: str) -> str:
        """OpenAI Whisper STT"""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OpenAI API key not found")
        
        client = openai.OpenAI(api_key=api_key)
        
        with open(audio_file_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="ko"  # 한국어 설정
            )
        
        return transcript.text
    
    async def _azure_stt(self, audio_file_path: str) -> str:
        """Azure Speech-to-Text"""
        speech_key = os.getenv("AZURE_SPEECH_KEY")
        speech_region = os.getenv("AZURE_SPEECH_REGION")
        
        if not speech_key or not speech_region:
            raise ValueError("Azure Speech credentials not found")
        
        speech_config = speechsdk.SpeechConfig(
            subscription=speech_key, 
            region=speech_region
        )
        speech_config.speech_recognition_language = "ko-KR"
        
        audio_config = speechsdk.audio.AudioConfig(filename=audio_file_path)
        speech_recognizer = speechsdk.SpeechRecognizer(
            speech_config=speech_config, 
            audio_config=audio_config
        )
        
        result = speech_recognizer.recognize_once()
        
        if result.reason == speechsdk.ResultReason.RecognizedSpeech:
            return result.text
        elif result.reason == speechsdk.ResultReason.NoMatch:
            return "음성을 인식할 수 없습니다."
        else:
            raise Exception(f"Speech recognition failed: {result.reason}")
    
    async def _google_stt(self, audio_file_path: str) -> str:
        """Google Cloud Speech-to-Text"""
        credentials_path = os.getenv("GOOGLE_CLOUD_CREDENTIALS")
        if not credentials_path:
            raise ValueError("Google Cloud credentials not found")
        
        # 환경변수 설정
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_path
        
        client = speech.SpeechClient()
        
        with open(audio_file_path, "rb") as audio_file:
            content = audio_file.read()
        
        audio = speech.RecognitionAudio(content=content)
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
            sample_rate_hertz=16000,
            language_code="ko-KR",
        )
        
        response = client.recognize(config=config, audio=audio)
        
        if response.results:
            return response.results[0].alternatives[0].transcript
        else:
            return "음성을 인식할 수 없습니다."