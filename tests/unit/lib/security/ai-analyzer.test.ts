import {
  getFileType,
  smartTruncate,
  findSecurityHotspots,
  validateFindings,
  parseAIResponse,
  extractFilesForAnalysis,
  getSecurityReportSummary,
  analyzeWithAI,
  analyzeSkillMetadata,
  isAIAnalysisAvailable,
  isAIAnalysisEnabled,
  getConfiguredModel,
  SENSITIVE_PATTERNS,
  type FileForAnalysis,
  type AISecurityReport,
} from '@/lib/security/ai-analyzer';
import JSZip from 'jszip';

// Create mock function for messages.create
const mockMessagesCreate = jest.fn();

// Mock Anthropic SDK properly
jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: mockMessagesCreate,
      },
    })),
  };
});

// Mock env module
jest.mock('@/lib/env', () => ({
  env: {
    AI_SECURITY_ENABLED: 'true',
    AI_SECURITY_API_KEY: 'test-api-key',
    AI_SECURITY_BASE_URL: 'https://api.anthropic.com',
    AI_SECURITY_MODEL: 'claude-sonnet-4-20250514',
  },
}));

// Helper to create test skill zip
async function createTestZip(files: Record<string, string>): Promise<Buffer> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }
  return zip.generateAsync({ type: 'nodebuffer' });
}

describe('AI Analyzer', () => {
  // ============================================
  // 1. getFileType Tests
  // ============================================
  describe('getFileType', () => {
    it('should return "md" for markdown files', () => {
      expect(getFileType('SKILL.md')).toBe('md');
      expect(getFileType('README.md')).toBe('md');
      expect(getFileType('docs/guide.md')).toBe('md');
    });

    it('should return "script" for Python files', () => {
      expect(getFileType('main.py')).toBe('script');
      expect(getFileType('scripts/setup.py')).toBe('script');
    });

    it('should return "script" for shell files', () => {
      expect(getFileType('setup.sh')).toBe('script');
      expect(getFileType('script.bash')).toBe('script');
      expect(getFileType('script.zsh')).toBe('script');
    });

    it('should return "script" for JavaScript/TypeScript files', () => {
      expect(getFileType('index.js')).toBe('script');
      expect(getFileType('app.ts')).toBe('script');
      expect(getFileType('component.jsx')).toBe('script');
      expect(getFileType('widget.tsx')).toBe('script');
    });

    it('should return "other" for non-code files', () => {
      expect(getFileType('config.json')).toBe('other');
      expect(getFileType('styles.css')).toBe('other');
      expect(getFileType('data.yaml')).toBe('other');
      expect(getFileType('image.png')).toBe('other');
    });
  });

  // ============================================
  // 2. smartTruncate Tests
  // ============================================
  describe('smartTruncate', () => {
    it('should not truncate small files', () => {
      const content = 'small content';
      const result = smartTruncate(content, 1000);
      expect(result.content).toBe(content);
      expect(result.wasTruncated).toBe(false);
    });

    it('should truncate large files and preserve sensitive lines', () => {
      // Create a large file with a sensitive line in the middle
      const lines = [];
      for (let i = 0; i < 100; i++) {
        if (i === 50) {
          lines.push('password = "secret123"'); // sensitive line
        } else {
          lines.push(`Line ${i}: This is some regular content that is not sensitive.`);
        }
      }
      const content = lines.join('\n');
      const maxSize = 1000; // Force truncation

      const result = smartTruncate(content, maxSize);

      expect(result.wasTruncated).toBe(true);
      expect(result.content.length).toBeLessThan(content.length);
      // Should preserve the sensitive line
      expect(result.content).toContain('password');
    });

    it('should preserve file beginning (30 lines)', () => {
      const lines = Array.from({ length: 100 }, (_, i) => `Line ${i}`);
      const content = lines.join('\n');

      const result = smartTruncate(content, 500);

      expect(result.content).toContain('Line 0');
      expect(result.content).toContain('Line 1');
      expect(result.content).toContain('Line 29');
    });

    it('should preserve file ending (15 lines)', () => {
      const lines = Array.from({ length: 100 }, (_, i) => `Line ${i}`);
      const content = lines.join('\n');

      const result = smartTruncate(content, 500);

      expect(result.content).toContain('Line 99');
      expect(result.content).toContain('Line 85');
    });

    it('should include truncation marker', () => {
      const lines = Array.from({ length: 100 }, (_, i) => `Line ${i}`);
      const content = lines.join('\n');

      const result = smartTruncate(content, 500);

      expect(result.content).toContain('[truncated for analysis]');
    });
  });

  // ============================================
  // 3. findSecurityHotspots Tests
  // ============================================
  describe('findSecurityHotspots', () => {
    it('should detect password patterns', () => {
      const files: FileForAnalysis[] = [
        { path: 'config.py', content: 'password = "secret123"', size: 25, type: 'script' },
      ];

      const hotspots = findSecurityHotspots(files);

      expect(hotspots.length).toBeGreaterThan(0);
      expect(hotspots[0].file).toBe('config.py');
      expect(hotspots[0].line).toBe(1);
    });

    it('should detect eval patterns', () => {
      const files: FileForAnalysis[] = [
        { path: 'script.js', content: 'const result = eval(userInput);', size: 30, type: 'script' },
      ];

      const hotspots = findSecurityHotspots(files);

      expect(hotspots.length).toBeGreaterThan(0);
      expect(hotspots[0].context).toContain('eval');
    });

    it('should limit to 20 hotspots', () => {
      const lines = [];
      for (let i = 0; i < 30; i++) {
        lines.push(`password = "secret${i}"`);
      }
      const files: FileForAnalysis[] = [
        { path: 'big.py', content: lines.join('\n'), size: 500, type: 'script' },
      ];

      const hotspots = findSecurityHotspots(files);

      expect(hotspots.length).toBe(20);
    });

    it('should return empty array for clean files', () => {
      const files: FileForAnalysis[] = [
        { path: 'clean.py', content: 'print("Hello, World!")', size: 20, type: 'script' },
      ];

      const hotspots = findSecurityHotspots(files);

      expect(hotspots).toHaveLength(0);
    });
  });

  // ============================================
  // 4. parseAIResponse Tests
  // ============================================
  describe('parseAIResponse', () => {
    it('should parse valid JSON response', () => {
      const response = JSON.stringify({
        riskLevel: 'low',
        findings: [],
        summary: 'No issues found',
        recommendations: ['Safe to use'],
        confidence: 90,
      });

      const report = parseAIResponse(response, 'test-model');

      expect(report.riskLevel).toBe('low');
      expect(report.threats).toHaveLength(0);
      expect(report.confidence).toBe(90);
      expect(report.modelUsed).toBe('test-model');
    });

    it('should parse JSON in markdown code blocks', () => {
      const response = '```json\n{"riskLevel": "high", "findings": [], "confidence": 80}\n```';

      const report = parseAIResponse(response, 'test-model');

      expect(report.riskLevel).toBe('high');
      expect(report.confidence).toBe(80);
    });

    it('should map findings to SecurityFinding format', () => {
      const response = JSON.stringify({
        riskLevel: 'critical',
        findings: [
          {
            ruleId: 'script-hardcoded-secrets',
            severity: 'critical',
            category: 'Credentials',
            title: 'Hardcoded Password',
            file: 'config.py',
            line: 10,
            description: 'Found hardcoded password',
            harm: 'Could lead to credential exposure',
            evidence: 'password = "secret"',
            confidence: 95,
            blockExecution: true,
          },
        ],
        confidence: 95,
      });

      const report = parseAIResponse(response, 'test-model');

      expect(report.threats).toHaveLength(1);
      expect(report.threats[0].severity).toBe('critical');
      expect(report.threats[0].category).toBe('Credentials');
      expect(report.threats[0].title).toBe('Hardcoded Password');
      expect(report.threats[0].file).toBe('config.py');
      expect(report.threats[0].line).toBe(10);
      expect(report.threats[0].source).toBe('ai');
      expect(report.blockExecution).toBe(true);
    });

    it('should handle invalid JSON gracefully', () => {
      const response = 'This is not valid JSON';

      const report = parseAIResponse(response, 'test-model');

      expect(report.riskLevel).toBe('medium');
      expect(report.threats).toHaveLength(1);
      expect(report.threats[0].category).toBe('Analysis Error');
      expect(report.confidence).toBe(50);
    });

    it('should set blockExecution to true for critical findings', () => {
      const response = JSON.stringify({
        riskLevel: 'critical',
        findings: [
          {
            ruleId: 'test-rule',
            severity: 'critical',
            category: 'Test',
            title: 'Critical Issue',
            description: 'A critical security issue',
            harm: 'Could be bad',
          },
        ],
        confidence: 90,
      });

      const report = parseAIResponse(response, 'test-model');

      expect(report.blockExecution).toBe(true);
    });
  });

  // ============================================
  // 5. getSecurityReportSummary Tests
  // ============================================
  describe('getSecurityReportSummary', () => {
    it('should format summary correctly', () => {
      const report: AISecurityReport = {
        riskLevel: 'high',
        threats: [
          { id: '1', severity: 'critical', category: 'Test', title: 'Critical', description: '', recommendation: '', source: 'ai' },
          { id: '2', severity: 'high', category: 'Test', title: 'High', description: '', recommendation: '', source: 'ai' },
          { id: '3', severity: 'medium', category: 'Test', title: 'Medium', description: '', recommendation: '', source: 'ai' },
          { id: '4', severity: 'low', category: 'Test', title: 'Low', description: '', recommendation: '', source: 'ai' },
        ],
        recommendations: [],
        confidence: 85,
        analyzedAt: new Date().toISOString(),
        modelUsed: 'test-model',
        blockExecution: false,
      };

      const summary = getSecurityReportSummary(report);

      expect(summary).toContain('HIGH');
      expect(summary).toContain('Critical: 1');
      expect(summary).toContain('High: 1');
      expect(summary).toContain('Medium: 1');
      expect(summary).toContain('Low: 1');
      expect(summary).toContain('85%');
    });

    it('should include block status when blocked', () => {
      const report: AISecurityReport = {
        riskLevel: 'critical',
        threats: [],
        recommendations: [],
        confidence: 90,
        analyzedAt: new Date().toISOString(),
        modelUsed: 'test-model',
        blockExecution: true,
      };

      const summary = getSecurityReportSummary(report);

      expect(summary).toContain('BLOCKED');
    });

    it('should include skipped files count', () => {
      const report: AISecurityReport = {
        riskLevel: 'low',
        threats: [],
        recommendations: [],
        confidence: 90,
        analyzedAt: new Date().toISOString(),
        modelUsed: 'test-model',
        blockExecution: false,
        skippedFiles: ['file1.py', 'file2.py'],
      };

      const summary = getSecurityReportSummary(report);

      expect(summary).toContain('2 files skipped');
    });
  });

  // ============================================
  // 6. validateFindings Tests
  // ============================================
  describe('validateFindings', () => {
    it('should remove findings with non-existent files', () => {
      const files: FileForAnalysis[] = [
        { path: 'exists.py', content: 'print("hi")', size: 12, type: 'script' },
      ];

      const report: AISecurityReport = {
        riskLevel: 'high',
        threats: [
          {
            id: '1',
            severity: 'critical',
            category: 'Test',
            title: 'Valid Finding',
            description: '',
            recommendation: '',
            source: 'ai',
            file: 'exists.py',
            line: 1,
          },
          {
            id: '2',
            severity: 'high',
            category: 'Test',
            title: 'Hallucinated Finding',
            description: '',
            recommendation: '',
            source: 'ai',
            file: 'does-not-exist.py',
            line: 1,
          },
        ],
        recommendations: [],
        confidence: 80,
        analyzedAt: new Date().toISOString(),
        modelUsed: 'test-model',
        blockExecution: false,
      };

      const validated = validateFindings(report, files);

      expect(validated.threats).toHaveLength(1);
      expect(validated.threats[0].file).toBe('exists.py');
    });

    it('should correct invalid line numbers', () => {
      const files: FileForAnalysis[] = [
        { path: 'test.py', content: 'line1\nline2\nline3', size: 18, type: 'script' },
      ];

      const report: AISecurityReport = {
        riskLevel: 'high',
        threats: [
          {
            id: '1',
            severity: 'high',
            category: 'Test',
            title: 'Invalid Line',
            description: '',
            recommendation: '',
            source: 'ai',
            file: 'test.py',
            line: 999, // Invalid line number
          },
        ],
        recommendations: [],
        confidence: 80,
        analyzedAt: new Date().toISOString(),
        modelUsed: 'test-model',
        blockExecution: false,
      };

      const validated = validateFindings(report, files);

      expect(validated.threats[0].line).toBeUndefined();
    });

    it('should preserve valid findings', () => {
      const files: FileForAnalysis[] = [
        { path: 'test.py', content: 'line1\nline2\nline3', size: 18, type: 'script' },
      ];

      const report: AISecurityReport = {
        riskLevel: 'medium',
        threats: [
          {
            id: '1',
            severity: 'medium',
            category: 'Test',
            title: 'Valid Finding',
            description: '',
            recommendation: '',
            source: 'ai',
            file: 'test.py',
            line: 2, // Valid line number
          },
        ],
        recommendations: [],
        confidence: 80,
        analyzedAt: new Date().toISOString(),
        modelUsed: 'test-model',
        blockExecution: false,
      };

      const validated = validateFindings(report, files);

      expect(validated.threats).toHaveLength(1);
      expect(validated.threats[0].line).toBe(2);
    });

    it('should preserve findings without file reference', () => {
      const files: FileForAnalysis[] = [];

      const report: AISecurityReport = {
        riskLevel: 'medium',
        threats: [
          {
            id: '1',
            severity: 'medium',
            category: 'General',
            title: 'General Finding',
            description: 'No specific file',
            recommendation: '',
            source: 'ai',
            // No file property
          },
        ],
        recommendations: [],
        confidence: 80,
        analyzedAt: new Date().toISOString(),
        modelUsed: 'test-model',
        blockExecution: false,
      };

      const validated = validateFindings(report, files);

      expect(validated.threats).toHaveLength(1);
    });
  });

  // ============================================
  // 7. extractFilesForAnalysis Tests
  // ============================================
  describe('extractFilesForAnalysis', () => {
    it('should categorize MD files correctly', async () => {
      const buffer = await createTestZip({
        'SKILL.md': '# Test Skill',
        'README.md': '## Description',
      });

      const result = await extractFilesForAnalysis(buffer);

      expect(result.mdFiles).toHaveLength(2);
      expect(result.scriptFiles).toHaveLength(0);
      expect(result.mdFiles.map(f => f.path)).toContain('SKILL.md');
      expect(result.mdFiles.map(f => f.path)).toContain('README.md');
    });

    it('should categorize script files correctly', async () => {
      const buffer = await createTestZip({
        'main.py': 'print("hello")',
        'setup.sh': '#!/bin/bash',
        'app.js': 'console.log("hi")',
      });

      const result = await extractFilesForAnalysis(buffer);

      expect(result.scriptFiles).toHaveLength(3);
      expect(result.mdFiles).toHaveLength(0);
    });

    it('should skip non-text files', async () => {
      const buffer = await createTestZip({
        'image.png': '\x89PNG\r\n\x1a\n',
        'data.bin': '\x00\x01\x02\x03',
      });

      const result = await extractFilesForAnalysis(buffer);

      expect(result.mdFiles).toHaveLength(0);
      expect(result.scriptFiles).toHaveLength(0);
      expect(result.otherFiles).toHaveLength(0);
    });

    it('should prioritize SKILL.md first', async () => {
      const buffer = await createTestZip({
        'aaa.md': 'AAA',
        'SKILL.md': '# Skill',
        'zzz.md': 'ZZZ',
      });

      const result = await extractFilesForAnalysis(buffer);

      expect(result.mdFiles[0].path).toBe('SKILL.md');
    });

    it('should return skipped files list for large files', async () => {
      // Create a file larger than MAX_FILE_SIZE (100KB)
      const largeContent = 'x'.repeat(150 * 1024);
      const buffer = await createTestZip({
        'large.py': largeContent,
      });

      const result = await extractFilesForAnalysis(buffer);

      expect(result.skippedFiles.length).toBeGreaterThan(0);
      expect(result.skippedFiles[0]).toContain('large.py');
      expect(result.skippedFiles[0]).toContain('truncated');
    });

    it('should handle empty zip', async () => {
      const buffer = await createTestZip({});

      const result = await extractFilesForAnalysis(buffer);

      expect(result.mdFiles).toHaveLength(0);
      expect(result.scriptFiles).toHaveLength(0);
      expect(result.skippedFiles).toHaveLength(0);
    });

    it('should include other text files (json, yaml)', async () => {
      const buffer = await createTestZip({
        'config.json': '{"key": "value"}',
        'settings.yaml': 'key: value',
      });

      const result = await extractFilesForAnalysis(buffer);

      expect(result.otherFiles.length).toBe(2);
    });
  });

  // ============================================
  // 8. isAIAnalysisAvailable Tests
  // ============================================
  describe('isAIAnalysisAvailable', () => {
    it('should return true when API key is configured', () => {
      // The mock sets AI_SECURITY_API_KEY
      expect(isAIAnalysisAvailable()).toBe(true);
    });
  });

  // ============================================
  // 9. isAIAnalysisEnabled Tests
  // ============================================
  describe('isAIAnalysisEnabled', () => {
    it('should return true when feature flag is enabled (default)', () => {
      expect(isAIAnalysisEnabled()).toBe(true);
    });
  });

  // ============================================
  // 10. getConfiguredModel Tests
  // ============================================
  describe('getConfiguredModel', () => {
    it('should return the configured model', () => {
      expect(getConfiguredModel()).toBe('claude-sonnet-4-20250514');
    });
  });

  // ============================================
  // 10. SENSITIVE_PATTERNS Tests
  // ============================================
  describe('SENSITIVE_PATTERNS', () => {
    it('should contain password pattern', () => {
      const pattern = SENSITIVE_PATTERNS.find(p => p.source.includes('password'));
      expect(pattern).toBeDefined();
      expect(pattern?.test('password = "secret"')).toBe(true);
    });

    it('should contain api_key pattern', () => {
      const pattern = SENSITIVE_PATTERNS.find(p => p.source.includes('api'));
      expect(pattern).toBeDefined();
      expect(pattern?.test('api_key = "123"')).toBe(true);
    });

    it('should contain eval pattern', () => {
      const pattern = SENSITIVE_PATTERNS.find(p => p.source.includes('eval'));
      expect(pattern).toBeDefined();
      expect(pattern?.test('eval(userInput)')).toBe(true);
    });

    it('should contain rm -rf pattern', () => {
      const pattern = SENSITIVE_PATTERNS.find(p => p.source.includes('rm'));
      expect(pattern).toBeDefined();
      expect(pattern?.test('rm -rf /')).toBe(true);
    });
  });

  // ============================================
  // 11. analyzeWithAI Integration Tests (Mocked)
  // ============================================
  describe('analyzeWithAI', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockMessagesCreate.mockReset();
    });

    it('should return low risk for clean skill', async () => {
      const mockResponse = {
        riskLevel: 'low',
        findings: [],
        summary: 'No security issues',
        recommendations: [],
        confidence: 90,
      };

      mockMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(mockResponse) }],
        usage: { input_tokens: 100, output_tokens: 50 },
      });

      const buffer = await createTestZip({
        'SKILL.md': '# Safe Skill\n\nThis is a safe skill.',
      });

      const report = await analyzeWithAI(buffer);

      expect(report.riskLevel).toBe('low');
      expect(report.threats).toHaveLength(0);
    });

    it('should handle AI unavailable gracefully', async () => {
      // This test would need to test the case when API key is not set
      // For now, we skip this since our mock always has an API key
    });

    it('should handle API errors', async () => {
      mockMessagesCreate.mockRejectedValue(new Error('API Error'));

      const buffer = await createTestZip({
        'SKILL.md': '# Test',
      });

      const report = await analyzeWithAI(buffer);

      expect(report.riskLevel).toBe('medium');
      expect(report.threats[0].category).toBe('Analysis Error');
    });

    it('should return correct report structure', async () => {
      const mockResponse = {
        riskLevel: 'high',
        findings: [
          {
            ruleId: 'test-rule',
            severity: 'high',
            category: 'Test',
            title: 'Test Finding',
            file: 'test.py',
            line: 1,
            description: 'Test description',
            harm: 'Test harm',
            confidence: 85,
          },
        ],
        summary: 'Test summary',
        recommendations: ['Fix the issue'],
        confidence: 85,
      };

      mockMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(mockResponse) }],
        usage: { input_tokens: 100, output_tokens: 50 },
      });

      const buffer = await createTestZip({
        'SKILL.md': '# Test',
        'test.py': 'print("hello")',
      });

      const report = await analyzeWithAI(buffer);

      expect(report).toHaveProperty('riskLevel');
      expect(report).toHaveProperty('threats');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('confidence');
      expect(report).toHaveProperty('analyzedAt');
      expect(report).toHaveProperty('modelUsed');
      expect(report).toHaveProperty('blockExecution');
    });
  });

  // ============================================
  // 12. analyzeSkillMetadata Tests
  // ============================================
  describe('analyzeSkillMetadata', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockMessagesCreate.mockReset();
    });

    it('should categorize skill correctly', async () => {
      const mockResponse = {
        category: 'DEVELOPMENT',
        tags: ['code-generation', 'typescript'],
        confidence: 85,
      };

      mockMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(mockResponse) }],
        usage: { input_tokens: 100, output_tokens: 50 },
      });

      const buffer = await createTestZip({
        'SKILL.md': '# TypeScript Helper\n\nHelps with TypeScript development.',
      });

      const result = await analyzeSkillMetadata(buffer, 'TypeScript Helper', 'Helps with TypeScript');

      expect(result.category).toBe('DEVELOPMENT');
      expect(result.tags).toContain('code-generation');
      expect(result.confidence).toBe(85);
    });

    it('should validate category values', async () => {
      const mockResponse = {
        category: 'INVALID_CATEGORY',
        tags: ['test'],
        confidence: 70,
      };

      mockMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(mockResponse) }],
        usage: { input_tokens: 100, output_tokens: 50 },
      });

      const buffer = await createTestZip({
        'SKILL.md': '# Test',
      });

      const result = await analyzeSkillMetadata(buffer, 'Test', 'Test skill');

      // Should fallback to DEVELOPMENT for invalid category
      expect(result.category).toBe('DEVELOPMENT');
    });

    it('should handle AI unavailable', async () => {
      mockMessagesCreate.mockRejectedValue(new Error('No API key'));

      const buffer = await createTestZip({
        'SKILL.md': '# Test',
      });

      const result = await analyzeSkillMetadata(buffer, 'Test', 'Test');

      expect(result.category).toBe('DEVELOPMENT'); // Default
      expect(result.tags).toHaveLength(0);
      expect(result.confidence).toBeLessThan(50);
    });

    it('should clean and validate tags', async () => {
      const mockResponse = {
        category: 'DEVELOPMENT',
        tags: ['Valid-Tag', 'UPPERCASE', 'with spaces', 'special!@#chars'],
        confidence: 80,
      };

      mockMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(mockResponse) }],
        usage: { input_tokens: 100, output_tokens: 50 },
      });

      const buffer = await createTestZip({
        'SKILL.md': '# Test',
      });

      const result = await analyzeSkillMetadata(buffer, 'Test', 'Test');

      // Tags should be lowercase and cleaned
      expect(result.tags.every(t => t === t.toLowerCase())).toBe(true);
      expect(result.tags.every(t => !/[^a-z0-9-]/.test(t))).toBe(true);
    });
  });

  // ============================================
  // 13. Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('should handle empty file content', async () => {
      const buffer = await createTestZip({
        'empty.py': '',
      });

      const result = await extractFilesForAnalysis(buffer);

      // Empty files should still be processed
      expect(result.scriptFiles).toHaveLength(1);
    });

    it('should handle files with special characters in path', async () => {
      const buffer = await createTestZip({
        'path/with spaces/file.py': 'print("hello")',
        'unicode/文件.py': 'print("hello")',
      });

      const result = await extractFilesForAnalysis(buffer);

      expect(result.scriptFiles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle deeply nested directories', async () => {
      const buffer = await createTestZip({
        'a/b/c/d/e/f/deep.py': 'print("deep")',
      });

      const result = await extractFilesForAnalysis(buffer);

      expect(result.scriptFiles).toHaveLength(1);
      expect(result.scriptFiles[0].path).toBe('a/b/c/d/e/f/deep.py');
    });

    it('should handle very long file content', async () => {
      const longContent = 'x'.repeat(200 * 1024); // 200KB
      const buffer = await createTestZip({
        'large.md': longContent,
      });

      const result = await extractFilesForAnalysis(buffer);

      // Should truncate and include in skipped files
      expect(result.skippedFiles.length).toBeGreaterThan(0);
    });

    it('should handle mixed line endings', () => {
      const mixedContent = 'line1\nline2\r\nline3\rline4';
      const hotspots = findSecurityHotspots([
        { path: 'test.txt', content: mixedContent, size: mixedContent.length, type: 'other' },
      ]);

      // Should not throw and should return an array
      expect(Array.isArray(hotspots)).toBe(true);
    });
  });
});
