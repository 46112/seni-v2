import { useState, useEffect } from 'react'
import { Container, Typography, Button, Grid, Card, CardContent, CardActions, Box, Chip, CircularProgress, IconButton, Fade, Tooltip } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import DeleteIcon from '@mui/icons-material/Delete'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import BuildIcon from '@mui/icons-material/Build'
import MicIcon from '@mui/icons-material/Mic'
import FavoriteIcon from '@mui/icons-material/Favorite'
import PsychologyIcon from '@mui/icons-material/Psychology'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
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
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Fade in timeout={800}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 5,
            px: 2 
          }}>
            <Box>
              <Typography 
                variant="h3" 
                component="h1" 
                sx={{ 
                  fontWeight: 700, 
                  color: 'white',
                  mb: 1,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                에이전트 목록
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'rgba(255,255,255,0.9)',
                  fontWeight: 300
                }}
              >
                맞춤형 대화형 에이전트를 만들고 관리하세요
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AutoAwesomeIcon />}
              onClick={() => navigate('/builder')}
              size="large"
              sx={{ 
                borderRadius: 3,
                background: 'white',
                color: '#667eea',
                px: 4,
                py: 1.5,
                fontWeight: 600,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                '&:hover': {
                  background: 'rgba(255,255,255,0.95)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
                }
              }}
            >
              새 에이전트 만들기
            </Button>
          </Box>
        </Fade>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <CircularProgress sx={{ color: 'white' }} />
          </Box>
        ) : agents.length === 0 ? (
          <Fade in timeout={1000}>
            <Box sx={{ 
              textAlign: 'center', 
              mt: 12,
              p: 6,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 4,
              backdropFilter: 'blur(10px)'
            }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  mb: 2, 
                  color: 'white',
                  fontWeight: 500
                }}
              >
                아직 생성된 에이전트가 없습니다
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 4, 
                  color: 'rgba(255,255,255,0.8)'
                }}
              >
                첫 번째 AI 에이전트를 만들어보세요!
              </Typography>
              <Button
                variant="contained"
                startIcon={<AutoAwesomeIcon />}
                onClick={() => navigate('/builder')}
                size="large"
                sx={{ 
                  borderRadius: 3,
                  background: 'white',
                  color: '#667eea',
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  '&:hover': {
                    background: 'rgba(255,255,255,0.95)',
                    transform: 'scale(1.05)'
                  }
                }}
              >
                첫 에이전트 만들기
              </Button>
            </Box>
          </Fade>
        ) : (
          <Grid container spacing={4}>
            {agents.map((agent, index) => (
              <Grid item xs={12} sm={6} md={4} key={agent.id}>
                <Fade in timeout={800 + index * 100}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      overflow: 'hidden',
                      position: 'relative',
                      '&:hover': {
                        transform: 'translateY(-8px) scale(1.02)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '& .agent-actions': {
                          opacity: 1
                        }
                      }
                    }}
                  >
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: 'linear-gradient(90deg, #667eea, #764ba2, #f093fb)',
                      backgroundSize: '200% 100%',
                      animation: 'gradient 3s ease infinite'
                    }} />
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #667eea, #764ba2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2
                        }}>
                          <AutoAwesomeIcon sx={{ color: 'white', fontSize: 20 }} />
                        </Box>
                        <Box>
                          <Typography 
                            variant="h6" 
                            component="h2" 
                            sx={{ 
                              fontWeight: 700, 
                              color: '#1a202c',
                              mb: 0.5
                            }}
                          >
                            {agent.name}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: '#667eea',
                              fontWeight: 500
                            }}
                          >
                            ID: {agent.id}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          mb: 3, 
                          lineHeight: 1.8,
                          color: '#4a5568',
                          minHeight: '48px'
                        }}
                      >
                        {agent.description}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                        {agent.stt_module && (
                          <Chip 
                            label={agent.stt_module} 
                            size="small"
                            icon={<MicIcon sx={{ fontSize: 14 }} />}
                            sx={{ 
                              fontSize: '0.75rem',
                              background: 'linear-gradient(135deg, #667eea15, #764ba215)',
                              border: '1px solid #667eea30',
                              fontWeight: 500
                            }}
                          />
                        )}
                        {agent.emotion_module && (
                          <Chip 
                            label={agent.emotion_module} 
                            size="small"
                            icon={<FavoriteIcon sx={{ fontSize: 14 }} />}
                            sx={{ 
                              fontSize: '0.75rem',
                              background: 'linear-gradient(135deg, #f093fb15, #fecfef15)',
                              border: '1px solid #f093fb30',
                              fontWeight: 500
                            }}
                          />
                        )}
                        {agent.llm_module && (
                          <Chip 
                            label={agent.llm_module.toUpperCase()} 
                            size="small"
                            icon={<PsychologyIcon sx={{ fontSize: 14 }} />}
                            sx={{ 
                              fontSize: '0.75rem',
                              background: 'linear-gradient(135deg, #feca5715, #ffa50015)',
                              border: '1px solid #feca5730',
                              fontWeight: 500
                            }}
                          />
                        )}
                        {agent.tts_module && (
                          <Chip 
                            label={agent.tts_module} 
                            size="small"
                            icon={<VolumeUpIcon sx={{ fontSize: 14 }} />}
                            sx={{ 
                              fontSize: '0.75rem',
                              background: 'linear-gradient(135deg, #84fab015, #8fd3f415)',
                              border: '1px solid #84fab030',
                              fontWeight: 500
                            }}
                          />
                        )}
                      </Box>
                    </CardContent>
                    <CardActions 
                      className="agent-actions"
                      sx={{ 
                        p: 2, 
                        pt: 0,
                        display: 'flex',
                        justifyContent: 'space-between',
                        opacity: 0.8,
                        transition: 'opacity 0.3s'
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="편집" placement="top">
                          <IconButton 
                            size="small"
                            onClick={() => navigate(`/builder/${agent.id}`)}
                            sx={{ 
                              background: 'linear-gradient(135deg, #667eea15, #764ba215)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #667eea25, #764ba225)',
                              }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="시나리오 빌더" placement="top">
                          <IconButton 
                            size="small"
                            onClick={() => navigate(`/scenario/${agent.id}`)}
                            sx={{ 
                              background: 'linear-gradient(135deg, #f093fb15, #fecfef15)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #f093fb25, #fecfef25)',
                              }
                            }}
                          >
                            <BuildIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                          variant="contained"
                          startIcon={<PlayArrowIcon />}
                          size="small"
                          onClick={() => navigate(`/chat/${agent.id}`)}
                          sx={{ 
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            fontWeight: 600,
                            px: 2,
                            '&:hover': {
                              background: 'linear-gradient(135deg, #764ba2, #667eea)',
                            }
                          }}
                        >
                          테스트
                        </Button>
                        <Tooltip title="삭제" placement="top">
                          <IconButton 
                            size="small"
                            onClick={() => agent.id && handleDelete(agent.id)}
                            sx={{ 
                              color: '#e53e3e',
                              '&:hover': {
                                background: 'rgba(229, 62, 62, 0.1)',
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardActions>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
      
      <style>
        {`
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>
    </Box>
  )
}