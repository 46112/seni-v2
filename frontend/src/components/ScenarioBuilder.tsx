import React, { useState, useCallback, useEffect } from 'react';
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
  Alert
} from '@mui/material';
import {
  AutoFixHigh as ParseIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';

interface ScenarioBuilderProps {
  agentId: number;
  initialScenario?: string;
}

const nodeTypes = {
  start: { label: '시작', color: '#4CAF50' },
  message: { label: '메시지', color: '#2196F3' },
  condition: { label: '조건', color: '#FF9800' },
  action: { label: '액션', color: '#9C27B0' },
  end: { label: '종료', color: '#F44336' }
};

const ScenarioBuilder: React.FC<ScenarioBuilderProps> = ({ agentId, initialScenario }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [scenarioText, setScenarioText] = useState(initialScenario || '');
  const [parseDialogOpen, setParseDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 초기 플로우 로드
  useEffect(() => {
    loadScenarioFlow();
  }, [agentId]);

  const loadScenarioFlow = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/scenario/agents/${agentId}/flow`);
      const flow = response.data;
      
      const loadedNodes = flow.nodes.map((node: any) => ({
        id: node.id,
        type: 'default',
        data: { 
          label: (
            <div style={{ 
              padding: '10px', 
              background: nodeTypes[node.type as keyof typeof nodeTypes]?.color || '#ccc',
              color: 'white',
              borderRadius: '5px',
              minWidth: '100px',
              textAlign: 'center'
            }}>
              <strong>{node.label}</strong>
              {node.data.message && <div style={{ fontSize: '12px', marginTop: '5px' }}>{node.data.message}</div>}
            </div>
          )
        },
        position: node.position
      }));

      const loadedEdges = flow.edges.map((edge: any) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: edge.type || 'default',
        markerEnd: { type: MarkerType.ArrowClosed }
      }));

      setNodes(loadedNodes);
      setEdges(loadedEdges);
    } catch (err) {
      console.error('Failed to load scenario flow:', err);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed } }, eds)),
    [setEdges]
  );

  const handleParseScenario = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('http://localhost:8000/api/scenario/parse', {
        text: scenarioText,
        agent_id: agentId
      });
      
      const flow = response.data;
      
      const parsedNodes = flow.nodes.map((node: any) => ({
        id: node.id,
        type: 'default',
        data: { 
          label: (
            <div style={{ 
              padding: '10px', 
              background: nodeTypes[node.type as keyof typeof nodeTypes]?.color || '#ccc',
              color: 'white',
              borderRadius: '5px',
              minWidth: '100px',
              textAlign: 'center'
            }}>
              <strong>{node.label}</strong>
              {node.data.message && <div style={{ fontSize: '12px', marginTop: '5px' }}>{node.data.message}</div>}
            </div>
          )
        },
        position: node.position
      }));

      const parsedEdges = flow.edges.map((edge: any) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: edge.type || 'default',
        markerEnd: { type: MarkerType.ArrowClosed }
      }));

      setNodes(parsedNodes);
      setEdges(parsedEdges);
      setSuccess('시나리오가 성공적으로 파싱되었습니다!');
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
          type: node.type || 'message',
          label: node.data.label,
          data: {},
          position: node.position
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label || '',
          type: edge.type || 'default'
        }))
      };

      await axios.put(`http://localhost:8000/api/scenario/agents/${agentId}/flow`, flowData);
      setSuccess('시나리오 플로우가 저장되었습니다!');
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
      type: 'default',
      data: { 
        label: (
          <div style={{ 
            padding: '10px', 
            background: nodeTypes[type].color,
            color: 'white',
            borderRadius: '5px',
            minWidth: '100px',
            textAlign: 'center'
          }}>
            <strong>{nodeTypes[type].label}</strong>
          </div>
        )
      },
      position: { x: Math.random() * 500, y: Math.random() * 300 }
    };
    
    setNodes((nds) => [...nds, newNode]);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Typography variant="h5" gutterBottom>
          DM 시나리오 빌더
        </Typography>
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
          <TextField
            fullWidth
            multiline
            rows={10}
            value={scenarioText}
            onChange={(e) => setScenarioText(e.target.value)}
            placeholder="DM 시나리오를 텍스트로 입력하세요. 예: 플레이어가 던전에 입장하면 고블린 3마리가 나타납니다..."
            variant="outlined"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setParseDialogOpen(false)}>취소</Button>
          <Button
            onClick={handleParseScenario}
            variant="contained"
            disabled={loading || !scenarioText.trim()}
          >
            {loading ? <CircularProgress size={24} /> : '파싱하기'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScenarioBuilder;