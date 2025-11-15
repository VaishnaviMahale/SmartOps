import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Box,
  Paper,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Chip,
} from '@mui/material';
import { Save, Add, ArrowBack, Delete } from '@mui/icons-material';
import {
  useCreateWorkflowMutation,
  useUpdateWorkflowMutation,
  useGetWorkflowByIdQuery,
} from '../features/api/apiSlice';
import { toast } from 'react-toastify';

const WorkflowBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [workflowTags, setWorkflowTags] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentNode, setCurrentNode] = useState(null);

  const { data: workflowData } = useGetWorkflowByIdQuery(id, {
    skip: !isEditMode,
  });

  const [createWorkflow, { isLoading: isCreating }] = useCreateWorkflowMutation();
  const [updateWorkflow, { isLoading: isUpdating }] = useUpdateWorkflowMutation();

  useEffect(() => {
    if (workflowData?.data) {
      const workflow = workflowData.data;
      setWorkflowName(workflow.name);
      setWorkflowDescription(workflow.description || '');
      setWorkflowTags(workflow.tags?.join(', ') || '');

      if (workflow.currentVersion?.steps) {
        const flowNodes = workflow.currentVersion.steps.map((step) => ({
          id: step.id,
          type: 'default',
          data: { label: step.label || step.id },
          position: step.position || { x: 0, y: 0 },
        }));
        setNodes(flowNodes);
      }

      if (workflow.currentVersion?.edges) {
        const flowEdges = workflow.currentVersion.edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
        }));
        setEdges(flowEdges);
      }
    }
  }, [workflowData, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = (type) => {
    const newNode = {
      id: `${type}-${Date.now()}`,
      type: 'default',
      data: { label: `${type} Step`, type },
      position: { x: Math.random() * 400, y: Math.random() * 400 },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleSave = async () => {
    if (!workflowName) {
      toast.error('Please provide a workflow name');
      return;
    }

    const steps = nodes.map((node) => ({
      id: node.id,
      type: node.data.type || 'auto',
      label: node.data.label,
      position: node.position,
      config: {},
    }));

    const workflowEdges = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label || '',
    }));

    const workflowData = {
      name: workflowName,
      description: workflowDescription,
      tags: workflowTags.split(',').map((tag) => tag.trim()).filter(Boolean),
      steps,
      edges: workflowEdges,
      status: 'active',
    };

    try {
      if (isEditMode) {
        await updateWorkflow({ id, ...workflowData }).unwrap();
        toast.success('Workflow updated successfully');
      } else {
        await createWorkflow(workflowData).unwrap();
        toast.success('Workflow created successfully');
      }
      navigate('/workflows');
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to save workflow');
    }
  };

  return (
    <Box>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/workflows')}
        sx={{ mb: 2 }}
      >
        Back to Workflows
      </Button>

      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          label="Workflow Name"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Description"
          value={workflowDescription}
          onChange={(e) => setWorkflowDescription(e.target.value)}
          multiline
          rows={2}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Tags (comma-separated)"
          value={workflowTags}
          onChange={(e) => setWorkflowTags(e.target.value)}
        />
      </Paper>

      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Add />}
          onClick={() => addNode('approval')}
        >
          Add Approval
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Add />}
          onClick={() => addNode('notification')}
        >
          Add Notification
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Add />}
          onClick={() => addNode('auto')}
        >
          Add Auto Step
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Add />}
          onClick={() => addNode('condition')}
        >
          Add Condition
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={isCreating || isUpdating}
        >
          {isEditMode ? 'Update' : 'Create'} Workflow
        </Button>
      </Box>

      <Paper sx={{ height: 600 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </Paper>
    </Box>
  );
};

export default WorkflowBuilder;

