import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  Grid,
  Alert,
  Snackbar,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { agentApi } from '../services/api'

interface AgentConfig {
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
]

const llmOptions: ModuleOption[] = [
  { value: 'claude', label: 'Claude', description: 'Anthropic' },
  { value: 'gpt', label: 'GPT', description: 'OpenAI' },
  { value: 'gemini', label: 'Gemini', description: 'Google' },
]

const ttsOptions: ModuleOption[] = [
  { value: 'browser', label: '브라우저', description: '웹 브라우저 내장' },
  { value: 'elevenlabs', label: 'ElevenLabs', description: '고품질 음성' },
]

export default function AgentBuilder() {
  const navigate = useNavigate()
  const [config, setConfig] = useState<AgentConfig>({
    name: '',
    description: '',
    prompt: '',
    scenario: '',
    stt_module: '',
    emotion_module: '',
    llm_module: '',
    tts_module: ''
  })
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const response = await agentApi.create(config)
      setAlert({ open: true, message: '에이전트가 성공적으로 생성되었습니다! 시나리오 페이지로 이동합니다.', severity: 'success' })
      setTimeout(() => navigate(`/scenario/${response.id}`), 2000)
    } catch (error) {
      setAlert({ open: true, message: '에이전트 생성에 실패했습니다.', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleTest = () => {
    console.log('Testing agent...')
  }

  const ModuleSelector = ({ 
    title, 
    options, 
    value, 
    onChange 
  }: { 
    title: string
    options: ModuleOption[]
    value: string
    onChange: (value: string) => void 
  }) => (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500, color: '#475569' }}>
        {title}
      </Typography>
      <Grid container spacing={2}>
        {options.map((option) => (
          <Grid item xs={12} sm={6} md={4} key={option.value}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: value === option.value ? '2px solid #1976d2' : '1px solid #e2e8f0',
                bgcolor: value === option.value ? '#eff6ff' : '#fff',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: '#1976d2',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }
              }}
              onClick={() => onChange(option.value)}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {option.label}
                    </Typography>
                    {option.description && (
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    )}
                  </Box>
                  {value === option.value && (
                    <CheckCircleIcon sx={{ color: '#1976d2' }} />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 4, color: '#1a202c' }}>
          새 에이전트 만들기
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* 기본 정보 */}
          <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1a202c' }}>
                기본 정보
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  label="에이전트 이름"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  variant="outlined"
                  required
                  placeholder="예: AI 어시스턴트"
                />
                <TextField
                  fullWidth
                  label="에이전트 설명"
                  value={config.description}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  variant="outlined"
                  required
                  multiline
                  rows={3}
                  placeholder="이 에이전트가 무엇을 하는지 자세히 설명해주세요"
                />
              </Box>
            </CardContent>
          </Card>

          {/* 모듈 선택 */}
          <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1a202c' }}>
                모듈 선택
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <ModuleSelector 
                  title="STT (음성인식)"
                  options={sttOptions}
                  value={config.stt_module}
                  onChange={(value) => setConfig({ ...config, stt_module: value })}
                />
                
                <ModuleSelector 
                  title="감정인식"
                  options={emotionOptions}
                  value={config.emotion_module}
                  onChange={(value) => setConfig({ ...config, emotion_module: value })}
                />
                
                <ModuleSelector 
                  title="LLM (대화모델)"
                  options={llmOptions}
                  value={config.llm_module}
                  onChange={(value) => setConfig({ ...config, llm_module: value })}
                />
                
                <ModuleSelector 
                  title="TTS (음성합성)"
                  options={ttsOptions}
                  value={config.tts_module}
                  onChange={(value) => setConfig({ ...config, tts_module: value })}
                />
              </Box>
            </CardContent>
          </Card>

          {/* 맞춤형 프롬프트 */}
          <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1a202c' }}>
                맞춤형 프롬프트
              </Typography>
              <TextField
                fullWidth
                label="시스템 프롬프트"
                value={config.prompt}
                onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
                multiline
                rows={8}
                variant="outlined"
                placeholder="에이전트가 어떻게 행동해야 하는지 설명해주세요. 예: 당신은 친근하고 도움이 되는 AI 어시스턴트입니다..."
                helperText="에이전트의 성격, 말투, 전문 분야 등을 정의해주세요"
              />
            </CardContent>
          </Card>

          {/* DM 시나리오 */}
          <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1a202c' }}>
                DM 시나리오
                <Typography variant="caption" sx={{ ml: 2, color: '#94a3b8' }}>
                  (다음 단계에서 시각적으로 편집 가능)
                </Typography>
              </Typography>
              <TextField
                fullWidth
                label="게임 시나리오"
                value={config.scenario}
                onChange={(e) => setConfig({ ...config, scenario: e.target.value })}
                multiline
                rows={8}
                variant="outlined"
                placeholder="D&D나 RPG 게임의 시나리오를 작성해주세요. 저장 후 시나리오 빌더에서 노드와 엣지로 변환됩니다..."
                helperText="텍스트로 시나리오를 입력하면 다음 단계에서 시각적 플로우차트로 변환됩니다"
              />
            </CardContent>
          </Card>
        </Box>

        {/* 액션 버튼 */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<PlayArrowIcon />}
            onClick={handleTest}
            disabled={!config.name || !config.description}
            size="large"
            sx={{ borderRadius: 2, px: 4 }}
          >
            테스트
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSubmit}
            disabled={!config.name || !config.description}
            size="large"
            sx={{ borderRadius: 2, px: 4 }}
          >
            저장하고 시나리오 편집
          </Button>
        </Box>
        
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