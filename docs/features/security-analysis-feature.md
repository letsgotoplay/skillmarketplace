# Security Analysis Feature

> 基于 [skillstore.io](https://skillstore.io/zh-hans/docs/security) 的安全分析系统研究与现有实现对比

## 概述

安全分析系统是 AI Skill 市场的核心防御层，确保所有提交的技能在发布前都经过全面的自动化安全分析。该系统集成了 AI 驱动的代码分析、模式检测和风险评估。

---

## 1. 详细代码对比分析

### 1.1 架构对比

| 层级 | SkillHub (当前) | Skillstore (参考) |
|------|-----------------|-------------------|
| **扫描层** | `scanner.ts` (67+ patterns) | CLI 内置 scanner |
| **AI 分析** | `ai-analyzer.ts` (Claude API) | AI-powered analysis |
| **配置管理** | `SecurityConfig` model + `prompts.ts` | Schema-driven |
| **数据存储** | `SecurityScan` model | `skill-report.json` |
| **工作流** | BullMQ 队列 | GitHub Actions |

### 1.2 模式扫描对比

#### SkillHub 当前实现 (`scanner.ts:40-372`)

```typescript
// 当前实现：67+ 危险模式，分 11 个类别
const DANGEROUS_PATTERNS = [
  // Code Injection (5 patterns)
  { pattern: /eval\s*\(/gi, severity: 'high', category: 'Code Injection' },
  { pattern: /Function\s*\(/gi, severity: 'high', category: 'Code Injection' },
  { pattern: /exec\s*\(/gi, severity: 'critical', category: 'Command Injection' },
  { pattern: /spawn\s*\(/gi, severity: 'high', category: 'Command Injection' },

  // Credentials (8 patterns)
  { pattern: /password\s*=\s*['"`][^'"`]+['"`]/gi, severity: 'critical', category: 'Credentials' },
  { pattern: /api[_-]?key\s*=\s*['"`][^'"`]+['"`]/gi, severity: 'critical', category: 'Credentials' },

  // ... 更多模式
];
```

**特点**:
- ✅ 67+ 模式，覆盖全面
- ✅ 误报过滤 (注释、代码块、示例上下文)
- ✅ 占位符检测 (`isPlaceholderValue()`)
- ✅ 代码片段提取 (`extractCodeSnippet()`)
- ❌ 缺少风险因素分类
- ❌ 缺少证据跟踪

#### Skillstore 参考实现

```json
// 5 种风险因素分类
{
  "risk_factors": ["scripts", "network", "filesystem", "env_access", "external_commands"],
  "risk_factor_evidence": [
    {
      "factor": "network",
      "evidence": [
        { "file": "src/api.ts", "line_start": 15, "line_end": 20 }
      ]
    }
  ]
}
```

**特点**:
- ✅ 风险因素分类 (5 种)
- ✅ 证据跟踪 (文件 + 行号)
- ✅ 用户友好的风险指示器
- ❌ 模式数量可能较少

### 1.3 AI 分析对比

#### SkillHub 当前实现 (`ai-analyzer.ts`)

```typescript
// 当前实现
export async function analyzeWithAI(
  skillBuffer: Buffer,
  config?: AIAnalysisConfig
): Promise<AISecurityReport> {
  // 特点：
  // 1. 文件大小限制 (100KB/file, 500KB total)
  // 2. 智能截断 (保留敏感内容)
  // 3. 安全热点检测 (findSecurityHotspots)
  // 4. 结果验证 (validateFindings - 防止幻觉)
  // 5. 可配置规则 (config.rules)
}
```

**输出结构**:
```typescript
interface AISecurityReport {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  threats: SecurityFinding[];     // 统一数组
  recommendations: string[];
  confidence: number;
  modelUsed: string;
  blockExecution: boolean;
}
```

#### Skillstore 参考实现

```json
{
  "security_audit": {
    "risk_level": "safe | low | medium | high | critical",
    "is_blocked": false,
    "safe_to_publish": true,
    "summary": "Human-readable summary",
    "critical_findings": [],   // 分级存储
    "high_findings": [],
    "medium_findings": [],
    "low_findings": [],
    "dangerous_patterns": [],
    "files_scanned": 10,
    "total_lines": 500,
    "risk_factors": [],
    "risk_factor_evidence": []
  }
}
```

### 1.4 数据库 Schema 对比

#### SkillHub 当前 (`prisma/schema.prisma:317-334`)

```prisma
model SecurityScan {
  id              String        @id @default(uuid())
  skillVersionId  String
  status          JobStatus     @default(PENDING)
  score           Int?          // 0-100
  riskLevel       String?       // low, medium, high, critical
  blockExecution  Boolean       @default(false)
  reportJson      Json?         // 完整报告存为 JSON
  createdAt       DateTime      @default(now())
  completedAt     DateTime?
}

model SecurityConfig {
  id                  String   @id @default(uuid())
  name                String   @unique
  version             String
  isActive            Boolean  @default(true)
  systemPrompt        String   @db.Text
  rulesJson           Json     // Array of SecurityRule
  outputFormat        String   @db.Text
  additionalSettings  Json?
}
```

**特点**:
- ✅ 分数系统 (0-100)
- ✅ 配置版本管理
- ✅ 可自定义规则
- ❌ 缺少风险因素字段
- ❌ 缺少分级发现表

#### Skillstore 参考实现

```json
{
  "security_audit": {
    "risk_level": "string",
    "is_blocked": "boolean",
    "safe_to_publish": "boolean",
    "summary": "string",
    "critical_findings": "array",
    "high_findings": "array",
    "medium_findings": "array",
    "low_findings": "array",
    "dangerous_patterns": "array",
    "files_scanned": "integer",
    "total_lines": "integer",
    "audit_model": "string",
    "audited_at": "datetime",
    "risk_factors": "array",
    "risk_factor_evidence": "array"
  }
}
```

---

## 2. 功能对比矩阵

### 2.1 模式检测能力

| 检测类别 | SkillHub | Skillstore | 说明 |
|----------|----------|------------|------|
| **代码注入** | ✅ 5 patterns | ✅ | eval, Function, exec |
| **命令注入** | ✅ 4 patterns | ✅ | spawn, child_process |
| **凭据泄露** | ✅ 8 patterns | ✅ | password, api_key, token |
| **远程代码执行** | ✅ 2 patterns | ✅ | curl \| bash, wget \| bash |
| **路径遍历** | ✅ 2 patterns | ✅ | ../../.. |
| **系统访问** | ✅ 4 patterns | ✅ | /etc/passwd, ~/.ssh |
| **破坏性操作** | ✅ 4 patterns | ✅ | rm -rf, chmod 777 |
| **持久化** | ✅ 3 patterns | ⚠️ | crontab, launchctl, systemctl |
| **SSRF** | ✅ 2 patterns | ⚠️ | 169.254.x.x, metadata.google |
| **混淆代码** | ✅ 2 patterns | ✅ | atob, base64 |
| **MD 特定** | ✅ 6 patterns | ⚠️ | allowed-paths, security bypass |

**总结**: SkillHub 模式检测更全面 (67+ vs ~40)

### 2.2 AI 分析能力

| 能力 | SkillHub | Skillstore | 说明 |
|------|----------|------------|------|
| **语义分析** | ✅ Claude API | ✅ | 理解代码意图 |
| **文件大小限制** | ✅ 100KB/file | ✅ | 防止超限 |
| **智能截断** | ✅ 保留敏感内容 | ⚠️ | 保留上下文 |
| **热点检测** | ✅ 20 hotspots | ⚠️ | 优先关注 |
| **结果验证** | ✅ 防幻觉 | ⚠️ | 验证文件存在 |
| **可配置规则** | ✅ SecurityConfig | ⚠️ | 自定义规则 |
| **分类建议** | ✅ analyzeSkillMetadata | ❌ | 自动分类 |

### 2.3 输出结构对比

| 字段 | SkillHub | Skillstore | 说明 |
|------|----------|------------|------|
| `riskLevel` | ✅ | ✅ `risk_level` | 整体风险 |
| `score` | ✅ 0-100 | ❌ | 数值分数 |
| `findings` | ✅ 统一数组 | ✅ 分级数组 | 发现列表 |
| `blockExecution` | ✅ | ✅ `is_blocked` | 是否阻止 |
| `risk_factors` | ❌ | ✅ | 风险因素标签 |
| `risk_factor_evidence` | ❌ | ✅ | 证据跟踪 |
| `files_scanned` | ✅ `analyzedFiles` | ✅ | 扫描文件数 |
| `confidence` | ✅ | ⚠️ | AI 置信度 |
| `recommendations` | ✅ | ⚠️ | 修复建议 |

---

## 3. 差距分析与改进建议

### 3.1 缺失功能

| 功能 | 优先级 | 实现难度 | 说明 |
|------|--------|----------|------|
| **风险因素分类** | 🔴 高 | 低 | 添加 5 种风险因素标签 |
| **证据跟踪** | 🔴 高 | 中 | 记录每个发现的文件位置 |
| **分级发现存储** | 🟡 中 | 低 | 拆分 findings 为分级数组 |
| **safe_to_publish** | 🟡 中 | 低 | 添加发布建议字段 |
| **total_lines** | 🟢 低 | 低 | 统计扫描行数 |

### 3.2 建议的 Schema 改进

```prisma
model SecurityScan {
  id              String        @id @default(uuid())
  skillVersionId  String
  status          JobStatus     @default(PENDING)

  // 现有字段
  score           Int?
  riskLevel       String?
  blockExecution  Boolean       @default(false)
  reportJson      Json?

  // 新增字段
  safeToPublish   Boolean       @default(true)
  summary         String?
  filesScanned    Int           @default(0)
  totalLines      Int           @default(0)
  riskFactors     Json          @default("[]")  // ["scripts", "network", ...]
  riskFactorEvidence Json       @default("[]")  // [{factor, evidence: [{file, line}]}]

  // 分级发现
  criticalFindings  Json        @default("[]")
  highFindings      Json        @default("[]")
  mediumFindings    Json        @default("[]")
  lowFindings       Json        @default("[]")

  // 审计元数据
  auditModel      String?
  auditedAt       DateTime?

  createdAt       DateTime      @default(now())
  completedAt     DateTime?

  @@index([riskLevel])
  @@map("security_scans")
}
```

### 3.3 建议的代码改进

#### 添加风险因素检测 (`scanner.ts`)

```typescript
// 新增：风险因素检测
type RiskFactor = 'scripts' | 'network' | 'filesystem' | 'env_access' | 'external_commands';

interface RiskFactorEvidence {
  factor: RiskFactor;
  evidence: Array<{
    file: string;
    line_start: number;
    line_end: number;
  }>;
}

const RISK_FACTOR_PATTERNS: Record<RiskFactor, RegExp[]> = {
  scripts: [
    /\.(py|sh|js|ts|bash)$/i,
    /scripts\//i,
  ],
  network: [
    /fetch\s*\(/gi,
    /axios/gi,
    /http\.request/gi,
    /WebSocket/gi,
    /api\./gi,
  ],
  filesystem: [
    /fs\.read/gi,
    /fs\.write/gi,
    /open\s*\(/gi,
    /readFile/gi,
    /writeFile/gi,
  ],
  env_access: [
    /process\.env/gi,
    /os\.environ/gi,
    /\$[A-Z_]+/g,
    /getenv/gi,
  ],
  external_commands: [
    /exec\s*\(/gi,
    /spawn\s*\(/gi,
    /child_process/gi,
    /subprocess/gi,
    /os\.system/gi,
  ],
};

function detectRiskFactors(
  files: Array<{ path: string; content: string }>
): { riskFactors: RiskFactor[]; evidence: RiskFactorEvidence[] } {
  const detectedFactors = new Set<RiskFactor>();
  const evidence: RiskFactorEvidence[] = [];

  for (const [factor, patterns] of Object.entries(RISK_FACTOR_PATTERNS)) {
    const factorEvidence: RiskFactorEvidence = {
      factor: factor as RiskFactor,
      evidence: [],
    };

    for (const file of files) {
      const lines = file.content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        for (const pattern of patterns) {
          if (pattern.test(lines[i])) {
            detectedFactors.add(factor as RiskFactor);
            factorEvidence.evidence.push({
              file: file.path,
              line_start: i + 1,
              line_end: i + 1,
            });
            break;
          }
        }
      }
    }

    if (factorEvidence.evidence.length > 0) {
      evidence.push(factorEvidence);
    }
  }

  return {
    riskFactors: Array.from(detectedFactors),
    evidence,
  };
}
```

#### 更新 SecurityReport 接口

```typescript
export interface SecurityReport {
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  findings: SecurityFinding[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  };

  // 新增字段
  safeToPublish: boolean;
  riskFactors: RiskFactor[];
  riskFactorEvidence: RiskFactorEvidence[];
  filesScanned: number;
  totalLines: number;

  analyzedFiles: number;
  analyzedAt: string;
}
```

---

## 4. 实施路线图

### Phase 1: 数据模型更新 (1-2 天)

1. 更新 `prisma/schema.prisma`
2. 创建数据库迁移
3. 更新 TypeScript 接口

### Phase 2: 扫描器增强 (2-3 天)

1. 添加 `detectRiskFactors()` 函数
2. 添加 `countLines()` 统计
3. 更新 `scanSkill()` 返回新字段

### Phase 3: AI 分析器更新 (1-2 天)

1. 更新 prompt 要求风险因素输出
2. 解析 AI 返回的风险因素
3. 合并模式和 AI 的风险因素

### Phase 4: UI 更新 (2-3 天)

1. 添加风险因素标签显示
2. 添加证据位置展示
3. 更新安全详情页面

---

## 5. 风险因素用户展示

### 5.1 风险指示器图标

| 风险因素 | 图标 | 中文说明 |
|----------|------|----------|
| `scripts` | 📜 | 包含可执行脚本 |
| `network` | 🌐 | 网络访问 |
| `filesystem` | 📁 | 文件系统操作 |
| `env_access` | 🔐 | 环境变量访问 |
| `external_commands` | ⚡ | 外部命令执行 |

### 5.2 UI 展示示例

```tsx
// 风险因素标签组件
function RiskFactorBadge({ factor }: { factor: RiskFactor }) {
  const config = {
    scripts: { icon: '📜', label: '包含脚本', color: 'blue' },
    network: { icon: '🌐', label: '网络访问', color: 'yellow' },
    filesystem: { icon: '📁', label: '文件操作', color: 'orange' },
    env_access: { icon: '🔐', label: '环境变量', color: 'purple' },
    external_commands: { icon: '⚡', label: '外部命令', color: 'red' },
  };

  const { icon, label, color } = config[factor];

  return (
    <Badge variant={color}>
      {icon} {label}
    </Badge>
  );
}

// 证据展示组件
function RiskFactorEvidence({ evidence }: { evidence: RiskFactorEvidence }) {
  return (
    <Collapsible>
      <CollapsibleTrigger>
        <RiskFactorBadge factor={evidence.factor} />
        <span>{evidence.evidence.length} 处</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {evidence.evidence.map((e, i) => (
          <div key={i}>
            <code>{e.file}:{e.line_start}</code>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
```

---

## 参考

- [Skillstore Security Documentation](https://skillstore.io/zh-hans/docs/security)
- [Skillstore GitHub Repository](https://github.com/aiskillstore/marketplace)
- [Skill Report Schema v2.0](https://github.com/aiskillstore/marketplace/blob/master/schemas/skill-report.schema.json)
- 当前实现: `src/lib/security/scanner.ts`
- AI 分析: `src/lib/security/ai-analyzer.ts`
- 数据模型: `prisma/schema.prisma`
