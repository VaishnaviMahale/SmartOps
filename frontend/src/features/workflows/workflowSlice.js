import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentWorkflow: null,
  nodes: [],
  edges: [],
};

const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    setCurrentWorkflow: (state, action) => {
      state.currentWorkflow = action.payload;
    },
    setNodes: (state, action) => {
      state.nodes = action.payload;
    },
    setEdges: (state, action) => {
      state.edges = action.payload;
    },
    addNode: (state, action) => {
      state.nodes.push(action.payload);
    },
    updateNode: (state, action) => {
      const index = state.nodes.findIndex(n => n.id === action.payload.id);
      if (index !== -1) {
        state.nodes[index] = { ...state.nodes[index], ...action.payload };
      }
    },
    deleteNode: (state, action) => {
      state.nodes = state.nodes.filter(n => n.id !== action.payload);
      state.edges = state.edges.filter(
        e => e.source !== action.payload && e.target !== action.payload
      );
    },
    addEdge: (state, action) => {
      state.edges.push(action.payload);
    },
    deleteEdge: (state, action) => {
      state.edges = state.edges.filter(e => e.id !== action.payload);
    },
    clearWorkflow: (state) => {
      state.currentWorkflow = null;
      state.nodes = [];
      state.edges = [];
    },
  },
});

export const {
  setCurrentWorkflow,
  setNodes,
  setEdges,
  addNode,
  updateNode,
  deleteNode,
  addEdge,
  deleteEdge,
  clearWorkflow,
} = workflowSlice.actions;

export default workflowSlice.reducer;

