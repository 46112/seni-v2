import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Paper,
  IconButton,
  TextField,
  Button,
  Avatar,
  Chip,
  CircularProgress,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import SendIcon from '@mui/icons-material/Send'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import PersonIcon from '@mui/icons-material/Person'
import { agentApi } from '../services/api'

type Agent = {
  id?: number
  name: string
  description: string
  prompt?: string
  scenario?: string
  stt_module?: string
  emotion_module?: string
  llm_module?: string
  tts_module?: string
  created_at?: string
  updated_at?: string
}

type Message = {
  id: string
  type: 'user' | 'agent'
  content: string
  timestamp: Date
  emotion?: string
}

export default function AgentChat() {
  const { agentId } = useParams<{ agentId: string }>()
  const navigate = useNavigate()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioChunks = useRef<Blob[]>([])

  useEffect(() => {
    let mounted = true
    
    const loadAgentData = async () => {
      if (agentId && mounted) {
        try {
          const data = await agentApi.getById(Number(agentId))
          if (mounted) {
            setAgent(data)
            
            // 메시지가 없을 때만 맞춤형 환영 메시지 가져오기
            if (messages.length === 0) {
              try {
                // 에이전트별 맞춤 인사말 API 호출
                const greetingResponse = await fetch(`http://localhost:8000/api/chat/${agentId}/greeting`)
                const greetingData = await greetingResponse.json()
                
                if (mounted) {
                  setMessages([{
                    id: Date.now().toString(),
                    type: 'agent' as const,
                    content: greetingData.greeting,
                    timestamp: new Date(),
                    emotion: greetingData.emotion
                  }])
                }
              } catch (greetingError) {
                // 인사말 API 실패시 기본 인사말 사용
                console.error('Failed to get greeting:', greetingError)
                if (mounted) {
                  setMessages([{
                    id: Date.now().toString(),
                    type: 'agent' as const,
                    content: `안녕하세요! ${data.name}입니다. 무엇을 도와드릴까요?`,
                    timestamp: new Date()
                  }])
                }
              }
            }
          }
        } catch (error) {
          console.error('Failed to load agent:', error)
          if (mounted) {
            navigate('/')
          }
        }
      }
    }
    
    loadAgentData()
    
    return () => {
      mounted = false
    }
  }, [agentId, navigate])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const addMessage = (type: 'user' | 'agent', content: string, emotion?: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      emotion
    }
    setMessages(prev => [...prev, newMessage])
  }

  const handleSendMessage = async () => {
    if (!inputText.trim() || !agent) return

    const userMessage = inputText.trim()
    setInputText('')
    addMessage('user', userMessage)
    setIsLoading(true)

    try {
      // 여기서 백엔드 API 호출
      const response = await fetch(`http://localhost:8000/api/chat/${agent.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          use_tts: true 
        })
      })

      const data = await response.json()
      addMessage('agent', data.response, data.emotion)
      
      // TTS 오디오가 있으면 재생
      if (data.audio_url) {
        const audio = new Audio(data.audio_url)
        audio.play()
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      addMessage('agent', '죄송합니다. 일시적인 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      
      recorder.ondataavailable = (event) => {
        audioChunks.current.push(event.data)
      }
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' })
        audioChunks.current = []
        await processAudioInput(audioBlob)
        
        // 스트림 정리
        stream.getTracks().forEach(track => track.stop())
      }
      
      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop()
      setMediaRecorder(null)
      setIsRecording(false)
    }
  }

  const processAudioInput = async (audioBlob: Blob) => {
    if (!agent) return

    setIsLoading(true)
    const formData = new FormData()
    formData.append('audio', audioBlob)
    formData.append('agent_id', agent.id!.toString())

    try {
      const response = await fetch(`http://localhost:8000/api/chat/voice/${agent.id}`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      
      // STT 결과를 사용자 메시지로 추가
      addMessage('user', data.transcribed_text)
      
      // 에이전트 응답 추가
      addMessage('agent', data.response, data.emotion)
      
      // TTS 오디오 재생
      if (data.audio_url) {
        const audio = new Audio(data.audio_url)
        audio.play()
      }
    } catch (error) {
      console.error('Failed to process audio:', error)
      addMessage('agent', '죄송합니다. 음성 처리 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!agent) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/')}>
            <ArrowBackIcon />
          </IconButton>
          <Avatar sx={{ bgcolor: '#1976d2' }}>
            <SmartToyIcon />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {agent.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              {agent.stt_module && <Chip label={agent.stt_module} size="small" />}
              {agent.llm_module && <Chip label={agent.llm_module} size="small" />}
              {agent.tts_module && <Chip label={agent.tts_module} size="small" />}
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* 메시지 영역 */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        <Container maxWidth="md">
          {messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                mb: 2,
                justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, maxWidth: '70%' }}>
                {message.type === 'agent' && (
                  <Avatar sx={{ bgcolor: '#1976d2', width: 32, height: 32 }}>
                    <SmartToyIcon fontSize="small" />
                  </Avatar>
                )}
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: message.type === 'user' ? '#1976d2' : '#fff',
                    color: message.type === 'user' ? '#fff' : '#000',
                    borderRadius: 2,
                    ...(message.type === 'user' ? 
                      { borderBottomRightRadius: 4 } : 
                      { borderBottomLeftRadius: 4 })
                  }}
                >
                  <Typography variant="body2">
                    {message.content}
                  </Typography>
                  {message.emotion && (
                    <Chip 
                      label={`감정: ${message.emotion}`} 
                      size="small" 
                      sx={{ mt: 1, fontSize: '0.7rem' }}
                    />
                  )}
                </Paper>
                {message.type === 'user' && (
                  <Avatar sx={{ bgcolor: '#666', width: 32, height: 32 }}>
                    <PersonIcon fontSize="small" />
                  </Avatar>
                )}
              </Box>
            </Box>
          ))}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: '#1976d2', width: 32, height: 32 }}>
                  <SmartToyIcon fontSize="small" />
                </Avatar>
                <Paper sx={{ p: 2, borderRadius: 2, borderBottomLeftRadius: 4 }}>
                  <CircularProgress size={16} />
                </Paper>
              </Box>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Container>
      </Box>

      {/* 입력 영역 */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <IconButton
              color={isRecording ? 'error' : 'primary'}
              onClick={isRecording ? stopRecording : startRecording}
              sx={{ mb: 1 }}
            >
              {isRecording ? <MicOffIcon /> : <MicIcon />}
            </IconButton>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="메시지를 입력하세요..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
            />
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              sx={{ mb: 1 }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Container>
      </Paper>
    </Box>
  )
}