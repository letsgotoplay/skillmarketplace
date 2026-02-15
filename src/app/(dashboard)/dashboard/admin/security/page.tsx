'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SecurityRule {
  id: string;
  category: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  appliesTo: ('md' | 'scripts')[];
  checkDescription: string;
  harmDescription: string;
}

interface SecurityConfig {
  id: string;
  name: string;
  version: string;
  systemPrompt: string;
  rulesJson: SecurityRule[];
  outputFormat: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ConfigResponse {
  config: SecurityConfig;
  versions: Array<{
    id: string;
    name: string;
    version: string;
    isActive: boolean;
    createdAt: string;
  }>;
}

export default function SecurityConfigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [rules, setRules] = useState<SecurityRule[]>([]);
  const [selectedRuleIndex, setSelectedRuleIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/security-config');
      if (!response.ok) {
        throw new Error('Failed to fetch config');
      }
      const data: ConfigResponse = await response.json();
      setConfig(data);
      setSystemPrompt(data.config.systemPrompt);
      setRules(data.config.rulesJson);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load config');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/security-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: config?.config.name || 'default',
          systemPrompt,
          rulesJson: rules,
          outputFormat: config?.config.outputFormat || '',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save config');
      }

      const data = await response.json();
      setSuccess(data.message);
      fetchConfig();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  const updateRule = (index: number, field: keyof SecurityRule, value: string | ('md' | 'scripts')[]) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setRules(newRules);
  };

  const addRule = () => {
    const newRule: SecurityRule = {
      id: `custom-${Date.now()}`,
      category: 'Custom',
      name: 'New Rule',
      description: 'Custom security rule',
      severity: 'medium',
      appliesTo: ['md', 'scripts'],
      checkDescription: 'Description of what to check',
      harmDescription: 'Description of potential harm',
    };
    setRules([...rules, newRule]);
    setSelectedRuleIndex(rules.length);
  };

  const deleteRule = (index: number) => {
    const newRules = rules.filter((_, i) => i !== index);
    setRules(newRules);
    if (selectedRuleIndex === index) {
      setSelectedRuleIndex(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/dashboard/admin">
            <Button variant="ghost" size="sm">
              ← Back to Admin
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold">Security Configuration</h1>
        <p className="text-muted-foreground">
          Manage AI security analysis prompts and rules
          {config?.config.version && (
            <Badge variant="secondary" className="ml-2">
              v{config.config.version}
            </Badge>
          )}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-md">
          {success}
        </div>
      )}

      <Tabs defaultValue="prompt" className="space-y-6">
        <TabsList>
          <TabsTrigger value="prompt">System Prompt</TabsTrigger>
          <TabsTrigger value="rules">Security Rules</TabsTrigger>
          <TabsTrigger value="history">Version History</TabsTrigger>
        </TabsList>

        <TabsContent value="prompt">
          <Card>
            <CardHeader>
              <CardTitle>System Prompt</CardTitle>
              <CardDescription>
                The system prompt defines the AI&apos;s role and behavior during security analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={15}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Rules List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Security Rules</CardTitle>
                    <CardDescription>
                      {rules.length} rules defined
                    </CardDescription>
                  </div>
                  <Button onClick={addRule} size="sm">Add Rule</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {rules.map((rule, index) => (
                    <div
                      key={rule.id}
                      className={`p-3 border rounded-md cursor-pointer hover:bg-muted/50 ${
                        selectedRuleIndex === index ? 'bg-muted border-primary' : ''
                      }`}
                      onClick={() => setSelectedRuleIndex(index)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{rule.name}</span>
                          <Badge
                            variant={
                              rule.severity === 'critical' ? 'destructive' :
                              rule.severity === 'high' ? 'default' :
                              rule.severity === 'medium' ? 'secondary' : 'outline'
                            }
                            className="ml-2"
                          >
                            {rule.severity}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{rule.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Rule Editor */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedRuleIndex !== null ? 'Edit Rule' : 'Select a Rule'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedRuleIndex !== null ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Rule ID</Label>
                      <Input
                        value={rules[selectedRuleIndex].id}
                        onChange={(e) => updateRule(selectedRuleIndex, 'id', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={rules[selectedRuleIndex].name}
                        onChange={(e) => updateRule(selectedRuleIndex, 'name', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Category</Label>
                        <Input
                          value={rules[selectedRuleIndex].category}
                          onChange={(e) => updateRule(selectedRuleIndex, 'category', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Severity</Label>
                        <Select
                          value={rules[selectedRuleIndex].severity}
                          onValueChange={(value) => updateRule(selectedRuleIndex, 'severity', value as SecurityRule['severity'])}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={rules[selectedRuleIndex].description}
                        onChange={(e) => updateRule(selectedRuleIndex, 'description', e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label>Check Description</Label>
                      <Textarea
                        value={rules[selectedRuleIndex].checkDescription}
                        onChange={(e) => updateRule(selectedRuleIndex, 'checkDescription', e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label>Harm Description</Label>
                      <Textarea
                        value={rules[selectedRuleIndex].harmDescription}
                        onChange={(e) => updateRule(selectedRuleIndex, 'harmDescription', e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="destructive"
                        onClick={() => deleteRule(selectedRuleIndex)}
                      >
                        Delete Rule
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Select a rule from the list to edit it
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Version History</CardTitle>
              <CardDescription>Previous versions of the security configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {config?.versions.map((version) => (
                  <div
                    key={version.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div>
                      <span className="font-medium">{version.name}</span>
                      <Badge variant="secondary" className="ml-2">v{version.version}</Badge>
                      {version.isActive && (
                        <Badge variant="default" className="ml-2">Active</Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(version.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4 mt-6">
        <Button variant="outline" onClick={() => fetchConfig()}>
          Reset Changes
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save New Version'}
        </Button>
      </div>

      <div className="mt-8">
        <Link href="/dashboard/admin/security/reanalysis">
          <Button variant="outline">
            Go to Re-Analysis →
          </Button>
        </Link>
      </div>
    </div>
  );
}
