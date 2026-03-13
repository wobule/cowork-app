'use client';

interface Agent {
  name: string;
  emoji: string;
  role: string;
  description: string;
  skills: string[];
  color: string;
}

const leader: Agent = {
  name: 'Henry',
  emoji: '🦉',
  role: '參謀長',
  description: '協調、委派、維持運作順暢。人機之間的第一聯絡人。',
  skills: ['協調', '清晰度', '委派'],
  color: '#4c8dff',
};

const operations: Agent[] = [
  {
    name: 'Charlie',
    emoji: '🔧',
    role: '基礎設施工程師',
    description: '基礎設施與自動化專家。確保一切系統穩定運行。',
    skills: ['程式開發', '基礎設施', '自動化'],
    color: '#f59e0b',
  },
  {
    name: 'Ralph',
    emoji: '🔨',
    role: '品管經理',
    description: '檢查工作、簽核或退回。務實的品質管控。',
    skills: ['品質保證', '監控', '演示錄製'],
    color: '#ef4444',
  },
];

const agents: Agent[] = [
  {
    name: 'Scout',
    emoji: '🔍',
    role: '研究偵察員',
    description: '深入挖掘趨勢與信號，為團隊提供最新情報。',
    skills: ['研究', '趨勢分析', '數據收集'],
    color: '#8b8b9e',
  },
  {
    name: 'Quill',
    emoji: '✍️',
    role: '內容撰寫員',
    description: '將想法轉化為文字，負責所有內容產出。',
    skills: ['撰寫', '編輯', '腳本'],
    color: '#34d399',
  },
  {
    name: 'Echo',
    emoji: '📊',
    role: '數據分析師',
    description: '解讀數據，發現模式，提供可執行的洞察。',
    skills: ['分析', '報告', '洞察'],
    color: '#eab308',
  },
  {
    name: 'Violet',
    emoji: '🎨',
    role: '產品設計師',
    description: '設計直覺且美觀的使用者體驗。',
    skills: ['設計', 'UI/UX', '原型'],
    color: '#a78bfa',
  },
  {
    name: 'Codex',
    emoji: '💻',
    role: '程式開發員',
    description: '將設計與需求轉化為可運行的程式碼。',
    skills: ['開發', '除錯', '架構'],
    color: '#22d3ee',
  },
  {
    name: 'Pixel',
    emoji: '🎮',
    role: '視覺設計師',
    description: '創造令人驚豔的視覺內容與品牌形象。',
    skills: ['插畫', '動畫', '品牌'],
    color: '#ec4899',
  },
];

function AgentCard({ agent, large = false }: { agent: Agent; large?: boolean }) {
  return (
    <div
      className={`bg-[#1a1a24] border border-[#2a2a3a] rounded-lg p-5 flex flex-col transition-all hover:border-[#3a3a4a] ${
        large ? 'max-w-md mx-auto' : ''
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
          style={{ backgroundColor: agent.color + '22', border: `2px solid ${agent.color}44` }}
        >
          {agent.emoji}
        </div>
        <div>
          <div className="text-[#e8e8ed] font-semibold text-base">{agent.name}</div>
          <div className="text-[#8b8b9e] text-sm">{agent.role}</div>
        </div>
      </div>
      <p className="text-sm text-[#8b8b9e] leading-relaxed mb-4 flex-1">{agent.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {agent.skills.map((skill) => (
            <span
              key={skill}
              className="px-2 py-0.5 rounded-full text-[11px] font-medium"
              style={{
                backgroundColor: agent.color + '18',
                color: agent.color,
                border: `1px solid ${agent.color}33`,
              }}
            >
              {skill}
            </span>
          ))}
        </div>
        <button
          className="text-xs text-[#5c5c72] hover:text-[#8b8b9e] transition-colors flex-shrink-0 ml-2"
        >
          角色卡 →
        </button>
      </div>
    </div>
  );
}

function DepartmentDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 my-6">
      <div className="flex-1 border-t border-[#2a2a3a]" />
      <span className="text-sm text-[#5c5c72] font-medium whitespace-nowrap">{label}</span>
      <div className="flex-1 border-t border-[#2a2a3a]" />
    </div>
  );
}

export default function TeamPage() {
  return (
    <div className="min-h-full bg-[#0a0a0f] p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Quote Banner */}
        <div className="border border-[#2a2a3a] rounded-lg p-5 mb-8 border-l-4 border-l-[#4c8dff]">
          <p className="text-[#8b8b9e] italic text-sm leading-relaxed">
            「一個為我工作、全天候創造價值的自主 AI 代理人組織」
          </p>
        </div>

        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#e8e8ed] mb-2">認識團隊</h1>
          <p className="text-[#8b8b9e] text-base mb-4">
            9 個 AI 代理人，橫跨 3 台機器，各有真實角色與個性
          </p>
          <p className="text-sm text-[#5c5c72] leading-relaxed max-w-2xl">
            這不只是一組工具，而是一個有組織架構、有分工、有個性的 AI
            團隊。每位代理人都有明確的職責範圍、技能專長，以及與其他成員的協作方式。他們全天候運作，從研究、撰寫、設計到開發，共同推動專案前進。
          </p>
        </div>

        {/* Leader */}
        <AgentCard agent={leader} large />

        {/* Operations Department */}
        <DepartmentDivider label="🛠 運營部門 (Mac Studio 2)" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {operations.map((agent) => (
            <AgentCard key={agent.name} agent={agent} />
          ))}
        </div>

        {/* Signal Flow */}
        <DepartmentDivider label="→ 輸入信號 ——— 輸出動作 ↓" />

        {/* Agent Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgentCard key={agent.name} agent={agent} />
          ))}
        </div>
      </div>
    </div>
  );
}
