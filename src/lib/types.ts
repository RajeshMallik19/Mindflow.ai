export type Project = {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
};

export type SubagentId =
  | "research"
  | "ia-maker"
  | "persona-maker"
  | "user-stories-maker"
  | "design-agent";

export type Subagent = {
  id: SubagentId;
  name: string;
  title: string;
  description: string;
};
