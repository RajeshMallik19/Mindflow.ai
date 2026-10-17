"use client";

import { useCallback, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { FLOW_NODE_TYPES } from "./flow-nodes";

type FlowData = { nodes: Node[]; edges: Edge[] };

const DEFAULT_FLOW: FlowData = {
  nodes: [
    {
      id: "start",
      type: "start",
      position: { x: 250, y: 0 },
      data: { label: "Open app" },
    },
  ],
  edges: [],
};

let nodeCounter = 0;
function nextNodeId() {
  nodeCounter += 1;
  return `node-${Date.now()}-${nodeCounter}`;
}

function FlowCanvas({
  projectId,
  initial,
}: {
  projectId: string;
  initial: FlowData;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  function addNode(type: keyof typeof FLOW_NODE_TYPES) {
    const label = window.prompt(`Label for this ${type} node?`, type);
    if (label === null) return;
    setNodes((nds) => [
      ...nds,
      {
        id: nextNodeId(),
        type,
        position: { x: 120 + Math.random() * 300, y: 120 + nds.length * 90 },
        data: { label },
      },
    ]);
  }

  function renameNode(node: Node) {
    const label = window.prompt("New label", String(node.data.label ?? ""));
    if (label === null) return;
    setNodes((nds) =>
      nds.map((n) => (n.id === node.id ? { ...n, data: { ...n.data, label } } : n)),
    );
  }

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          type: "user_flow",
          title: "User flow",
          content: JSON.stringify({ nodes, edges }),
        }),
      });
      setSavedAt(new Date().toLocaleTimeString());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <Button size="sm" variant="outline" onClick={() => addNode("start")}>
          + Start
        </Button>
        <Button size="sm" variant="outline" onClick={() => addNode("action")}>
          + Action
        </Button>
        <Button size="sm" variant="outline" onClick={() => addNode("decision")}>
          + Decision
        </Button>
        <div className="flex-1" />
        {savedAt && (
          <span className="text-xs text-zinc-500">Saved at {savedAt}</span>
        )}
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={(_, node) => renameNode(node)}
          nodeTypes={FLOW_NODE_TYPES}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}

export function FlowEditor(props: { projectId: string; initial?: FlowData }) {
  return (
    <ReactFlowProvider>
      <FlowCanvas projectId={props.projectId} initial={props.initial ?? DEFAULT_FLOW} />
    </ReactFlowProvider>
  );
}
