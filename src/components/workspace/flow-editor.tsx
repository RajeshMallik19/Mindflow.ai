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
import { CirclePlay, SquarePlus, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FLOW_NODE_TYPES } from "./flow-nodes";

export type FlowData = { nodes: Node[]; edges: Edge[] };

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

type LabelDialogState =
  | { open: false }
  | { open: true; mode: "add"; nodeType: keyof typeof FLOW_NODE_TYPES }
  | { open: true; mode: "rename"; nodeId: string };

function FlowCanvas({
  projectId,
  initial,
  artifactType,
  artifactTitle,
}: {
  projectId: string;
  initial: FlowData;
  artifactType: string;
  artifactTitle: string;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [labelDialog, setLabelDialog] = useState<LabelDialogState>({ open: false });
  const [labelDraft, setLabelDraft] = useState("");

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  function openAddDialog(nodeType: keyof typeof FLOW_NODE_TYPES) {
    setLabelDraft("");
    setLabelDialog({ open: true, mode: "add", nodeType });
  }

  function openRenameDialog(node: Node) {
    setLabelDraft(String(node.data.label ?? ""));
    setLabelDialog({ open: true, mode: "rename", nodeId: node.id });
  }

  function submitLabelDialog() {
    const label = labelDraft.trim();
    if (!label || !labelDialog.open) return;

    if (labelDialog.mode === "add") {
      setNodes((nds) => [
        ...nds,
        {
          id: nextNodeId(),
          type: labelDialog.nodeType,
          position: { x: 120 + Math.random() * 300, y: 120 + nds.length * 90 },
          data: { label },
        },
      ]);
    } else {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === labelDialog.nodeId ? { ...n, data: { ...n.data, label } } : n,
        ),
      );
    }

    setLabelDialog({ open: false });
  }

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          type: artifactType,
          title: artifactTitle,
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
        <Button size="sm" variant="outline" onClick={() => openAddDialog("start")}>
          <CirclePlay /> Start
        </Button>
        <Button size="sm" variant="outline" onClick={() => openAddDialog("action")}>
          <SquarePlus /> Action
        </Button>
        <Button size="sm" variant="outline" onClick={() => openAddDialog("decision")}>
          <GitBranch /> Decision
        </Button>
        <div className="flex-1" />
        {savedAt && (
          <span className="text-xs text-muted-foreground">Saved at {savedAt}</span>
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
          onNodeDoubleClick={(_, node) => openRenameDialog(node)}
          nodeTypes={FLOW_NODE_TYPES}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      <Dialog
        open={labelDialog.open}
        onOpenChange={(open) => !open && setLabelDialog({ open: false })}
      >
        <DialogContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitLabelDialog();
            }}
          >
            <DialogHeader>
              <DialogTitle>
                {labelDialog.open && labelDialog.mode === "add"
                  ? `New ${labelDialog.nodeType} node`
                  : "Rename node"}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={labelDraft}
                onChange={(e) => setLabelDraft(e.target.value)}
                placeholder="Label"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function FlowEditor(props: {
  projectId: string;
  initial?: FlowData;
  artifactType: string;
  artifactTitle: string;
}) {
  return (
    <ReactFlowProvider>
      <FlowCanvas
        projectId={props.projectId}
        initial={props.initial ?? DEFAULT_FLOW}
        artifactType={props.artifactType}
        artifactTitle={props.artifactTitle}
      />
    </ReactFlowProvider>
  );
}
