import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()

  return (
    <AppBar position="static" elevation={1} sx={{ bgcolor: '#fff', color: '#333' }}>
      <Toolbar>
        <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 600, color: '#1976d2' }}>
          SENI
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            color="inherit" 
            onClick={() => navigate('/')}
            sx={{ color: '#666', '&:hover': { bgcolor: '#f5f5f5' } }}
          >
            에이전트 목록
          </Button>
          <Button 
            variant="contained"
            onClick={() => navigate('/builder')}
            sx={{ ml: 1 }}
          >
            새 에이전트 만들기
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  )
}