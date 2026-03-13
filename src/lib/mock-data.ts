// ============================================================
// Mock Data - Mission Control Dashboard
// All text in Traditional Chinese (繁體中文)
// ============================================================

// --- Types ---

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'recurring' | 'backlog' | 'in_progress' | 'review' | 'done' | 'blocked';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  assignee: string;
  project: string;
  projectColor: string;
  labels: { name: string; color: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  agent: string;
  agentColor: string;
  message: string;
  timestamp: string;
}

export interface ProjectInfo {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'planning' | 'completed';
  progress: number;
  totalTasks: number;
  completedTasks: number;
  assignee: string;
  assigneeColor: string;
  priority: 'high' | 'medium' | 'low';
  updatedAt: string;
  updatedBy: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  size: string;
  wordCount: number;
  content: string;
}

export interface DocEntry {
  id: string;
  filename: string;
  category: string;
  categoryColor: string;
  content: string;
  size: string;
  wordCount: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  description: string;
  skills: string[];
  avatar: string;
  color: string;
  department: string;
}

export interface ScheduledTask {
  id: string;
  name: string;
  time: string;
  color: string;
  frequency: string;
}

// --- Mock Tasks ---

export const MOCK_TASKS: Task[] = [
  {
    id: 'task-001',
    title: '錄製 Claude Code 影片',
    description: '為 YouTube 頻道錄製一部關於 Claude Code 工作流程的教學影片',
    status: 'in_progress',
    priority: 'high',
    assignee: 'Henry',
    project: 'Mission Control',
    projectColor: '#6366f1',
    labels: [{ name: '內容', color: '#8b5cf6' }, { name: '影片', color: '#ec4899' }],
    createdAt: '2026-03-10T08:00:00Z',
    updatedAt: '2026-03-12T10:30:00Z',
  },
  {
    id: 'task-002',
    title: '建構議會系統',
    description: '實作多代理人議會投票與辯論機制',
    status: 'in_progress',
    priority: 'urgent',
    assignee: 'Charlie',
    project: 'Agent 組織基礎設施',
    projectColor: '#4c8dff',
    labels: [{ name: '系統', color: '#22d3ee' }],
    createdAt: '2026-03-08T09:00:00Z',
    updatedAt: '2026-03-12T09:15:00Z',
  },
  {
    id: 'task-003',
    title: '研究 Exo Labs 分散式運算',
    description: '深入研究 Exo Labs 的分散式 GPU 叢集方案，評估可行性',
    status: 'review',
    priority: 'medium',
    assignee: 'Scout',
    project: 'Mission Control',
    projectColor: '#6366f1',
    labels: [{ name: '研究', color: '#f59e0b' }],
    createdAt: '2026-03-07T14:00:00Z',
    updatedAt: '2026-03-11T16:00:00Z',
  },
  {
    id: 'task-004',
    title: '建立 AI 員工計分卡',
    description: '設計並實作代理人績效追蹤計分卡系統',
    status: 'backlog',
    priority: 'medium',
    assignee: 'Echo',
    project: 'Agent 組織基礎設施',
    projectColor: '#4c8dff',
    labels: [{ name: '分析', color: '#34d399' }],
    createdAt: '2026-03-06T10:00:00Z',
    updatedAt: '2026-03-10T11:00:00Z',
  },
  {
    id: 'task-005',
    title: '充實 $10K Mac 計畫',
    description: '整理並完善 10K 美元 Mac 設備投資計畫書',
    status: 'done',
    priority: 'high',
    assignee: 'Quill',
    project: 'Mission Control',
    projectColor: '#6366f1',
    labels: [{ name: '文件', color: '#8b5cf6' }],
    createdAt: '2026-03-05T09:00:00Z',
    updatedAt: '2026-03-09T15:00:00Z',
  },
  {
    id: 'task-006',
    title: '預訓練本地模型',
    description: '使用自訂資料集在本地進行模型微調預訓練',
    status: 'blocked',
    priority: 'high',
    assignee: 'Codex',
    project: '微型 SaaS 工廠',
    projectColor: '#f59e0b',
    labels: [{ name: 'AI', color: '#ef4444' }, { name: '模型', color: '#8b5cf6' }],
    createdAt: '2026-03-04T11:00:00Z',
    updatedAt: '2026-03-11T08:00:00Z',
  },
  {
    id: 'task-007',
    title: '建立活動摘要功能',
    description: '開發每日活動自動摘要生成與推送功能',
    status: 'in_progress',
    priority: 'medium',
    assignee: 'Charlie',
    project: 'Mission Control',
    projectColor: '#6366f1',
    labels: [{ name: '功能', color: '#22d3ee' }],
    createdAt: '2026-03-09T13:00:00Z',
    updatedAt: '2026-03-12T07:00:00Z',
  },
  {
    id: 'task-008',
    title: '設計 Skool 擴充套件 UI',
    description: '為 Skool 平台設計 AI 擴充套件的使用者介面',
    status: 'review',
    priority: 'medium',
    assignee: 'Violet',
    project: 'Skool AI 擴充套件',
    projectColor: '#ec4899',
    labels: [{ name: '設計', color: '#ec4899' }],
    createdAt: '2026-03-08T10:00:00Z',
    updatedAt: '2026-03-11T14:00:00Z',
  },
  {
    id: 'task-009',
    title: '整合 Even G2 數據 API',
    description: '串接 G2 平台評價數據 API 並建立資料管道',
    status: 'backlog',
    priority: 'low',
    assignee: 'Codex',
    project: 'Even G2 整合',
    projectColor: '#34d399',
    labels: [{ name: 'API', color: '#4c8dff' }],
    createdAt: '2026-03-03T09:00:00Z',
    updatedAt: '2026-03-10T10:00:00Z',
  },
  {
    id: 'task-010',
    title: '每週趨勢報告自動化',
    description: '設定自動產生每週科技趨勢分析報告的排程',
    status: 'recurring',
    priority: 'medium',
    assignee: 'Scout',
    project: 'Mission Control',
    projectColor: '#6366f1',
    labels: [{ name: '自動化', color: '#f59e0b' }],
    createdAt: '2026-02-28T08:00:00Z',
    updatedAt: '2026-03-12T06:00:00Z',
  },
  {
    id: 'task-011',
    title: '撰寫代理人使用手冊',
    description: '為所有 AI 代理人撰寫完整的操作指南與最佳實踐',
    status: 'in_progress',
    priority: 'low',
    assignee: 'Quill',
    project: 'Agent 組織基礎設施',
    projectColor: '#4c8dff',
    labels: [{ name: '文件', color: '#8b5cf6' }],
    createdAt: '2026-03-06T14:00:00Z',
    updatedAt: '2026-03-11T17:00:00Z',
  },
  {
    id: 'task-012',
    title: '部署微型 SaaS 登陸頁',
    description: '設計並部署微型 SaaS 產品的行銷登陸頁面',
    status: 'done',
    priority: 'high',
    assignee: 'Pixel',
    project: '微型 SaaS 工廠',
    projectColor: '#f59e0b',
    labels: [{ name: '設計', color: '#ec4899' }, { name: '部署', color: '#34d399' }],
    createdAt: '2026-03-02T10:00:00Z',
    updatedAt: '2026-03-08T18:00:00Z',
  },
];

// --- Mock Activities ---

export const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 'act-001',
    agent: 'Scout',
    agentColor: '#f59e0b',
    message: '完成趨勢雷達掃描，發現 3 項新興 AI 框架值得關注',
    timestamp: '2026-03-12T10:45:00Z',
  },
  {
    id: 'act-002',
    agent: 'Quill',
    agentColor: '#8b5cf6',
    message: '已完成 YouTube 影片腳本初稿《Claude Code 工作流程指南》',
    timestamp: '2026-03-12T10:20:00Z',
  },
  {
    id: 'act-003',
    agent: 'Henry',
    agentColor: '#6366f1',
    message: '已核准議會系統設計文件，準備進入開發階段',
    timestamp: '2026-03-12T09:55:00Z',
  },
  {
    id: 'act-004',
    agent: 'Charlie',
    agentColor: '#4c8dff',
    message: '議會投票模組 API 端點已部署至測試環境',
    timestamp: '2026-03-12T09:30:00Z',
  },
  {
    id: 'act-005',
    agent: 'Echo',
    agentColor: '#34d399',
    message: '代理人效能週報已生成，整體任務完成率提升 12%',
    timestamp: '2026-03-12T09:00:00Z',
  },
  {
    id: 'act-006',
    agent: 'Violet',
    agentColor: '#ec4899',
    message: 'Skool 擴充套件 UI 設計稿 v2 已上傳至共享資料夾',
    timestamp: '2026-03-12T08:30:00Z',
  },
  {
    id: 'act-007',
    agent: 'Codex',
    agentColor: '#ef4444',
    message: '微型 SaaS 後端 API 重構完成，回應速度提升 40%',
    timestamp: '2026-03-12T08:00:00Z',
  },
  {
    id: 'act-008',
    agent: 'Scout',
    agentColor: '#f59e0b',
    message: '晨間研究摘要已送出：涵蓋 LLM 最佳化、邊緣計算趨勢',
    timestamp: '2026-03-12T07:00:00Z',
  },
];

// --- Mock Projects ---

export const MOCK_PROJECTS: ProjectInfo[] = [
  {
    id: 'proj-001',
    name: 'Agent 組織基礎設施',
    description: '建構完整的 AI 代理人組織架構、溝通協議與管理系統',
    status: 'active',
    progress: 42,
    totalTasks: 24,
    completedTasks: 10,
    assignee: 'Charlie',
    assigneeColor: '#4c8dff',
    priority: 'high',
    updatedAt: '2026-03-12T09:30:00Z',
    updatedBy: 'Charlie',
  },
  {
    id: 'proj-002',
    name: 'Mission Control',
    description: '中央任務控制儀表板，統一管理所有代理人、任務與系統狀態',
    status: 'active',
    progress: 65,
    totalTasks: 18,
    completedTasks: 12,
    assignee: 'Henry',
    assigneeColor: '#6366f1',
    priority: 'high',
    updatedAt: '2026-03-12T10:30:00Z',
    updatedBy: 'Henry',
  },
  {
    id: 'proj-003',
    name: 'Skool AI 擴充套件',
    description: '為 Skool 社群平台開發 AI 驅動的擴充套件與自動化工具',
    status: 'active',
    progress: 30,
    totalTasks: 15,
    completedTasks: 5,
    assignee: 'Violet',
    assigneeColor: '#ec4899',
    priority: 'medium',
    updatedAt: '2026-03-11T14:00:00Z',
    updatedBy: 'Violet',
  },
  {
    id: 'proj-004',
    name: '微型 SaaS 工廠',
    description: '快速原型開發與部署小型 SaaS 產品的標準化流程',
    status: 'planning',
    progress: 15,
    totalTasks: 20,
    completedTasks: 3,
    assignee: 'Codex',
    assigneeColor: '#ef4444',
    priority: 'medium',
    updatedAt: '2026-03-10T16:00:00Z',
    updatedBy: 'Codex',
  },
  {
    id: 'proj-005',
    name: 'Even G2 整合',
    description: '與 G2 平台進行深度整合，建立評價數據分析管道',
    status: 'planning',
    progress: 8,
    totalTasks: 12,
    completedTasks: 1,
    assignee: 'Echo',
    assigneeColor: '#34d399',
    priority: 'low',
    updatedAt: '2026-03-09T11:00:00Z',
    updatedBy: 'Echo',
  },
];

// --- Mock Journals ---

export const MOCK_JOURNALS: JournalEntry[] = [
  {
    id: 'journal-001',
    date: '2026-03-12',
    title: '晨間啟動紀錄',
    size: '2.4 KB',
    wordCount: 680,
    content: '今日重點：議會系統進入開發階段，Claude Code 影片錄製準備就緒。代理人團隊運作穩定，Scout 晨間研究已送出。',
  },
  {
    id: 'journal-002',
    date: '2026-03-11',
    title: '系統架構重構筆記',
    size: '3.1 KB',
    wordCount: 920,
    content: '完成 Mission Control 前端架構重構，從單體式改為模組化元件。效能提升約 25%。明日重點：完成議會系統 API 設計。',
  },
  {
    id: 'journal-003',
    date: '2026-03-10',
    title: '代理人績效評估',
    size: '4.2 KB',
    wordCount: 1250,
    content: '本週代理人績效回顧。Scout 研究品質大幅提升，Quill 內容產出穩定。Charlie 在基礎設施方面表現出色。需關注 Codex 的阻塞任務。',
  },
  {
    id: 'journal-004',
    date: '2026-03-08',
    title: 'Skool 擴充套件設計會議',
    size: '1.8 KB',
    wordCount: 520,
    content: '與 Violet 討論 Skool 擴充套件的設計方向。決定採用模組化介面，優先實作社群互動分析功能。',
  },
  {
    id: 'journal-005',
    date: '2026-03-05',
    title: '分散式運算研究摘要',
    size: '5.6 KB',
    wordCount: 1680,
    content: 'Scout 完成 Exo Labs 分散式運算的初步研究。技術可行，但成本效益需進一步評估。建議先進行小規模測試。',
  },
  {
    id: 'journal-006',
    date: '2026-02-28',
    title: '二月總結與三月規劃',
    size: '6.3 KB',
    wordCount: 1890,
    content: '二月成果回顧：完成 Mission Control 基礎版本、建立代理人通訊協議、啟動三個新專案。三月目標：議會系統上線、Skool 擴充套件 MVP。',
  },
];

// --- Mock Documents ---

export const MOCK_DOCS: DocEntry[] = [
  {
    id: 'doc-001',
    filename: 'agent-org-charter.md',
    category: '組織',
    categoryColor: '#4c8dff',
    content: 'AI 代理人組織章程：定義角色、權限、溝通協議與決策流程',
    size: '8.2 KB',
    wordCount: 2400,
  },
  {
    id: 'doc-002',
    filename: 'council-protocol.md',
    category: '議會',
    categoryColor: '#6366f1',
    content: '議會投票協議：多數決規則、辯論流程、緊急決議機制',
    size: '5.1 KB',
    wordCount: 1500,
  },
  {
    id: 'doc-003',
    filename: 'tech-stack-guide.md',
    category: '技術',
    categoryColor: '#22d3ee',
    content: '技術堆疊指南：Next.js、Tailwind、Supabase、Vercel 部署流程',
    size: '4.8 KB',
    wordCount: 1380,
  },
  {
    id: 'doc-004',
    filename: 'brand-guidelines.md',
    category: '品牌',
    categoryColor: '#ec4899',
    content: '品牌視覺指南：色彩系統、字體規範、Logo 使用規則',
    size: '3.5 KB',
    wordCount: 980,
  },
  {
    id: 'doc-005',
    filename: 'saas-playbook.md',
    category: '產品',
    categoryColor: '#f59e0b',
    content: '微型 SaaS 開發手冊：從構想到上線的完整流程與檢核清單',
    size: '7.4 KB',
    wordCount: 2150,
  },
  {
    id: 'doc-006',
    filename: 'security-policy.md',
    category: '安全',
    categoryColor: '#ef4444',
    content: '安全政策文件：API 金鑰管理、存取控制、數據加密標準',
    size: '4.1 KB',
    wordCount: 1200,
  },
];

// --- Mock Team Members ---

export const MOCK_TEAM: TeamMember[] = [
  {
    id: 'member-001',
    name: 'Henry',
    role: '參謀長',
    description: '總體策略規劃與任務協調，負責代理人團隊的日常管理與決策',
    skills: ['策略規劃', '任務管理', '決策分析', '團隊協調'],
    avatar: '🎖️',
    color: '#6366f1',
    department: '指揮部',
  },
  {
    id: 'member-002',
    name: 'Charlie',
    role: '基礎設施工程師',
    description: '負責系統架構設計、後端開發與基礎設施維護',
    skills: ['系統架構', '後端開發', 'DevOps', '資料庫設計'],
    avatar: '⚙️',
    color: '#4c8dff',
    department: '工程部',
  },
  {
    id: 'member-003',
    name: 'Ralph',
    role: '品管經理',
    description: '品質保證與測試流程管理，確保所有產出符合標準',
    skills: ['品質管理', '測試策略', '流程優化', '風險評估'],
    avatar: '🔍',
    color: '#34d399',
    department: '品管部',
  },
  {
    id: 'member-004',
    name: 'Scout',
    role: '研究偵察員',
    description: '市場趨勢研究、競品分析與新技術探索',
    skills: ['市場研究', '趨勢分析', '競品分析', '技術偵察'],
    avatar: '🔭',
    color: '#f59e0b',
    department: '研究部',
  },
  {
    id: 'member-005',
    name: 'Quill',
    role: '內容撰寫員',
    description: '撰寫文章、影片腳本、社群貼文與技術文件',
    skills: ['內容撰寫', '腳本創作', 'SEO 優化', '社群經營'],
    avatar: '✍️',
    color: '#8b5cf6',
    department: '內容部',
  },
  {
    id: 'member-006',
    name: 'Echo',
    role: '數據分析師',
    description: '數據收集、分析與視覺化，提供決策支援洞察',
    skills: ['數據分析', '視覺化', '統計建模', '報告撰寫'],
    avatar: '📊',
    color: '#34d399',
    department: '分析部',
  },
  {
    id: 'member-007',
    name: 'Violet',
    role: '設計師',
    description: 'UI/UX 設計、品牌視覺規劃與使用者體驗研究',
    skills: ['UI 設計', 'UX 研究', '品牌設計', '原型製作'],
    avatar: '🎨',
    color: '#ec4899',
    department: '設計部',
  },
  {
    id: 'member-008',
    name: 'Codex',
    role: '程式開發員',
    description: '全端開發、API 整合與程式碼品質維護',
    skills: ['全端開發', 'API 整合', '程式優化', '技術債管理'],
    avatar: '💻',
    color: '#ef4444',
    department: '工程部',
  },
  {
    id: 'member-009',
    name: 'Pixel',
    role: '視覺設計',
    description: '視覺素材製作、動畫設計與多媒體內容產出',
    skills: ['視覺設計', '動畫製作', '影像處理', '互動設計'],
    avatar: '🖼️',
    color: '#22d3ee',
    department: '設計部',
  },
];

// --- Mock Scheduled Tasks ---

export const MOCK_SCHEDULED: ScheduledTask[] = [
  {
    id: 'sched-001',
    name: '趨勢雷達',
    time: '06:00',
    color: '#f59e0b',
    frequency: '每日 5 次',
  },
  {
    id: 'sched-002',
    name: '晨間啟動',
    time: '07:00',
    color: '#6366f1',
    frequency: '每日',
  },
  {
    id: 'sched-003',
    name: 'YouTube 研究',
    time: '08:00',
    color: '#ef4444',
    frequency: '每日',
  },
  {
    id: 'sched-004',
    name: 'Scout 晨間研究',
    time: '07:30',
    color: '#f59e0b',
    frequency: '每日',
  },
  {
    id: 'sched-005',
    name: '晨間簡報',
    time: '08:30',
    color: '#4c8dff',
    frequency: '每日',
  },
  {
    id: 'sched-006',
    name: '每日摘要',
    time: '17:00',
    color: '#34d399',
    frequency: '每日',
  },
  {
    id: 'sched-007',
    name: 'Quill 腳本撰寫',
    time: '09:00',
    color: '#8b5cf6',
    frequency: '週一至週五',
  },
  {
    id: 'sched-008',
    name: '晚間總結',
    time: '21:00',
    color: '#6366f1',
    frequency: '每日',
  },
  {
    id: 'sched-009',
    name: '週報生成',
    time: '09:00',
    color: '#22d3ee',
    frequency: '每週一',
  },
  {
    id: 'sched-010',
    name: '系統健康檢查',
    time: '12:00',
    color: '#ec4899',
    frequency: '每 6 小時',
  },
];

// --- Always Running ---

export const ALWAYS_RUNNING = [
  { id: 'ar-001', name: '反應監測器', frequency: '每 5 分鐘', color: '#ef4444' },
  { id: 'ar-002', name: '趨勢雷達', frequency: '每日 5 次', color: '#f59e0b' },
  { id: 'ar-003', name: '機會掃描器', frequency: '每日 6 次', color: '#34d399' },
];

// --- Status & Priority Labels ---

export const STATUS_LABELS: Record<Task['status'], string> = {
  recurring: '循環',
  backlog: '待辦',
  in_progress: '進行中',
  review: '審查中',
  done: '已完成',
  blocked: '已阻塞',
};

export const PRIORITY_LABELS: Record<Task['priority'], string> = {
  urgent: '緊急',
  high: '高',
  medium: '中',
  low: '低',
};

export const STATUS_COLORS: Record<Task['status'], string> = {
  recurring: '#8b5cf6',
  backlog: '#5c5c72',
  in_progress: '#4c8dff',
  review: '#f59e0b',
  done: '#34d399',
  blocked: '#ef4444',
};

export const PRIORITY_COLORS: Record<Task['priority'], string> = {
  urgent: '#ef4444',
  high: '#f59e0b',
  medium: '#4c8dff',
  low: '#5c5c72',
};
