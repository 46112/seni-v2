import { useParams } from 'react-router-dom';
import ScenarioBuilder from './ScenarioBuilder';

export default function ScenarioPage() {
  const { agentId } = useParams<{ agentId: string }>();
  
  return <ScenarioBuilder agentId={parseInt(agentId || '0')} />;
}