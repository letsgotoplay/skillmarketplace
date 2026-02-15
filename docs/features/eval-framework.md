# Feature Design: Enterprise Skill Evaluation Framework

> Created: 2025-02-15
> Status: Design Complete, Ready for Implementation

## Overview

Design a comprehensive test case and evaluation system for the skill marketplace that supports:
1. Clear test case format specification with documentation
2. Multiple evaluation strategies for different skill types (deterministic, flexible, creative)
3. Expected result metadata and comparison methods
4. Test case versioning and maintenance
5. Enterprise domain-specific evaluation patterns

---

## Current State Analysis

### Existing Implementation
- **Test file**: `tests.json` in ZIP root
- **Current schema** (`src/lib/skills/types.ts:42-49`):
  ```typescript
  testCaseSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    input: z.string(),
    expectedOutput: z.string().optional(),
    expectedPatterns: z.array(z.string()).optional(),
    timeout: z.number().default(30000),
  });
  ```

### Problems
1. No documentation on test format requirements
2. Only supports string-based expected output
3. No evaluation strategy differentiation
4. No scoring/metrics framework
5. No test case versioning

---

## Proposed Design

### 1. Test Case File Structure

**File location**: `eval/tests.json` (new dedicated folder)

**Schema Versioning**: Include `version` field for future compatibility

**Directory structure**:
```
skill.zip
├── SKILL.md
├── prompts/
│   └── ...
├── eval/
│   ├── tests.json        # Test configuration (v2 format)
│   └── fixtures/         # Test fixtures (optional)
│       ├── sample1.pdf
│       └── sample2.json
└── scripts/
    └── ...
```

### 2. Enhanced Test Case Schema

```typescript
// Evaluation strategy determines how outputs are compared
type EvalStrategy =
  | 'exact_match'      // String exact match
  | 'regex_match'      // Regex pattern matching
  | 'json_schema'      // JSON schema validation
  | 'semantic_sim'     // Semantic similarity (LLM-based)
  | 'llm_judge'        // LLM as judge with rubric
  | 'hybrid'           // Combination of multiple methods
  | 'custom'           // Custom evaluation script

// Skill category determines default evaluation approach
type SkillEvalProfile =
  | 'deterministic'    // Code execution, calculations - expect exact outputs
  | 'structured'       // Data transformation - expect valid schema
  | 'flexible'         // Content generation - semantic similarity
  | 'creative'         // Presentations, art - LLM judge with rubric
  | 'enterprise'       // Domain-specific - custom criteria

interface TestCaseV2 {
  // Identity
  id: string;                    // Unique test case ID (e.g., "tc-001")
  name: string;
  description?: string;
  tags?: string[];               // For categorization (e.g., ["edge-case", "happy-path"])

  // Input configuration
  input: {
    prompt: string;              // The input prompt/question
    context?: Record<string, unknown>;  // Additional context
    variables?: Record<string, string>; // Template variables
  };

  // Expected output configuration
  expected: {
    // Strategy-specific fields
    output?: string;             // For exact_match
    patterns?: string[];         // For regex_match
    jsonSchema?: object;         // For json_schema validation
    semanticThreshold?: number;  // For semantic_sim (0-1)
    rubric?: EvalRubric;         // For llm_judge
    customScript?: string;       // For custom evaluation
  };

  // Evaluation configuration
  evaluation: {
    strategy: EvalStrategy;
    timeout?: number;            // Default: 30000ms
    retryCount?: number;         // For flaky tests
    weights?: Record<string, number>; // For hybrid strategies
  };

  // Metadata
  metadata?: {
    difficulty?: 'easy' | 'medium' | 'hard';
    priority?: 'critical' | 'high' | 'medium' | 'low';
    author?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

// LLM Judge Rubric
interface EvalRubric {
  criteria: Array<{
    name: string;                // e.g., "accuracy", "completeness", "format"
    description: string;
    weight: number;              // 0-1, should sum to 1
    scale: {
      min: number;
      max: number;
      descriptions?: Record<number, string>; // Score descriptions
    };
  }>;
  passingThreshold: number;      // Minimum score to pass (0-1)
  overallFeedback?: boolean;     // Generate overall feedback
}

// Test configuration file
interface EvalConfigV2 {
  version: '2.0';
  profile: SkillEvalProfile;

  // Global settings
  settings: {
    defaultTimeout?: number;
    parallelExecution?: boolean;
    maxConcurrentTests?: number;
    failFast?: boolean;          // Stop on first failure
    retryFailed?: boolean;
  };

  // Environment setup
  setup?: {
    script?: string;             // Setup script path
    environment?: Record<string, string>;
    dependencies?: string[];
  };

  // Teardown
  teardown?: {
    script?: string;
  };

  // Test cases
  testCases: TestCaseV2[];

  // Test suites (groups of tests)
  suites?: Array<{
    name: string;
    testIds: string[];           // References to test cases
    runInSequence?: boolean;
  }>;
}
```

### 3. Evaluation Strategies Detail

| Strategy | Use Case | How It Works | Skill Types |
|----------|----------|--------------|-------------|
| `exact_match` | Deterministic outputs | String equality check | Code execution, calculators |
| `regex_match` | Pattern-based validation | Regex patterns must all match | Formatters, parsers |
| `json_schema` | Structured data | Validates output against JSON schema | APIs, data transformers |
| `semantic_sim` | Content similarity | Embedding-based similarity scoring | Summaries, translations |
| `llm_judge` | Quality assessment | LLM evaluates against rubric | Writing, analysis, creative |
| `hybrid` | Multi-criteria | Combine multiple strategies with weights | Complex skills |
| `custom` | Domain-specific | Execute custom evaluation script | Enterprise-specific |

### 4. Skill Evaluation Profiles

#### Deterministic Profile
- Default strategy: `exact_match` or `json_schema`
- Example: Calculator, code formatter, API wrapper

#### Structured Profile
- Default strategy: `json_schema`
- Example: Data transformer, report generator

#### Flexible Profile
- Default strategy: `semantic_sim`
- Threshold: 0.7-0.85 depending on skill
- Example: Summarizer, translator, content rewriter

#### Creative Profile (e.g., pptx skill)
- Default strategy: `llm_judge`
- Rubric criteria:
  - **Completeness** (30%): All requested elements present
  - **Coherence** (25%): Logical flow and structure
  - **Professionalism** (25%): Appropriate style and tone
  - **Accuracy** (20%): Factual correctness
- Passing threshold: 0.7

#### Enterprise Profile
- Default strategy: `hybrid` or `custom`
- Domain-specific evaluation scripts
- Example: Compliance checker, domain expert assistant

### 5. Example Test Configurations

#### Example A: Deterministic Skill (Calculator)

```json
{
  "version": "2.0",
  "profile": "deterministic",
  "settings": {
    "defaultTimeout": 5000,
    "failFast": true
  },
  "testCases": [
    {
      "id": "tc-001",
      "name": "Basic addition",
      "input": {
        "prompt": "Calculate 2 + 2"
      },
      "expected": {
        "output": "4"
      },
      "evaluation": {
        "strategy": "exact_match"
      },
      "metadata": {
        "difficulty": "easy",
        "priority": "critical"
      }
    },
    {
      "id": "tc-002",
      "name": "Complex expression",
      "input": {
        "prompt": "Calculate (15 * 4) / 3 + 7"
      },
      "expected": {
        "output": "27"
      },
      "evaluation": {
        "strategy": "exact_match"
      },
      "metadata": {
        "difficulty": "medium"
      }
    }
  ]
}
```

#### Example B: Creative Skill (Presentation Generator)

```json
{
  "version": "2.0",
  "profile": "creative",
  "settings": {
    "defaultTimeout": 60000
  },
  "testCases": [
    {
      "id": "pptx-001",
      "name": "Generate quarterly report presentation",
      "description": "Tests ability to create a structured business presentation",
      "input": {
        "prompt": "Create a 5-slide presentation about Q4 2025 sales performance",
        "context": {
          "data": {
            "totalSales": 1500000,
            "growth": 12.5,
            "topProducts": ["Product A", "Product B", "Product C"]
          }
        }
      },
      "expected": {
        "rubric": {
          "criteria": [
            {
              "name": "structure",
              "description": "Presentation has logical flow with title, content, and conclusion slides",
              "weight": 0.25,
              "scale": { "min": 1, "max": 5 }
            },
            {
              "name": "data_accuracy",
              "description": "All numerical data from input is correctly represented",
              "weight": 0.30,
              "scale": { "min": 1, "max": 5 }
            },
            {
              "name": "completeness",
              "description": "Contains 5 slides as requested with meaningful content",
              "weight": 0.25,
              "scale": { "min": 1, "max": 5 }
            },
            {
              "name": "professionalism",
              "description": "Appropriate business language and formatting",
              "weight": 0.20,
              "scale": { "min": 1, "max": 5 }
            }
          ],
          "passingThreshold": 0.7,
          "overallFeedback": true
        }
      },
      "evaluation": {
        "strategy": "llm_judge",
        "timeout": 90000
      },
      "metadata": {
        "difficulty": "medium",
        "priority": "high"
      }
    }
  ]
}
```

#### Example C: Enterprise Domain Skill

```json
{
  "version": "2.0",
  "profile": "enterprise",
  "settings": {
    "defaultTimeout": 45000
  },
  "setup": {
    "environment": {
      "COMPANY_POLICY_VERSION": "2025.01"
    }
  },
  "testCases": [
    {
      "id": "compliance-001",
      "name": "PII detection in document",
      "input": {
        "prompt": "Analyze this document for PII compliance issues",
        "context": {
          "documentUrl": "fixtures/sample-contract.pdf"
        }
      },
      "expected": {
        "jsonSchema": {
          "type": "object",
          "required": ["hasPII", "findings", "riskLevel"],
          "properties": {
            "hasPII": { "type": "boolean" },
            "findings": {
              "type": "array",
              "items": {
                "type": "object",
                "required": ["type", "location", "severity"],
                "properties": {
                  "type": { "type": "string" },
                  "location": { "type": "string" },
                  "severity": { "enum": ["low", "medium", "high", "critical"] }
                }
              }
            },
            "riskLevel": { "enum": ["low", "medium", "high", "critical"] }
          }
        }
      },
      "evaluation": {
        "strategy": "json_schema"
      },
      "metadata": {
        "difficulty": "medium",
        "priority": "critical",
        "tags": ["compliance", "pii", "security"]
      }
    }
  ]
}
```

### 6. Database Schema Changes

Add to `prisma/schema.prisma`:

```prisma
// Enhanced evaluation configuration
model EvalConfig {
  id              String    @id @default(uuid())
  skillVersionId  String    @unique
  version         String    @default("2.0")
  profile         String    // SkillEvalProfile
  configJson      Json      // Full EvalConfigV2
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  skillVersion    SkillVersion @relation(fields: [skillVersionId], references: [id], onDelete: Cascade)

  @@map("eval_configs")
}

// Enhanced EvalResult with detailed scoring (update existing model)
model EvalResult {
  id              String    @id @default(uuid())
  evalQueueId     String
  testName        String
  testCaseId      String?   // New: reference to test case ID
  status          TestStatus
  strategy        String    // New: EvalStrategy used
  score           Float?    // New: 0-1 score for graded evaluations
  rubricScores    Json?     // New: Per-criterion scores for llm_judge
  feedback        String?   @db.Text // New: LLM judge feedback
  output          String?   @db.Text
  expectedOutput  String?   @db.Text // New: Store expected for comparison
  matchedPatterns String[]? // New: For regex_match
  schemaErrors    Json?     // New: For json_schema validation errors
  durationMs      Int
  createdAt       DateTime  @default(now())

  evalQueue       EvalQueue @relation(fields: [evalQueueId], references: [id], onDelete: Cascade)

  @@index([evalQueueId])
  @@map("eval_results")
}
```

### 7. Test Case Maintenance Strategy

1. **Version Control**
   - Test configs stored with skill version
   - Each skill version has its own eval config
   - Historical configs preserved for comparison

2. **Test Fixtures**
   - Support `eval/fixtures/` directory in ZIP
   - Reference fixtures by relative path in test cases

3. **Test Discovery**
   - Auto-detect test file location (root or eval/)
   - Support both v1 (simple) and v2 (enhanced) formats

4. **Migration Path**
   - v1 tests.json auto-converted to v2 format
   - Backwards compatible with existing skills

---

## Implementation Plan

### Phase 1: Schema & Types
1. Create `src/lib/eval/types.ts` with new schemas
2. Update Zod validation schemas
3. Create migration utility for v1 → v2 format

### Phase 2: Evaluation Engine
1. Implement `EvalStrategy` executors
2. Add LLM judge implementation with rubric support
3. Add semantic similarity scorer
4. Implement hybrid evaluation

### Phase 3: Database Updates
1. Add new `EvalConfig` model
2. Update `EvalResult` with new fields
3. Create migration script

### Phase 4: UI Updates
1. Update upload form with eval profile selection
2. Add test config validation in upload flow
3. Create eval results visualization with rubric scores
4. Add test case editor/preview

### Phase 5: Documentation
1. Save this design to `docs/features/eval-framework.md`
2. Create `docs/evaluation-guide.md` (user-facing guide)
3. Add examples for each profile type
4. Document custom evaluation script format

---

## Key Files to Modify

| File | Changes |
|------|---------|
| `src/lib/eval/types.ts` | New evaluation types and schemas |
| `src/lib/eval/strategies.ts` | Strategy implementations |
| `src/lib/eval/llm-judge.ts` | LLM judge with rubric |
| `src/lib/skills/validation.ts` | Enhanced test config parsing |
| `src/app/actions/skills.ts` | Update upload flow for new format |
| `prisma/schema.prisma` | New EvalConfig model, updated EvalResult |
| `src/components/skill/upload-form.tsx` | Eval profile selection |
| `src/components/skill/eval-results.tsx` | Results visualization |

---

## Verification

1. **Unit Tests**: Test each evaluation strategy
2. **Integration Tests**: Full upload → eval → results flow
3. **Example Skills**: Create sample skills with each profile type
4. **Documentation Review**: Ensure docs match implementation

---

## User Decisions (Confirmed)

1. **Test file location**: `eval/tests.json` (dedicated folder with fixtures support)
2. **Priority strategies**: LLM Judge + JSON Schema first (covers creative and structured skills)
3. **Custom scripts**: Support both Python AND JavaScript
4. **Documentation**: Save to `docs/features/eval-framework.md`

## Refined Implementation Scope

### Phase 1 (MVP)
- JSON Schema validation (`json_schema`)
- LLM Judge with rubric (`llm_judge`)
- Exact match (`exact_match`) - simple, already partially exists
- Test file in `eval/tests.json` location
- Database schema updates
- Basic UI for eval results

### Phase 2 (Enhanced)
- Regex pattern matching (`regex_match`)
- Semantic similarity (`semantic_sim`)
- Hybrid strategy (`hybrid`)
- Custom Python/JS evaluation scripts (`custom`)
- Test fixtures support (`eval/fixtures/`)
- Advanced eval visualization

---

## References

- [RAGAS Framework](https://docs.ragas.io/en/stable/) - RAG evaluation methodology
- [Best AI Agent Evaluation Benchmarks: 2025 Complete Guide](https://o-mega.ai/articles/the-best-ai-agent-evals-and-benchmarks-full-2025-guide)
- [Evaluation Framework for AI Creativity](https://arxiv.org/pdf/2601.03698)
- [Enterprise Guide: Agent Evaluation Frameworks 2025](https://sparkco.ai/blog/enterprise-guide-agent-evaluation-frameworks-2025)
