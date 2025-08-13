import { useState, useEffect } from 'react'
import { Container, Typography, Button, Grid, Card, CardContent, CardActions, Box, Chip, CircularProgress } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import DeleteIcon from '@mui/icons-material/Delete'
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

export default function AgentList() {
  const navigate = useNavigate()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      const data = await agentApi.getAll()
      setAgents(data)
    } catch (error) {
      console.error('Failed to load agents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('정말로 이 에이전트를 삭제하시겠습니까?')) {
      try {
        await agentApi.delete(id)
        await loadAgents()
      } catch (error) {
        console.error('Failed to delete agent:', error)
      }
    }
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: '#1a202c' }}>
            에이전트 목록
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/builder')}
            size="large"
            sx={{ borderRadius: 2 }}
          >
            새 에이전트 만들기
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : agents.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              아직 생성된 에이전트가 없습니다.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/builder')}
              sx={{ borderRadius: 2 }}
            >
              첫 에이전트 만들기
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {agents.map((agent) => (
              <Grid item xs={12} sm={6} md={4} key={agent.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: 3,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s ease'
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Typography variant="h6" component="h2" sx={{ fontWeight: 600, mb: 1.5, color: '#1a202c' }}>
                      {agent.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                      {agent.description}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {agent.stt_module && (
                        <Chip 
                          label={`STT: ${agent.stt_module}`} 
                          size="small" 
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                      {agent.emotion_module && (
                        <Chip 
                          label={`감정: ${agent.emotion_module}`} 
                          size="small" 
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                      {agent.llm_module && (
                        <Chip 
                          label={`LLM: ${agent.llm_module}`} 
                          size="small" 
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                      {agent.tts_module && (
                        <Chip 
                          label={`TTS: ${agent.tts_module}`} 
                          size="small" 
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button 
                      startIcon={<EditIcon />} 
                      size="small" 
                      sx={{ borderRadius: 2 }}
                    >
                      편집
                    </Button>
                    <Button 
                      startIcon={<PlayArrowIcon />}
                      size="small" 
                      color="success"
                      sx={{ borderRadius: 2 }}
                    >
                      테스트
                    </Button>
                    <Button 
                      startIcon={<DeleteIcon />}
                      size="small" 
                      color="error"
                      onClick={() => agent.id && handleDelete(agent.id)}
                      sx={{ borderRadius: 2 }}
                    >
                      삭제
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  )
}