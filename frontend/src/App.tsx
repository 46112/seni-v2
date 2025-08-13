import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import AgentBuilder from './components/AgentBuilder'
import AgentList from './components/AgentList'
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
        <Navbar />
        <Routes>
          <Route path="/" element={<AgentList />} />
          <Route path="/builder" element={<AgentBuilder />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
