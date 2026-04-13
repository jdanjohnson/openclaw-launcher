import { useState } from "react";

interface Skill {
  id: string;
  name: string;
  author: string;
  description: string;
  category: string;
  uses: number;
  rating: number;
  isOwn: boolean;
}

const DEMO_SKILLS: Skill[] = [
  {
    id: "1",
    name: "Summarize Meeting Notes",
    author: "Sarah K.",
    description: "Takes raw meeting transcripts and produces structured summaries with action items, decisions, and follow-ups.",
    category: "Productivity",
    uses: 342,
    rating: 4.8,
    isOwn: false,
  },
  {
    id: "2",
    name: "Generate API Documentation",
    author: "You",
    description: "Scans codebase endpoints and generates OpenAPI-compliant documentation with examples and schemas.",
    category: "Engineering",
    uses: 156,
    rating: 4.6,
    isOwn: true,
  },
  {
    id: "3",
    name: "Competitive Analysis Report",
    author: "Marcus T.",
    description: "Monitors competitor websites, pricing pages, and social channels to produce weekly intelligence briefs.",
    category: "Research",
    uses: 89,
    rating: 4.4,
    isOwn: false,
  },
  {
    id: "4",
    name: "Draft Outbound Emails",
    author: "Priya M.",
    description: "Generates personalized cold outreach sequences based on prospect LinkedIn profiles and company data.",
    category: "Sales",
    uses: 478,
    rating: 4.9,
    isOwn: false,
  },
  {
    id: "5",
    name: "Code Migration Assistant",
    author: "You",
    description: "Helps migrate codebases between frameworks by analyzing patterns and generating equivalent code.",
    category: "Engineering",
    uses: 67,
    rating: 4.3,
    isOwn: true,
  },
  {
    id: "6",
    name: "Incident Postmortem Writer",
    author: "David L.",
    description: "Collects incident timeline data and generates structured postmortem reports with root cause analysis.",
    category: "Operations",
    uses: 203,
    rating: 4.7,
    isOwn: false,
  },
  {
    id: "7",
    name: "Social Media Scheduler",
    author: "Aisha R.",
    description: "Creates platform-optimized posts from a content brief and schedules across Twitter, LinkedIn, and more.",
    category: "Marketing",
    uses: 521,
    rating: 4.5,
    isOwn: false,
  },
  {
    id: "8",
    name: "Database Query Builder",
    author: "Chen W.",
    description: "Converts natural language questions into optimized SQL queries with explanations of the logic.",
    category: "Engineering",
    uses: 312,
    rating: 4.8,
    isOwn: false,
  },
];

const CATEGORIES = ["All", "Engineering", "Productivity", "Sales", "Research", "Marketing", "Operations"];

interface Props {
  onClose: () => void;
}

export default function SkillsBoard({ onClose }: Props) {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [showOwn, setShowOwn] = useState(false);

  const filtered = DEMO_SKILLS.filter((s) => {
    if (showOwn && !s.isOwn) return false;
    if (category !== "All" && s.category !== category) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl max-h-[85vh] glass rounded-3xl flex flex-col animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-black/5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Skills Board</h2>
            <p className="text-sm text-gray-400 mt-1">Browse and use skills created by your team</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 p-5 border-b border-black/5 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search skills..."
            className="glass-input px-4 py-2 text-sm w-52"
          />
          <div className="flex items-center gap-1 overflow-x-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className="px-4 py-2 text-sm rounded-xl whitespace-nowrap transition-all font-medium"
                style={{
                  background: category === cat ? "rgba(242,84,31,0.15)" : "rgba(0,0,0,0.03)",
                  color: category === cat ? "rgb(242,84,31)" : "rgba(0,0,0,0.4)",
                  border: `1px solid ${category === cat ? "rgba(242,84,31,0.25)" : "rgba(0,0,0,0.05)"}`,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowOwn(!showOwn)}
            className="ml-auto text-sm px-4 py-2 rounded-xl transition-all font-medium"
            style={{
              background: showOwn ? "rgba(242,84,31,0.15)" : "rgba(0,0,0,0.03)",
              color: showOwn ? "rgb(242,84,31)" : "rgba(0,0,0,0.4)",
              border: `1px solid ${showOwn ? "rgba(242,84,31,0.25)" : "rgba(0,0,0,0.05)"}`,
            }}
          >
            My Skills
          </button>
        </div>

        {/* Skills grid */}
        <div className="flex-1 overflow-y-auto glass-scroll p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((skill) => (
              <div
                key={skill.id}
                className="p-5 rounded-2xl border-2 border-white/60 bg-white/50 hover:bg-white/70 hover:border-white/80 transition-all group cursor-pointer hover:shadow-lg hover:scale-[1.02]"
                style={{ backdropFilter: "blur(12px)" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-[rgb(242,84,31)] transition-colors">
                      {skill.name}
                    </h3>
                    {skill.isOwn && (
                      <span className="text-xs px-2 py-0.5 rounded-lg bg-[rgba(242,84,31,0.1)] text-[rgb(242,84,31)] font-semibold">yours</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-400">
                    <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    {skill.rating}
                  </div>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{skill.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs px-3 py-1 rounded-full bg-black/5 text-gray-500 font-medium">{skill.category}</span>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <span>{skill.uses} uses</span>
                    <span>by {skill.author}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-black/5 flex items-center justify-between">
          <span className="text-sm text-gray-400 font-medium">{filtered.length} skills</span>
          <button className="btn-accent px-5 py-3 text-sm">
            + Create Skill
          </button>
        </div>
      </div>
    </div>
  );
}
