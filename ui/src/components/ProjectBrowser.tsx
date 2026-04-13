import { useState } from "react";

interface Project {
  id: string;
  name: string;
  author: string;
  org: string;
  description: string;
  agents: number;
  stars: number;
  tags: string[];
  published: boolean;
}

const DEMO_PROJECTS: Project[] = [
  {
    id: "1",
    name: "Sales Pipeline Automator",
    author: "Sarah K.",
    org: "Acme Corp",
    description: "Automates lead scoring, email outreach sequencing, and CRM updates using a fleet of 4 worker agents.",
    agents: 4,
    stars: 23,
    tags: ["sales", "automation", "crm"],
    published: true,
  },
  {
    id: "2",
    name: "Code Review Assistant",
    author: "Marcus T.",
    org: "Your Org",
    description: "Automated PR reviews with security scanning, style checks, and intelligent suggestions.",
    agents: 2,
    stars: 45,
    tags: ["engineering", "code-review", "security"],
    published: false,
  },
  {
    id: "3",
    name: "Customer Support Triage",
    author: "Priya M.",
    org: "Your Org",
    description: "Routes and categorizes support tickets, drafts initial responses, and escalates critical issues.",
    agents: 3,
    stars: 18,
    tags: ["support", "triage", "nlp"],
    published: false,
  },
  {
    id: "4",
    name: "Market Research Bot",
    author: "David L.",
    org: "StartupCo",
    description: "Continuously monitors competitors, aggregates news, and generates weekly intelligence reports.",
    agents: 2,
    stars: 31,
    tags: ["research", "monitoring", "reports"],
    published: true,
  },
  {
    id: "5",
    name: "Content Pipeline",
    author: "Aisha R.",
    org: "MediaGroup",
    description: "End-to-end content creation from ideation to publishing across blog, social, and newsletter.",
    agents: 5,
    stars: 67,
    tags: ["content", "social", "marketing"],
    published: true,
  },
  {
    id: "6",
    name: "Data Quality Monitor",
    author: "Chen W.",
    org: "Your Org",
    description: "Scans databases for anomalies, missing values, and drift. Auto-generates cleanup scripts.",
    agents: 1,
    stars: 12,
    tags: ["data", "quality", "monitoring"],
    published: false,
  },
];

interface Props {
  onClose: () => void;
}

export default function ProjectBrowser({ onClose }: Props) {
  const [filter, setFilter] = useState<"all" | "org" | "published">("all");
  const [search, setSearch] = useState("");

  const filtered = DEMO_PROJECTS.filter((p) => {
    if (filter === "org") return p.org === "Your Org";
    if (filter === "published") return p.published;
    return true;
  }).filter((p) =>
    search === "" ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.tags.some((t) => t.includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl max-h-[85vh] glass rounded-2xl flex flex-col animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h2 className="text-lg font-semibold text-white">Project Browser</h2>
            <p className="text-xs text-white/40 mt-0.5">Explore agent projects from your org and the community</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 p-4 border-b border-white/5">
          <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
            {(["all", "org", "published"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1.5 text-xs rounded-lg transition-all"
                style={{
                  background: filter === f ? "rgba(242,84,31,0.2)" : "transparent",
                  color: filter === f ? "rgb(242,84,31)" : "rgba(255,255,255,0.4)",
                }}
              >
                {f === "all" ? "All" : f === "org" ? "My Org" : "Published"}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="glass-input px-3 py-1.5 text-sm flex-1"
          />
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto glass-scroll p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((project) => (
              <button
                key={project.id}
                className="text-left p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-white group-hover:text-[rgb(242,84,31)] transition-colors">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-white/30">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    {project.stars}
                  </div>
                </div>
                <p className="text-xs text-white/40 leading-relaxed mb-3">{project.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {project.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/30">
                    <span>{project.agents} agents</span>
                    <span>·</span>
                    <span>{project.author}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
