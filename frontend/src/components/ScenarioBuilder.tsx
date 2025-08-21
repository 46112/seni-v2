import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Panel,
  type Node,
  type Edge,
  type Connection
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Fab,
  CircularProgress,
  Alert,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab
} from '@mui/material';
import {
  AutoFixHigh as ParseIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Code as CodeIcon,
  AccountTree as FlowIcon
} from '@mui/icons-material';
import axios from 'axios';

interface ScenarioBuilderProps {
  agentId: number;
  initialScenario?: string;
  llmModule?: string;
}

const nodeTypes = {
  start: { label: '시작', color: '#4CAF50' },
  dialog: { label: '대화', color: '#2196F3' },
  decision: { label: '분기', color: '#FF9800' },
  action: { label: '액션', color: '#9C27B0' },
  end: { label: '종료', color: '#F44336' }
};

const ScenarioBuilder: React.FC<ScenarioBuilderProps> = ({ agentId, initialScenario, llmModule = 'gpt' }) => {
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [scenarioText, setScenarioText] = useState(initialScenario || '');
  const [jsonFlow, setJsonFlow] = useState<string>('{}');
  const [parseDialogOpen, setParseDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedLLM, setSelectedLLM] = useState(llmModule);
  const [viewMode, setViewMode] = useState<'flow' | 'json'>('flow');
  const [autoConvert, setAutoConvert] = useState(true);
  const [agentData, setAgentData] = useState<any>(null);

  // 에이전트 정보 로드 및 시나리오 자동 변환
  useEffect(() => {
    const loadAgentAndConvert = async () => {
      if (!agentId) return;
      
      setLoading(true);
      try {
        // 에이전트 정보 조회
        const response = await axios.get(`http://localhost:8000/api/agents/${agentId}`);
        const agent = response.data;
        setAgentData(agent);
        
        // LLM 모듈 설정
        if (agent.llm_module) {
          setSelectedLLM(agent.llm_module);
        }
        
        // 시나리오가 있으면 설정하고 자동 변환
        if (agent.scenario) {
          setScenarioText(agent.scenario);
          
          // scenario_flow가 이미 있으면 로드, 없으면 자동 변환
          if (agent.scenario_flow && agent.scenario_flow.nodes) {
            // 기존 플로우 로드
            const flow = agent.scenario_flow;
            loadExistingFlow(flow);
          } else if (autoConvert) {
            // 자동 변환 실행
            await convertScenarioToFlow(agent.scenario, agent.llm_module || 'gpt');
          }
        }
      } catch (err) {
        console.error('Failed to load agent:', err);
        setError('에이전트 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    loadAgentAndConvert();
  }, [agentId, autoConvert]);

  // 노드/엣지 변경 시 JSON 동기화
  useEffect(() => {
    const flowData = {
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type || 'dialog',
        position: node.position,
        data: node.data
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label || '',
        type: edge.type || 'smoothstep'
      }))
    };
    setJsonFlow(JSON.stringify(flowData, null, 2));
  }, [nodes, edges]);

  const loadExistingFlow = (flow: any) => {
    const loadedNodes = flow.nodes.map((node: any) => ({
      id: node.id,
      type: node.type || 'default',
      data: { 
        ...node.data,
        label: (
          <div style={{ 
            padding: '10px', 
            background: nodeTypes[node.type as keyof typeof nodeTypes]?.color || '#ccc',
            color: 'white',
            borderRadius: '5px',
            minWidth: '120px',
            textAlign: 'center'
          }}>
            <strong>{node.data?.label || node.type}</strong>
            {node.data?.message && (
              <div style={{ fontSize: '11px', marginTop: '5px', opacity: 0.9 }}>
                {node.data.message.substring(0, 50)}
                {node.data.message.length > 50 && '...'}
              </div>
            )}
            {node.data?.options && (
              <div style={{ fontSize: '10px', marginTop: '5px', opacity: 0.8 }}>
                {node.data.options.join(' | ')}
              </div>
            )}
          </div>
        )
      },
      position: node.position
    }));

    const loadedEdges = flow.edges.map((edge: any) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label || '',
      type: edge.type || 'smoothstep',
      animated: edge.animated || false,
      markerEnd: { type: MarkerType.ArrowClosed }
    }));

    setNodes(loadedNodes);
    setEdges(loadedEdges);
  };

  const convertScenarioToFlow = async (scenario: string, llm: string) => {
    if (!scenario.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('http://localhost:8000/api/scenario/convert-to-flow', {
        scenario_text: scenario,
        llm_module: llm
      });
      
      const flow = response.data;
      loadExistingFlow(flow);
      setSuccess('시나리오가 자동으로 변환되었습니다!');
    } catch (err) {
      console.error('Failed to convert scenario:', err);
      setError('시나리오 변환에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed } }, eds)),
    [setEdges]
  );

  const handleConvertScenario = async () => {
    if (!scenarioText.trim()) {
      setError('시나리오 텍스트를 입력해주세요.');
      return;
    }
    
    await convertScenarioToFlow(scenarioText, selectedLLM);
    setParseDialogOpen(false);
  };

  const handleManualConvert = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('http://localhost:8000/api/scenario/convert-to-flow', {
        scenario_text: scenarioText,
        llm_module: selectedLLM
      });
      
      const flow = response.data;
      
      loadExistingFlow(flow);
      setSuccess('시나리오가 수동으로 변환되었습니다!');
      setParseDialogOpen(false);
    } catch (err) {
      setError('시나리오 파싱에 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFlow = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const flowData = {
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type || 'dialog',
          position: node.position,
          data: {
            ...node.data,
            label: typeof node.data.label === 'string' ? node.data.label : 
                   node.data.label?.props?.children?.[0]?.props?.children || node.type
          }
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label || '',
          type: edge.type || 'smoothstep'
        }))
      };

      // scenario_flow를 agents 테이블에 저장
      await axios.put(`http://localhost:8000/api/agents/${agentId}`, {
        scenario_flow: flowData
      });
      setSuccess('시나리오 플로우가 저장되었습니다!');
      
      // 저장 성공 후 에이전트 목록으로 이동
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err) {
      setError('플로우 저장에 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addNode = (type: keyof typeof nodeTypes) => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: type,
      data: { 
        label: nodeTypes[type].label,
        type: type
      },
      position: { x: Math.random() * 500, y: Math.random() * 300 }
    };
    
    setNodes((nds) => [...nds, newNode]);
  };

  const handleJsonChange = (newJson: string) => {
    try {
      const flowData = JSON.parse(newJson);
      
      // JSON에서 노드/엣지 업데이트
      const updatedNodes = flowData.nodes.map((node: any) => ({
        ...node,
        data: {
          ...node.data,
          label: (
            <div style={{ 
              padding: '10px', 
              background: nodeTypes[node.type as keyof typeof nodeTypes]?.color || '#ccc',
              color: 'white',
              borderRadius: '5px',
              minWidth: '120px',
              textAlign: 'center'
            }}>
              <strong>{node.data.label || node.type}</strong>
              {node.data.message && (
                <div style={{ fontSize: '11px', marginTop: '5px', opacity: 0.9 }}>
                  {node.data.message}
                </div>
              )}
            </div>
          )
        }
      }));
      
      const updatedEdges = flowData.edges.map((edge: any) => ({
        ...edge,
        markerEnd: { type: MarkerType.ArrowClosed }
      }));
      
      setNodes(updatedNodes);
      setEdges(updatedEdges);
      setJsonFlow(newJson);
    } catch (e) {
      // JSON 파싱 에러는 무시 (사용자가 입력 중)
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Typography variant="h5" gutterBottom>
          DM 시나리오 빌더 {agentData && `- ${agentData.name}`}
        </Typography>
        {agentData?.scenario && (
          <Typography variant="body2" color="text.secondary">
            시나리오: {agentData.scenario.substring(0, 100)}{agentData.scenario.length > 100 && '...'}
          </Typography>
        )}
      </Paper>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ m: 2 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        <Paper sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
          <Tabs value={viewMode} onChange={(e, v) => setViewMode(v)}>
            <Tab icon={<FlowIcon />} label="플로우" value="flow" />
            <Tab icon={<CodeIcon />} label="JSON" value="json" />
          </Tabs>
        </Paper>

        {viewMode === 'flow' ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
          >
            <Controls />
            <Background />
            
            <Panel position="top-left">
              <Paper sx={{ p: 1 }}>
                {Object.entries(nodeTypes).map(([key, value]) => (
                  <Button
                    key={key}
                    size="small"
                    variant="contained"
                    sx={{ 
                      m: 0.5, 
                      backgroundColor: value.color,
                      '&:hover': { backgroundColor: value.color }
                    }}
                    onClick={() => addNode(key as keyof typeof nodeTypes)}
                  >
                    {value.label} 추가
                  </Button>
                ))}
              </Paper>
            </Panel>
          </ReactFlow>
        ) : (
          <Box sx={{ height: '100%', p: 2 }}>
            <TextField
              fullWidth
              multiline
              value={jsonFlow}
              onChange={(e) => handleJsonChange(e.target.value)}
              sx={{ 
                height: '100%',
                '& .MuiInputBase-root': {
                  height: '100%',
                  fontFamily: 'monospace',
                  fontSize: '12px'
                }
              }}
            />
          </Box>
        )}

        <Fab
          color="primary"
          sx={{ position: 'absolute', bottom: 16, right: 16 }}
          onClick={() => setParseDialogOpen(true)}
        >
          <ParseIcon />
        </Fab>

        <Fab
          color="secondary"
          sx={{ position: 'absolute', bottom: 16, right: 80 }}
          onClick={handleSaveFlow}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : <SaveIcon />}
        </Fab>
      </Box>

      <Dialog
        open={parseDialogOpen}
        onClose={() => setParseDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          시나리오 텍스트 파싱
          <IconButton
            sx={{ position: 'absolute', right: 8, top: 8 }}
            onClick={() => setParseDialogOpen(false)}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>LLM 모델 선택</InputLabel>
                <Select
                  value={selectedLLM}
                  label="LLM 모델 선택"
                  onChange={(e) => setSelectedLLM(e.target.value)}
                >
                  <MenuItem value="gpt">GPT</MenuItem>
                  <MenuItem value="claude">Claude</MenuItem>
                  <MenuItem value="gemini">Gemini</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={10}
                value={scenarioText}
                onChange={(e) => setScenarioText(e.target.value)}
                placeholder="DM 시나리오를 텍스트로 입력하세요.\n\n예시:\n1. 플레이어가 던전에 입장합니다\n2. 고블린 3마리가 나타납니다\n3. 전투를 하거나 대화를 시도할 수 있습니다\n4. 전투 승리 시 보물 획득\n5. 대화 성공 시 정보 획득"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="textSecondary">
                LLM이 시나리오를 분석하여 자동으로 노드와 연결을 생성합니다.
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setParseDialogOpen(false)}>취소</Button>
          <Button
            onClick={handleConvertScenario}
            variant="contained"
            disabled={loading || !scenarioText.trim()}
          >
            {loading ? <CircularProgress size={24} /> : 'AI로 변환하기'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScenarioBuilder;