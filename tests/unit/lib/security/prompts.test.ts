import {
  DEFAULT_SECURITY_RULES,
  buildSystemPrompt,
  buildSecurityAnalysisPrompt,
  getSecurityPromptConfig,
} from '@/lib/security/prompts';

describe('Security Prompts', () => {
  describe('DEFAULT_SECURITY_RULES', () => {
    it('should contain MD file security rules', () => {
      const mdRules = DEFAULT_SECURITY_RULES.filter(r => r.appliesTo.includes('md'));
      expect(mdRules.length).toBeGreaterThan(0);

      // Check for specific MD rules
      expect(mdRules.find(r => r.id === 'md-hardcoded-secrets')).toBeDefined();
      expect(mdRules.find(r => r.id === 'md-prompt-dangerous-commands')).toBeDefined();
      expect(mdRules.find(r => r.id === 'md-sensitive-path-access')).toBeDefined();
      expect(mdRules.find(r => r.id === 'md-bypass-security')).toBeDefined();
      expect(mdRules.find(r => r.id === 'md-network-attack')).toBeDefined();
      expect(mdRules.find(r => r.id === 'md-data-exfiltration')).toBeDefined();
      expect(mdRules.find(r => r.id === 'md-excessive-permissions')).toBeDefined();
      expect(mdRules.find(r => r.id === 'md-hidden-backdoor')).toBeDefined();
      expect(mdRules.find(r => r.id === 'md-persistence-mechanism')).toBeDefined();
      expect(mdRules.find(r => r.id === 'md-undeclared-data-transmission')).toBeDefined();
    });

    it('should contain script security rules', () => {
      const scriptRules = DEFAULT_SECURITY_RULES.filter(r => r.appliesTo.includes('scripts'));
      expect(scriptRules.length).toBeGreaterThan(0);

      // Check for specific script rules
      expect(scriptRules.find(r => r.id === 'script-hardcoded-secrets')).toBeDefined();
      expect(scriptRules.find(r => r.id === 'script-command-injection')).toBeDefined();
      expect(scriptRules.find(r => r.id === 'script-dynamic-code-execution')).toBeDefined();
      expect(scriptRules.find(r => r.id === 'script-path-traversal')).toBeDefined();
      expect(scriptRules.find(r => r.id === 'script-sensitive-path-access')).toBeDefined();
      expect(scriptRules.find(r => r.id === 'script-destructive-operations')).toBeDefined();
      expect(scriptRules.find(r => r.id === 'script-remote-code-execution')).toBeDefined();
      expect(scriptRules.find(r => r.id === 'script-ssrf')).toBeDefined();
      expect(scriptRules.find(r => r.id === 'script-data-theft')).toBeDefined();
      expect(scriptRules.find(r => r.id === 'script-hidden-execution')).toBeDefined();
      expect(scriptRules.find(r => r.id === 'script-privilege-escalation')).toBeDefined();
      expect(scriptRules.find(r => r.id === 'script-malicious-activity')).toBeDefined();
    });

    it('should contain coordination rules', () => {
      const coordinationRules = DEFAULT_SECURITY_RULES.filter(
        r => r.appliesTo.includes('md') && r.appliesTo.includes('scripts')
      );
      expect(coordinationRules.length).toBeGreaterThan(0);

      // Check for specific coordination rules
      expect(coordinationRules.find(r => r.id === 'coordination-prompt-script-bypass')).toBeDefined();
      expect(coordinationRules.find(r => r.id === 'coordination-permission-mismatch')).toBeDefined();
      expect(coordinationRules.find(r => r.id === 'coordination-sensitive-input-theft')).toBeDefined();
      expect(coordinationRules.find(r => r.id === 'coordination-hidden-backdoor-chain')).toBeDefined();
    });

    it('should have valid severity levels for all rules', () => {
      const validSeverities = ['low', 'medium', 'high', 'critical'];
      for (const rule of DEFAULT_SECURITY_RULES) {
        expect(validSeverities).toContain(rule.severity);
      }
    });

    it('should have all required fields for each rule', () => {
      for (const rule of DEFAULT_SECURITY_RULES) {
        expect(rule.id).toBeDefined();
        expect(rule.category).toBeDefined();
        expect(rule.name).toBeDefined();
        expect(rule.description).toBeDefined();
        expect(rule.checkDescription).toBeDefined();
        expect(rule.harmDescription).toBeDefined();
        expect(rule.appliesTo.length).toBeGreaterThan(0);
      }
    });

    it('should have critical severity for dangerous rules', () => {
      const criticalRules = DEFAULT_SECURITY_RULES.filter(r => r.severity === 'critical');
      expect(criticalRules.length).toBeGreaterThan(0);

      // These rules should be critical
      expect(criticalRules.find(r => r.id === 'md-hardcoded-secrets')).toBeDefined();
      expect(criticalRules.find(r => r.id === 'md-prompt-dangerous-commands')).toBeDefined();
      expect(criticalRules.find(r => r.id === 'script-command-injection')).toBeDefined();
      expect(criticalRules.find(r => r.id === 'script-remote-code-execution')).toBeDefined();
    });
  });

  describe('buildSystemPrompt', () => {
    it('should return a security-focused system prompt', () => {
      const prompt = buildSystemPrompt();

      expect(prompt).toContain('security');
      expect(prompt).toContain('analyst');
      expect(prompt).toContain('ONLY report security issues');
    });

    it('should explicitly exclude non-security issues', () => {
      const prompt = buildSystemPrompt();

      expect(prompt).toContain('Do NOT report');
      expect(prompt).toContain('Format');
      expect(prompt).toContain('syntax');
      expect(prompt).toContain('style');
    });
  });

  describe('buildSecurityAnalysisPrompt', () => {
    it('should include MD files in the prompt', () => {
      const mdFiles = [
        { path: 'SKILL.md', content: '# Test Skill' },
        { path: 'README.md', content: '## Description' },
      ];

      const prompt = buildSecurityAnalysisPrompt(mdFiles, []);

      expect(prompt).toContain('SKILL.md');
      expect(prompt).toContain('README.md');
      expect(prompt).toContain('# Test Skill');
      expect(prompt).toContain('## Description');
    });

    it('should include script files in the prompt', () => {
      const scriptFiles = [
        { path: 'scripts/setup.sh', content: '#!/bin/bash' },
        { path: 'scripts/main.py', content: 'import os' },
      ];

      const prompt = buildSecurityAnalysisPrompt([], scriptFiles);

      expect(prompt).toContain('scripts/setup.sh');
      expect(prompt).toContain('scripts/main.py');
      expect(prompt).toContain('#!/bin/bash');
      expect(prompt).toContain('import os');
    });

    it('should include both file types', () => {
      const mdFiles = [{ path: 'SKILL.md', content: 'Test' }];
      const scriptFiles = [{ path: 'main.py', content: 'print("hi")' }];

      const prompt = buildSecurityAnalysisPrompt(mdFiles, scriptFiles);

      expect(prompt).toContain('MD (Markdown) Files');
      expect(prompt).toContain('Script Files');
    });

    it('should include MD security check rules', () => {
      const prompt = buildSecurityAnalysisPrompt([{ path: 'SKILL.md', content: 'Test' }], []);

      expect(prompt).toContain('MD File Security Checks');
      expect(prompt).toContain('Hardcoded Secrets in MD');
      expect(prompt).toContain('Dangerous Command Induction');
      expect(prompt).toContain('Sensitive Path Access');
    });

    it('should include script security check rules', () => {
      const prompt = buildSecurityAnalysisPrompt([], [{ path: 'main.py', content: 'test' }]);

      expect(prompt).toContain('Script Security Checks');
      expect(prompt).toContain('Command Injection');
      expect(prompt).toContain('Dynamic Code Execution');
      expect(prompt).toContain('Remote Code Execution');
    });

    it('should include coordination check rules', () => {
      const prompt = buildSecurityAnalysisPrompt(
        [{ path: 'SKILL.md', content: 'Test' }],
        [{ path: 'main.py', content: 'test' }]
      );

      expect(prompt).toContain('Coordination Checks');
      expect(prompt).toContain('Prompt-Script Coordination Bypass');
      expect(prompt).toContain('Permission Mismatch');
    });

    it('should include output format requirements', () => {
      const prompt = buildSecurityAnalysisPrompt([], []);

      expect(prompt).toContain('JSON');
      expect(prompt).toContain('riskLevel');
      expect(prompt).toContain('findings');
      expect(prompt).toContain('severity');
      expect(prompt).toContain('blockExecution');
    });

    it('should include risk level indicators', () => {
      const prompt = buildSecurityAnalysisPrompt([], []);

      expect(prompt).toContain('critical');
      expect(prompt).toContain('high');
      expect(prompt).toContain('medium');
      expect(prompt).toContain('low');
    });
  });

  describe('getSecurityPromptConfig', () => {
    it('should return complete config', () => {
      const config = getSecurityPromptConfig();

      expect(config.version).toBeDefined();
      expect(config.lastUpdated).toBeDefined();
      expect(config.rules).toEqual(DEFAULT_SECURITY_RULES);
      expect(config.outputFormat).toBeDefined();
      expect(config.systemPrompt).toBeDefined();
    });

    it('should have valid version format', () => {
      const config = getSecurityPromptConfig();

      expect(config.version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });
});
