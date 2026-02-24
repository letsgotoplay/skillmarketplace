'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  FileText,
  Folder,
  FolderOpen,
  Shield,
  FlaskConical,
  Info,
  Code,
  ChevronRight,
  ChevronDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Copy,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SecurityFindings } from '@/components/security/security-findings';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { cn } from '@/lib/utils';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  size?: number;
  content?: string | null;
}

interface SkillVersion {
  id: string;
  version: string;
  changelog: string | null;
  status: string;
  createdAt: string;
  processingComplete: boolean | null;
  aiSecurityAnalyzed?: boolean | null;
  aiSecurityReport?: unknown;
  files: Array<{
    id: string;
    filePath: string;
    fileType: string;
    sizeBytes: number;
    content?: string | null;
  }>;
  evals: Array<{
    id: string;
    status: string;
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
    error: string | null;
    results: Array<{
      id: string;
      testName: string;
      status: string;
      output: string | null;
      durationMs: number;
    }>;
  }>;
  scans: Array<{
    id: string;
    status: string;
    reportJson: unknown;
    createdAt: string;
  }>;
}

interface SkillDetailTabsProps {
  skillId: string;
  skillName: string;
  skillDescription: string | null;
  skillVisibility: string;
  authorName: string | null;
  authorEmail: string;
  createdAt: string;
  versions: SkillVersion[];
}

// Build file tree from flat list of files
function buildFileTree(files: SkillVersion['files']): FileNode[] {
  const root: FileNode[] = [];

  files.forEach((file) => {
    const parts = file.filePath.split('/');
    let current = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const existing = current.find((n) => n.name === part);

      if (existing) {
        if (!isFile) {
          current = existing.children || [];
        }
      } else {
        const node: FileNode = {
          name: part,
          path: file.filePath,
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
          size: isFile ? file.sizeBytes : undefined,
          content: isFile ? file.content : undefined,
        };
        current.push(node);
        if (!isFile) {
          current = node.children || [];
        }
      }
    });
  });

  // Sort: folders first, then files, alphabetically
  const sortNodes = (nodes: FileNode[]): FileNode[] => {
    return nodes
      .map((node) => ({
        ...node,
        children: node.children ? sortNodes(node.children) : undefined,
      }))
      .sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
  };

  return sortNodes(root);
}

function FileTreeItem({
  node,
  depth = 0,
  selectedFile,
  onSelectFile,
}: {
  node: FileNode;
  depth?: number;
  selectedFile: string | null;
  onSelectFile: (node: FileNode) => void;
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  const isFolder = node.type === 'folder';
  const isSelected = selectedFile === node.path;

  return (
    <div>
      <button
        className={cn(
          'w-full flex items-center gap-1 px-2 py-1 text-sm hover:bg-accent rounded-sm text-left',
          isSelected && 'bg-accent'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => {
          if (isFolder) {
            setExpanded(!expanded);
          } else {
            onSelectFile(node);
          }
        }}
      >
        {isFolder ? (
          <>
            {expanded ? (
              <ChevronDown className="h-3 w-3 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-3 w-3 flex-shrink-0" />
            )}
            {expanded ? (
              <FolderOpen className="h-4 w-4 text-yellow-600 flex-shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-yellow-600 flex-shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-3" />
            <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
          </>
        )}
        <span className="truncate">{node.name}</span>
        {node.size !== undefined && (
          <span className="text-xs text-muted-foreground ml-auto">
            {(node.size / 1024).toFixed(1)}KB
          </span>
        )}
      </button>
      {isFolder && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Copy button for file viewer
function FileCopyButton({ content }: { content: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 hover:bg-muted rounded transition-colors"
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );
}

function FileViewer({ file }: { file: FileNode | null }) {
  if (!file) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Select a file to view its contents</p>
        </div>
      </div>
    );
  }

  const isBinary = !file.content;
  const isImage = file.path.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i);
  const extension = file.path.split('.').pop()?.toLowerCase();
  const isMarkdown = extension === 'md';

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span className="font-medium">{file.name}</span>
          {file.size !== undefined && (
            <span className="text-muted-foreground">
              ({(file.size / 1024).toFixed(1)} KB)
            </span>
          )}
        </div>
        {!isBinary && file.content && (
          <FileCopyButton content={file.content} />
        )}
      </div>
      <div className="flex-1 overflow-auto">
        {isBinary ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              {isImage ? (
                <>
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Image preview not available</p>
                </>
              ) : (
                <>
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Binary file - preview not available</p>
                </>
              )}
            </div>
          </div>
        ) : isMarkdown ? (
          <div className="p-4">
            <MarkdownRenderer content={file.content || ''} />
          </div>
        ) : (
          <pre className="p-4 text-sm overflow-auto">
            <code>{file.content}</code>
          </pre>
        )}
      </div>
    </div>
  );
}

function getEvalStatusIcon(status: string) {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'FAILED':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'RUNNING':
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    default:
      return <Clock className="h-4 w-4 text-yellow-500" />;
  }
}

function getTestStatusIcon(status: string) {
  switch (status) {
    case 'PASSED':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'FAILED':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  }
}

export function SkillDetailTabs({
  skillName,
  skillDescription,
  skillVisibility,
  authorName,
  authorEmail,
  createdAt,
  versions,
}: SkillDetailTabsProps) {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);

  const latestVersion = versions[0];
  const fileTree = latestVersion ? buildFileTree(latestVersion.files) : [];

  // Process security data
  const scan = latestVersion?.scans[0];
  const reportJson = scan?.reportJson as {
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    findings?: Array<{
      id: string;
      title: string;
      description: string;
      severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
      category: string;
      file?: string;
      line?: number;
      codeSnippet?: string;
      recommendation: string;
      source: 'pattern' | 'ai';
    }>;
    summary?: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      info: number;
      total: number;
    };
    analyzedAt?: string;
    analyzedFiles?: number;
  } | null;

  const aiReport = latestVersion?.aiSecurityReport as {
    riskLevel?: string;
    threats?: Array<{
      id: string;
      title: string;
      description: string;
      severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
      category: string;
      file?: string;
      line?: number;
      codeSnippet?: string;
      recommendation: string;
      source: 'pattern' | 'ai';
    }>;
    recommendations?: string[];
    confidence?: number;
  } | null;

  // Combine findings
  const patternFindings = reportJson?.findings || [];
  const aiFindings = aiReport?.threats || [];
  const allFindings = [...patternFindings, ...aiFindings];

  // Determine risk level
  const riskLevels = ['low', 'medium', 'high', 'critical'] as const;
  const patternLevel = reportJson?.riskLevel;
  const aiLevel = aiReport?.riskLevel as string | undefined;
  const patternIndex = patternLevel ? riskLevels.indexOf(patternLevel) : -1;
  const aiIndex = aiLevel ? riskLevels.indexOf(aiLevel as typeof riskLevels[number]) : -1;
  const maxIndex = Math.max(patternIndex, aiIndex);
  const combinedRiskLevel = maxIndex >= 0 ? riskLevels[maxIndex] : 'unknown';

  // Evaluations
  const evaluations = latestVersion?.evals || [];

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview" className="flex items-center gap-1">
          <Info className="h-4 w-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="files" className="flex items-center gap-1">
          <FileText className="h-4 w-4" />
          Files
        </TabsTrigger>
        <TabsTrigger value="security" className="flex items-center gap-1">
          <Shield className="h-4 w-4" />
          Security
        </TabsTrigger>
        <TabsTrigger value="evaluations" className="flex items-center gap-1">
          <FlaskConical className="h-4 w-4" />
          Evaluations
        </TabsTrigger>
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Skill Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{skillName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Visibility</p>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    skillVisibility === 'PUBLIC'
                      ? 'bg-green-100 text-green-700'
                      : skillVisibility === 'TEAM_ONLY'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  )}
                >
                  {skillVisibility.toLowerCase().replace('_', ' ')}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Author</p>
                <p className="font-medium">{authorName || authorEmail}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{new Date(createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            {skillDescription && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{skillDescription}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Version History */}
        <Card>
          <CardHeader>
            <CardTitle>Version History</CardTitle>
            <CardDescription>All versions of this skill</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">v{version.version}</span>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs',
                          version.status === 'APPROVED'
                            ? 'bg-green-100 text-green-700'
                            : version.status === 'REJECTED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        )}
                      >
                        {version.status}
                      </span>
                      {version.processingComplete === false && (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Processing
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {version.changelog || 'No changelog'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created {new Date(version.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Files Tab */}
      <TabsContent value="files" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Skill Files</CardTitle>
            <CardDescription>
              {latestVersion
                ? `v${latestVersion.version} - ${latestVersion.files.length} files`
                : 'No files'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fileTree.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No files available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[500px]">
                {/* File Tree */}
                <div className="border rounded-lg overflow-auto">
                  <div className="p-2 border-b bg-muted/50 text-sm font-medium">
                    File Structure
                  </div>
                  <div className="py-2">
                    {fileTree.map((node) => (
                      <FileTreeItem
                        key={node.path}
                        node={node}
                        selectedFile={selectedFile?.path || null}
                        onSelectFile={setSelectedFile}
                      />
                    ))}
                  </div>
                </div>

                {/* File Content */}
                <div className="border rounded-lg overflow-hidden">
                  <FileViewer file={selectedFile} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Security Tab */}
      <TabsContent value="security" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Security Analysis</CardTitle>
            <CardDescription>
              {latestVersion ? `v${latestVersion.version}` : 'No version'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!scan && !latestVersion?.aiSecurityAnalyzed ? (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 mx-auto mb-2 text-blue-500 animate-spin" />
                <p className="text-muted-foreground">Security analysis in progress...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Pattern Scan Section */}
                {patternFindings.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Pattern Scan Results
                    </h3>
                    <SecurityFindings
                      riskLevel={reportJson?.riskLevel || 'low'}
                      findings={patternFindings}
                      summary={{
                        critical: patternFindings.filter((f) => f.severity === 'critical').length,
                        high: patternFindings.filter((f) => f.severity === 'high').length,
                        medium: patternFindings.filter((f) => f.severity === 'medium').length,
                        low: patternFindings.filter((f) => f.severity === 'low').length,
                        info: patternFindings.filter((f) => f.severity === 'info').length,
                        total: patternFindings.length,
                      }}
                      analyzedAt={reportJson?.analyzedAt}
                      analyzedFiles={reportJson?.analyzedFiles}
                    />
                  </div>
                )}

                {/* AI Analysis Section */}
                {aiReport && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      AI Security Analysis
                    </h3>
                    {aiFindings.length > 0 && (
                      <div className="mb-4">
                        <SecurityFindings
                          riskLevel={(aiReport.riskLevel as typeof combinedRiskLevel) || 'low'}
                          findings={aiFindings}
                          summary={{
                            critical: aiFindings.filter((f) => f.severity === 'critical').length,
                            high: aiFindings.filter((f) => f.severity === 'high').length,
                            medium: aiFindings.filter((f) => f.severity === 'medium').length,
                            low: aiFindings.filter((f) => f.severity === 'low').length,
                            info: aiFindings.filter((f) => f.severity === 'info').length,
                            total: aiFindings.length,
                          }}
                        />
                      </div>
                    )}
                    {aiReport.recommendations && aiReport.recommendations.length > 0 && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-800 mb-2">AI Recommendations</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          {aiReport.recommendations.map((rec, i) => (
                            <li key={i}>• {rec}</li>
                          ))}
                        </ul>
                        {aiReport.confidence && (
                          <p className="text-xs text-blue-600 mt-2">
                            AI Confidence: {aiReport.confidence}%
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Combined Summary */}
                {allFindings.length === 0 && (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p className="text-green-600 font-medium">No security issues found</p>
                  </div>
                )}

                {/* Security Score */}
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Security Score</h4>
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'text-4xl font-bold',
                        combinedRiskLevel === 'critical' || combinedRiskLevel === 'high'
                          ? 'text-red-600'
                          : combinedRiskLevel === 'medium'
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      )}
                    >
                      {combinedRiskLevel === 'critical'
                        ? 0
                        : combinedRiskLevel === 'high'
                        ? 25
                        : combinedRiskLevel === 'medium'
                        ? 50
                        : combinedRiskLevel === 'low'
                        ? 75
                        : 100}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Based on {allFindings.length} findings</p>
                      <p>
                        Risk Level:{' '}
                        <span className="font-medium capitalize">{combinedRiskLevel}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Evaluations Tab */}
      <TabsContent value="evaluations" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Evaluation Results</CardTitle>
            <CardDescription>
              Test case execution results for this skill
            </CardDescription>
          </CardHeader>
          <CardContent>
            {evaluations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FlaskConical className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No evaluations available</p>
                <p className="text-sm mt-1">
                  Evaluations will appear here if the skill includes test cases
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {evaluations.map((evaluation) => (
                  <div key={evaluation.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {getEvalStatusIcon(evaluation.status)}
                        <span className="font-medium capitalize">
                          {evaluation.status.toLowerCase()}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(evaluation.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {evaluation.error && (
                      <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                        {evaluation.error}
                      </div>
                    )}

                    {evaluation.results.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Test Results</h4>
                        <div className="space-y-1">
                          {evaluation.results.map((result) => (
                            <div
                              key={result.id}
                              className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                            >
                              <div className="flex items-center gap-2">
                                {getTestStatusIcon(result.status)}
                                <span>{result.testName}</span>
                              </div>
                              <span className="text-muted-foreground">
                                {result.durationMs}ms
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Summary */}
                        <div className="mt-4 flex gap-4 text-sm">
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            {evaluation.results.filter((r) => r.status === 'PASSED').length} passed
                          </div>
                          <div className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-4 w-4" />
                            {evaluation.results.filter((r) => r.status === 'FAILED').length} failed
                          </div>
                        </div>
                      </div>
                    )}

                    {evaluation.status === 'PENDING' && (
                      <div className="flex items-center gap-2 text-sm text-yellow-600">
                        <Clock className="h-4 w-4" />
                        Queued for execution
                      </div>
                    )}

                    {evaluation.status === 'RUNNING' && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Running evaluation...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
