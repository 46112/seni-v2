import os
from typing import Optional
import openai
import anthropic
import google.generativeai as genai

class LLMService:
    def __init__(self, service_type: str = "gpt"):
        self.service_type = service_type
        
    def generate_response(
        self, 
        message: str, 
        system_prompt: str = "당신은 도움이 되는 AI 어시스턴트입니다.",
        emotion: Optional[str] = None
    ) -> str:
        """LLM을 사용하여 응답 생성"""
        
        # 감정이 있으면 시스템 프롬프트에 추가
        if emotion:
            system_prompt += f"\n\n사용자의 현재 감정: {emotion}. 이 감정을 고려하여 적절히 응답해주세요."
        
        if self.service_type == "claude":
            return self._claude_response(message, system_prompt)
        elif self.service_type == "gpt":
            return self._openai_response(message, system_prompt)
        elif self.service_type == "gemini":
            return self._gemini_response(message, system_prompt)
        else:
            raise ValueError(f"Unsupported LLM service: {self.service_type}")
    
    def _claude_response(self, message: str, system_prompt: str) -> str:
        """Anthropic Claude - Messages API 사용"""
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("Anthropic API key not found")
        
        client = anthropic.Anthropic(api_key=api_key)
        
        try:
            # 신버전 Messages API 사용
            response = client.messages.create(
                model="claude-3-5-haiku-20241022",  # 최신 Haiku 모델
                max_tokens=1000,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": message}
                ]
            )
            
            # response.content는 리스트이므로 첫 번째 텍스트 블록 추출
            if response.content and len(response.content) > 0:
                return response.content[0].text
            else:
                return "응답을 생성할 수 없습니다."
                
        except Exception as e:
            print(f"Claude API error: {e}")
            # 오류 상세 내용 출력
            if hasattr(e, 'response'):
                print(f"Response status: {e.response.status_code if hasattr(e.response, 'status_code') else 'N/A'}")
                print(f"Response body: {e.response.text if hasattr(e.response, 'text') else 'N/A'}")
            return "죄송합니다. 응답 생성 중 오류가 발생했습니다."
    
    def _openai_response(self, message: str, system_prompt: str) -> str:
        """OpenAI GPT"""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OpenAI API key not found")
        
        client = openai.OpenAI(api_key=api_key)
        
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",  # 빠른 모델
                max_tokens=1000,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ]
            )
            
            return response.choices[0].message.content
        except Exception as e:
            print(f"OpenAI API error: {e}")
            return "죄송합니다. 응답 생성 중 오류가 발생했습니다."
    
    def _gemini_response(self, message: str, system_prompt: str) -> str:
        """Google Gemini"""
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("Google API key not found")
        
        genai.configure(api_key=api_key)
        
        try:
            model = genai.GenerativeModel('gemini-2.0-flash-exp')
            
            # 시스템 프롬프트와 사용자 메시지 결합
            full_prompt = f"{system_prompt}\n\n사용자: {message}\n\n어시스턴트:"
            
            response = model.generate_content(full_prompt)
            
            return response.text
        except Exception as e:
            print(f"Gemini API error: {e}")
            return "죄송합니다. 응답 생성 중 오류가 발생했습니다."