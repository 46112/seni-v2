import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export type Agent = {
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

export const agentApi = {
  getAll: async (): Promise<Agent[]> => {
    const response = await api.get('/agents')
    return response.data
  },

  getById: async (id: number): Promise<Agent> => {
    const response = await api.get(`/agents/${id}`)
    return response.data
  },

  create: async (agent: Omit<Agent, 'id' | 'created_at' | 'updated_at'>): Promise<Agent> => {
    const response = await api.post('/agents', agent)
    return response.data
  },

  update: async (id: number, agent: Partial<Agent>): Promise<Agent> => {
    const response = await api.put(`/agents/${id}`, agent)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/agents/${id}`)
  },
}

export default api