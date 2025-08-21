import { useState, useEffect } from 'react'
import { 
  Container, 
  TextField, 
  Button, 
  Box, 
  Typography, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Paper,
  Stepper,
  Step,
  StepLabel,
  Fade,
  Chip,
  IconButton,
  Divider,
  Card,
  CardContent,
  Grid,
  Alert,
  Snackbar
} from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SaveIcon from '@mui/icons-material/Save'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import MicIcon from '@mui/icons-material/Mic'
import FavoriteIcon from '@mui/icons-material/Favorite'
import PsychologyIcon from '@mui/icons-material/Psychology'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import BuildIcon from '@mui/icons-material/Build'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { agentApi } from '../services/api'

interface AgentConfig {
  id?: number
  name: string
  description: string
  prompt: string
  scenario: string
  stt_module: string
  emotion_module: string
  llm_module: string
  tts_module: string
}

interface ModuleOption {
  value: string
  label: string
  description?: string
}

const sttOptions: ModuleOption[] = [
  { value: 'azure', label: 'Azure', description: 'Microsoft Azure STT' },
  { value: 'google', label: 'Google', description: 'Google Cloud STT' },
  { value: 'openai', label: 'OpenAI', description: 'Whisper API' },
]

const emotionOptions: ModuleOption[] = [
  { value: 'hume', label: 'Hume AI', description: '감정 분석 전문' },
  { value: 'mago', label: 'Mago', description: '한국어 특화' },
  { value: 'none', label: '사용 안함', description: '감정 분석 미사용' },
]

const llmOptions: ModuleOption[] = [
  { value: 'claude', label: 'Claude', description: 'Anthropic' },
  { value: 'gpt', label: 'GPT-4', description: 'OpenAI' },
  { value: 'gemini', label: 'Gemini', description: 'Google' },
]

const ttsOptions: ModuleOption[] = [
  { value: 'browser', label: '브라우저', description: '웹 브라우저 내장' },
  { value: 'elevenlabs', label: 'ElevenLabs', description: '고품질 음성' },
  { value: 'azure', label: 'Azure TTS', description: 'Microsoft Azure' },
]

const steps = ['기본 정보', '모듈 선택', '프롬프트 작성', '시나리오 설정']

export default function AgentBuilder() {
  const navigate = useNavigate()
  const { agentId } = useParams()
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState<AgentConfig>({
    name: '',
    description: '',
    prompt: '',
    scenario: '',
    stt_module: 'azure',
    emotion_module: 'hume',
    llm_module: 'gpt',
    tts_module: 'browser'
  })
  const [alert, setAlert] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  useEffect(() => {
    if (agentId) {
      loadAgent()
    }
  }, [agentId])

  const loadAgent = async () => {
    try {
      const data = await agentApi.getById(Number(agentId))
      setConfig(data)
    } catch (error) {
      console.error('Failed to load agent:', error)
    }
  }

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      let response
      if (agentId) {
        response = await agentApi.update(Number(agentId), config)
      } else {
        response = await agentApi.create(config)
      }
      setAlert({ open: true, message: '에이전트가 성공적으로 저장되었습니다!', severity: 'success' })
      setTimeout(() => navigate(`/scenario/${response.id || agentId}`), 1500)
    } catch (error) {
      setAlert({ open: true, message: '저장에 실패했습니다.', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const ModuleSelector = ({ 
    title, 
    icon,
    options, 
    value, 
    onChange,
    gradient
  }: { 
    title: string
    icon: React.ReactNode
    options: ModuleOption[]
    value: string
    onChange: (value: string) => void
    gradient: string
  }) => (
    <Paper sx={{ p: 2, borderRadius: 3, background: gradient }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {icon}
        <Typography variant="subtitle1" fontWeight={600} sx={{ ml: 1 }}>
          {title}
        </Typography>
      </Box>
      <Grid container spacing={1}>
        {options.map((option) => (
          <Grid item xs={12} key={option.value}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: value === option.value ? '2px solid #667eea' : '1px solid rgba(0,0,0,0.1)',
                bgcolor: value === option.value ? 'rgba(102, 126, 234, 0.05)' : 'rgba(255,255,255,0.8)',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: '#667eea',
                  transform: 'translateX(4px)',
                }
              }}
              onClick={() => onChange(option.value)}
            >
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: value === option.value ? 600 : 400 }}>
                    {option.label}
                  </Typography>
                  {option.description && (
                    <Typography variant="caption" color="text.secondary">
                      {option.description}
                    </Typography>
                  )}
                </Box>
                {value === option.value && (
                  <CheckCircleIcon sx={{ color: '#667eea', fontSize: 20 }} />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  )

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Fade in timeout={600}>
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#4a5568' }}>
                에이전트 기본 정보
              </Typography>
              <TextField
                fullWidth
                label="에이전트 이름"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                    }
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#667eea'
                  }
                }}
              />
              <TextField
                fullWidth
                multiline
                rows={4}
                label="에이전트 설명"
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                    }
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#667eea'
                  }
                }}
              />
            </Box>
          </Fade>
        )
      case 1:
        return (
          <Fade in timeout={600}>
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#4a5568' }}>
                모듈 선택
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <ModuleSelector 
                  title="음성 인식 (STT)"
                  icon={<MicIcon sx={{ color: '#667eea' }} />}
                  options={sttOptions}
                  value={config.stt_module}
                  onChange={(value) => setConfig({ ...config, stt_module: value })}
                  gradient="linear-gradient(135deg, #667eea05, #764ba205)"
                />
                <ModuleSelector 
                  title="감정 인식"
                  icon={<FavoriteIcon sx={{ color: '#f093fb' }} />}
                  options={emotionOptions}
                  value={config.emotion_module}
                  onChange={(value) => setConfig({ ...config, emotion_module: value })}
                  gradient="linear-gradient(135deg, #f093fb05, #fecfef05)"
                />
                <ModuleSelector 
                  title="언어 모델 (LLM)"
                  icon={<PsychologyIcon sx={{ color: '#feca57' }} />}
                  options={llmOptions}
                  value={config.llm_module}
                  onChange={(value) => setConfig({ ...config, llm_module: value })}
                  gradient="linear-gradient(135deg, #feca5705, #ffa50005)"
                />
                <ModuleSelector 
                  title="음성 합성 (TTS)"
                  icon={<VolumeUpIcon sx={{ color: '#84fab0' }} />}
                  options={ttsOptions}
                  value={config.tts_module}
                  onChange={(value) => setConfig({ ...config, tts_module: value })}
                  gradient="linear-gradient(135deg, #84fab005, #8fd3f405)"
                />
              </Box>
            </Box>
          </Fade>
        )
      case 2:
        return (
          <Fade in timeout={600}>
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#4a5568' }}>
                시스템 프롬프트
              </Typography>
              <Paper sx={{ p: 2, mb: 2, background: 'linear-gradient(135deg, #667eea05, #764ba205)', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ color: '#4a5568' }}>
                  에이전트의 성격, 역할, 대화 스타일을 정의하세요
                </Typography>
              </Paper>
              <TextField
                fullWidth
                multiline
                rows={12}
                placeholder="예시: 당신은 친절한 카드 발급 상담원입니다. 고객의 문의에 전문적이고 친절하게 답변하세요..."
                value={config.prompt}
                onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    fontFamily: 'monospace',
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                    }
                  }
                }}
              />
            </Box>
          </Fade>
        )
      case 3:
        return (
          <Fade in timeout={600}>
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#4a5568' }}>
                DM 시나리오 (선택사항)
              </Typography>
              <Paper sx={{ p: 2, mb: 2, background: 'linear-gradient(135deg, #f093fb05, #fecfef05)', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ color: '#4a5568' }}>
                  대화 흐름이나 특별한 시나리오가 있다면 작성하세요
                </Typography>
              </Paper>
              <TextField
                fullWidth
                multiline
                rows={8}
                placeholder="예시: 고객이 카드 분실 신고를 하면 먼저 본인 확인을 진행하고..."
                value={config.scenario}
                onChange={(e) => setConfig({ ...config, scenario: e.target.value })}
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    fontFamily: 'monospace',
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                    }
                  }
                }}
              />
              {config.id && (
                <Button
                  variant="outlined"
                  startIcon={<BuildIcon />}
                  onClick={() => navigate(`/scenario/${config.id}`)}
                  sx={{ 
                    borderColor: '#667eea',
                    color: '#667eea',
                    '&:hover': {
                      borderColor: '#764ba2',
                      background: 'linear-gradient(135deg, #667eea05, #764ba205)'
                    }
                  }}
                >
                  시나리오 플로우 빌더 열기
                </Button>
              )}
            </Box>
          </Fade>
        )
      default:
        return null
    }
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Fade in timeout={600}>
          <Paper sx={{ 
            p: 4, 
            borderRadius: 4,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a202c' }}>
                {agentId ? '에이전트 수정' : '새 에이전트 만들기'}
              </Typography>
            </Box>

            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel 
                    sx={{
                      '& .MuiStepLabel-label.Mui-active': {
                        color: '#667eea'
                      },
                      '& .MuiStepLabel-label.Mui-completed': {
                        color: '#667eea'
                      }
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box sx={{ minHeight: 400, mb: 4 }}>
              {renderStepContent(activeStep)}
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ 
                  color: '#667eea',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #667eea05, #764ba205)'
                  }
                }}
              >
                이전
              </Button>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {activeStep === steps.length - 1 ? (
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={!config.name || !config.description || loading}
                    sx={{ 
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      borderRadius: 2,
                      px: 4,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #764ba2, #667eea)',
                      }
                    }}
                  >
                    {loading ? '저장 중...' : '저장하고 시나리오 편집'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ 
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      borderRadius: 2,
                      px: 4,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #764ba2, #667eea)',
                      }
                    }}
                  >
                    다음
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </Fade>
        
        <Snackbar
          open={alert.open}
          autoHideDuration={4000}
          onClose={() => setAlert({ ...alert, open: false })}
        >
          <Alert onClose={() => setAlert({ ...alert, open: false })} severity={alert.severity}>
            {alert.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  )
}