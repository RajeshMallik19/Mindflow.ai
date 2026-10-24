import ReactMarkdown from "react-markdown";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  AiInteractionDesign,
  Personas,
  ProblemFraming,
  ResearchBrief,
  UserStories,
  UxStrategy,
  Wireframes,
} from "@/lib/pipeline";

export function ResearchView({ data }: { data: ResearchBrief }) {
  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardContent className="prose-sm [&_*]:my-1.5 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-4">
          <ReactMarkdown>{data.summary}</ReactMarkdown>
        </CardContent>
      </Card>

      {data.keyFindings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Key findings</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-4 text-sm">
              {data.keyFindings.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {data.openQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Open questions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              {data.openQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function PersonasView({ data }: { data: Personas }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {data.personas.map((p, i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle className="text-sm">{p.name}</CardTitle>
            <CardDescription>{p.role}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p className="text-muted-foreground">{p.context}</p>
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Goals
              </span>
              <div className="mt-1 flex flex-wrap gap-1">
                {p.goals.map((g, gi) => (
                  <Badge key={gi} variant="secondary">
                    {g}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Frustrations
              </span>
              <div className="mt-1 flex flex-wrap gap-1">
                {p.frustrations.map((f, fi) => (
                  <Badge key={fi} variant="outline">
                    {f}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function UserStoriesView({ data }: { data: UserStories }) {
  return (
    <div className="flex flex-col gap-3">
      {data.stories.map((s, i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle className="text-sm">{s.title}</CardTitle>
            <CardDescription>
              As a {s.asA}, I want {s.iWant}, so that {s.soThat}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Acceptance criteria
            </span>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
              {s.acceptanceCriteria.map((ac, ai) => (
                <li key={ai}>{ac}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ProblemFramingView({ data }: { data: ProblemFraming }) {
  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Problem statement</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{data.problemStatement}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Assumptions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
            {data.assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Opportunity areas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {data.opportunityAreas.map((o, i) => (
              <Badge key={i} variant="secondary">
                {o}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function UxStrategyView({ data }: { data: UxStrategy }) {
  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-4 text-sm">
            {data.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Interaction principles</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
            {data.interactionPrinciples.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export function AiInteractionDesignView({ data }: { data: AiInteractionDesign }) {
  return (
    <div className="flex flex-col gap-3">
      {data.behaviors.map((b, i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle className="text-sm">{b.scenario}</CardTitle>
            <CardDescription>{b.aiResponse}</CardDescription>
          </CardHeader>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Fallbacks</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
            {data.fallbacks.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Confidence handling</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{data.confidenceHandling}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function WireframesView({ data }: { data: Wireframes }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {data.screens.map((s, i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle className="text-sm">{s.name}</CardTitle>
            <CardDescription>{s.purpose}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              {s.sections.map((sec, si) => (
                <li key={si}>{sec}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
