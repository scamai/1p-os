"use client";

import { useCallback, useRef, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  type OnConnect,
  MarkerType,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { TriggerNode } from "./nodes/TriggerNode";
import { AgentStepNode } from "./nodes/AgentStepNode";
import { ConditionNode } from "./nodes/ConditionNode";
import { OutputNode } from "./nodes/OutputNode";
import dagre from "dagre";

// ── Types ──

type AgentStatus = "working" | "idle" | "paused" | "needs_input" | "error";

interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  tasksToday: number;
  costToday: number;
}

interface Department {
  id: string;
  name: string;
  icon: string;
  agents: Agent[];
  color: string;
}

interface Workflow {
  id: string;
  name: string;
  trigger: string;
  steps: {
    agentId: string;
    agentName: string;
    action: string;
    department: string;
    outputTo?: string;
  }[];
}

interface WorkflowCanvasProps {
  departments: Department[];
  workflows: Workflow[];
}

// ── Node types registry ──

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  agentStep: AgentStepNode,
  condition: ConditionNode,
  output: OutputNode,
};

// ── Dagre auto-layout ──

const NODE_WIDTH = 260;
const NODE_HEIGHT = 100;

function layoutNodes(nodes: Node[], edges: Edge[], direction = "TB"): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80 });

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });
}

// ── Build initial nodes/edges from workflow data ──

function buildFlowFromWorkflows(
  workflows: Workflow[],
  departments: Department[]
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const usedAgentIds = new Set<string>();

  // Flatten all agents for lookup
  const allAgents = departments.flatMap((d) =>
    d.agents.map((a) => ({ ...a, department: d.name, deptColor: d.color, deptIcon: d.icon }))
  );

  let yOffset = 0;

  for (const wf of workflows) {
    // Trigger node
    const triggerId = `trigger-${wf.id}`;
    nodes.push({
      id: triggerId,
      type: "trigger",
      position: { x: 0, y: yOffset },
      data: {
        label: wf.name,
        trigger: wf.trigger,
        workflowId: wf.id,
      },
    });

    let prevNodeId = triggerId;

    for (const step of wf.steps) {
      // Use unique node id per workflow step to allow same agent in multiple workflows
      const nodeId = `${wf.id}-${step.agentId}`;
      const agentInfo = allAgents.find((a) => a.id === step.agentId);

      if (!usedAgentIds.has(nodeId)) {
        nodes.push({
          id: nodeId,
          type: "agentStep",
          position: { x: 0, y: 0 },
          data: {
            agentName: step.agentName,
            action: step.action,
            department: step.department,
            deptColor: agentInfo?.deptColor ?? "#71717a",
            deptIcon: agentInfo?.deptIcon ?? "?",
            status: agentInfo?.status ?? "idle",
            tasksToday: agentInfo?.tasksToday ?? 0,
            costToday: agentInfo?.costToday ?? 0,
          },
        });
        usedAgentIds.add(nodeId);
      }

      edges.push({
        id: `e-${prevNodeId}-${nodeId}`,
        source: prevNodeId,
        target: nodeId,
        animated: true,
        style: { stroke: agentInfo?.deptColor ?? "#71717a", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: agentInfo?.deptColor ?? "#71717a" },
      });

      prevNodeId = nodeId;
    }

    // Output node at end of workflow
    const outputId = `output-${wf.id}`;
    nodes.push({
      id: outputId,
      type: "output",
      position: { x: 0, y: 0 },
      data: { label: "Complete" },
    });
    edges.push({
      id: `e-${prevNodeId}-${outputId}`,
      source: prevNodeId,
      target: outputId,
      animated: false,
      style: { stroke: "#22c55e", strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#22c55e" },
    });

    yOffset += 400;
  }

  // Auto-layout with dagre
  const laid = layoutNodes(nodes, edges);
  return { nodes: laid, edges };
}

// ── Palette items (draggable) ──

const PALETTE_ITEMS = [
  { type: "trigger", label: "Trigger", icon: "⚡", desc: "Start a workflow" },
  { type: "agentStep", label: "Agent Step", icon: "🤖", desc: "AI agent action" },
  { type: "condition", label: "Condition", icon: "◇", desc: "If/else branch" },
  { type: "output", label: "Output", icon: "✓", desc: "End / result" },
];

function PaletteItem({ type, label, icon, desc }: typeof PALETTE_ITEMS[0]) {
  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/reactflow-type", type);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex items-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 cursor-grab active:cursor-grabbing hover:border-zinc-300 hover:shadow-sm transition-all"
    >
      <span className="text-base">{icon}</span>
      <div>
        <p className="text-[12px] font-medium text-zinc-800">{label}</p>
        <p className="text-[10px] text-zinc-400">{desc}</p>
      </div>
    </div>
  );
}

// ── Main Canvas ──

let nodeIdCounter = 100;

export function WorkflowCanvas({ departments, workflows }: WorkflowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReturnType<typeof useRef<any>>["current"]>(null);

  const initial = useMemo(
    () => buildFlowFromWorkflows(workflows, departments),
    [workflows, departments]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: "#71717a", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#71717a" },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("application/reactflow-type");
      if (!type || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      const newId = `new-${++nodeIdCounter}`;

      const dataByType: Record<string, Record<string, unknown>> = {
        trigger: { label: "New Trigger", trigger: "Configure trigger..." },
        agentStep: {
          agentName: "New Agent",
          action: "Configure action...",
          department: "General",
          deptColor: "#71717a",
          deptIcon: "G",
          status: "idle",
          tasksToday: 0,
          costToday: 0,
        },
        condition: { label: "Condition", condition: "if true" },
        output: { label: "Output" },
      };

      const newNode: Node = {
        id: newId,
        type,
        position,
        data: dataByType[type] ?? { label: type },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance, setNodes]
  );

  // Auto-layout button
  const autoLayout = useCallback(() => {
    setNodes((nds) => layoutNodes([...nds], edges));
    setTimeout(() => reactFlowInstance?.fitView({ padding: 0.2 }), 50);
  }, [edges, setNodes, reactFlowInstance]);

  return (
    <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[500px]">
      {/* Sidebar palette */}
      <div className="w-[180px] shrink-0 space-y-2">
        <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide px-1">
          Drag to canvas
        </p>
        {PALETTE_ITEMS.map((item) => (
          <PaletteItem key={item.type} {...item} />
        ))}

        <div className="pt-4 border-t border-zinc-200 mt-4">
          <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide px-1 mb-2">
            Quick actions
          </p>
          <button
            onClick={autoLayout}
            className="flex w-full items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[12px] font-medium text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
            Auto-layout
          </button>
        </div>

        {/* Stats */}
        <div className="pt-4 border-t border-zinc-200 mt-4 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] text-zinc-500">Nodes</span>
            <span className="text-[11px] font-mono font-medium text-zinc-700">{nodes.length}</span>
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] text-zinc-500">Connections</span>
            <span className="text-[11px] font-mono font-medium text-zinc-700">{edges.length}</span>
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] text-zinc-500">Workflows</span>
            <span className="text-[11px] font-mono font-medium text-zinc-700">{workflows.length}</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={reactFlowWrapper}
        className="flex-1 rounded-xl border border-zinc-200 overflow-hidden bg-white"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          defaultEdgeOptions={{
            animated: true,
            style: { strokeWidth: 2 },
          }}
          proOptions={{ hideAttribution: true }}
          deleteKeyCode={["Backspace", "Delete"]}
          snapToGrid
          snapGrid={[16, 16]}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e4e4e7" />
          <Controls
            showInteractive={false}
            className="!bg-white !border-zinc-200 !shadow-md [&>button]:!border-zinc-200 [&>button]:!bg-white [&>button:hover]:!bg-zinc-50"
          />
          <MiniMap
            nodeColor={(n) => {
              if (n.type === "trigger") return "#3b82f6";
              if (n.type === "output") return "#22c55e";
              if (n.type === "condition") return "#f59e0b";
              return (n.data as Record<string, unknown>)?.deptColor as string ?? "#71717a";
            }}
            maskColor="rgba(0,0,0,0.08)"
            className="!bg-zinc-50 !border-zinc-200"
          />
          <Panel position="top-right" className="flex gap-2">
            <span className="rounded-md bg-zinc-900/80 px-2.5 py-1 text-[10px] font-medium text-zinc-300 backdrop-blur-sm">
              Drag nodes from palette · Connect handles · Delete with Backspace
            </span>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
