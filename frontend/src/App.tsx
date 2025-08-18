import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import AgentBuilder from './components/AgentBuilder'
import AgentList from './components/AgentList'
import AgentChat from './components/AgentChat'
import ScenarioBuilder from './components/ScenarioBuilder'
import Navbar from './components/Navbar'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
  },
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<><Navbar /><AgentList /></>} />
          <Route path="/builder" element={<><Navbar /><AgentBuilder /></>} />
          <Route path="/scenario/:agentId" element={<><Navbar /><ScenarioBuilder agentId={1} /></>} />
          <Route path="/chat/:agentId" element={<AgentChat />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
