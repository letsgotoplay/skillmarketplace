'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Code, FileText, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  path: string;
  fileType?: string;
  sizeBytes?: number;
  content?: string | null;
}

function buildFileTree(files: { filePath: string; fileType: string; sizeBytes: number; content?: string | null }[]): FileNode {
  const root: FileNode = { name: '', type: 'folder', children: [], path: '' };

  files.forEach((file) => {
    const parts = file.filePath.split('/').filter(Boolean);
    let current = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const existingChild = current.children?.find((c) => c.name === part);

      if (existingChild) {
        current = existingChild;
      } else {
        const newNode: FileNode = {
          name: part,
          type: isFile ? 'file' : 'folder',
          path: parts.slice(0, index + 1).join('/'),
          children: isFile ? undefined : [],
          fileType: isFile ? file.fileType : undefined,
          sizeBytes: isFile ? file.sizeBytes : undefined,
          content: isFile ? file.content : undefined,
        };
        current.children?.push(newNode);
        current = newNode;
      }
    });
  });

  // Sort: folders first, then files, alphabetically
  const sortChildren = (node: FileNode) => {
    if (node.children) {
      node.children.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      node.children.forEach(sortChildren);
    }
  };
  sortChildren(root);

  return root;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

function getFileIcon(filename: string): string {
  const ext = getFileExtension(filename);
  const iconMap: Record<string, string> = {
    ts: '📘',
    tsx: '⚛️',
    js: '📒',
    jsx: '⚛️',
    py: '🐍',
    md: '📝',
    json: '📋',
    yaml: '⚙️',
    yml: '⚙️',
    txt: '📄',
    css: '🎨',
    html: '🌐',
    xml: '📄',
    sh: '🔧',
  };
  return iconMap[ext] || '📄';
}

function getFileCategory(filename: string, fileType?: string): 'markdown' | 'code' | 'config' | 'data' | 'other' {
  const ext = getFileExtension(filename);

  // Markdown files
  if (ext === 'md') return 'markdown';

  // Code files
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'sh', 'bash'].includes(ext)) {
    return 'code';
  }

  // Config files
  if (['yaml', 'yml', 'toml', 'ini', 'env', 'conf'].includes(ext)) {
    return 'config';
  }

  // Data files
  if (['json', 'xml', 'csv'].includes(ext)) {
    return 'data';
  }

  // Check MIME type as fallback
  if (fileType?.includes('markdown') || fileType?.includes('text/markdown')) return 'markdown';
  if (fileType?.includes('javascript') || fileType?.includes('typescript') || fileType?.includes('python')) return 'code';

  return 'other';
}

interface FileTreeProps {
  node: FileNode;
  level: number;
  expandedFolders: Set<string>;
  onToggle: (path: string) => void;
  selectedFile: string | null;
  onSelectFile: (path: string, name: string, fileType?: string, content?: string | null) => void;
}

function FileTreeNode({ node, level, expandedFolders, onToggle, selectedFile, onSelectFile }: FileTreeProps) {
  const isExpanded = expandedFolders.has(node.path);
  const isSelected = selectedFile === node.path;
  const paddingLeft = level * 16 + 8;

  if (node.type === 'folder') {
    return (
      <div>
        <button
          className={cn(
            'w-full flex items-center gap-1 py-1 px-2 text-sm hover:bg-muted/50 rounded transition-colors text-left',
            isSelected && 'bg-muted'
          )}
          style={{ paddingLeft }}
          onClick={() => onToggle(node.path)}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0" />
          )}
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-yellow-500 shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-yellow-500 shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {isExpanded && node.children?.map((child) => (
          <FileTreeNode
            key={child.path}
            node={child}
            level={level + 1}
            expandedFolders={expandedFolders}
            onToggle={onToggle}
            selectedFile={selectedFile}
            onSelectFile={onSelectFile}
          />
        ))}
      </div>
    );
  }

  return (
    <button
      className={cn(
        'w-full flex items-center gap-1 py-1 px-2 text-sm hover:bg-muted/50 rounded transition-colors text-left',
        isSelected && 'bg-primary/10 text-primary'
      )}
      style={{ paddingLeft: paddingLeft + 16 }}
      onClick={() => onSelectFile(node.path, node.name, node.fileType, node.content)}
    >
      <span className="shrink-0">{getFileIcon(node.name)}</span>
      <span className="truncate">{node.name}</span>
      {node.sizeBytes !== undefined && (
        <span className="text-xs text-muted-foreground ml-auto shrink-0">
          {formatFileSize(node.sizeBytes)}
        </span>
      )}
    </button>
  );
}

interface FilePreviewProps {
  filename: string;
  fileType?: string;
  filePath?: string;
  skillId?: string;
  skillDescription?: string;
  fileContent?: string | null;
}

function FilePreview({ filename, fileType, skillDescription, fileContent }: FilePreviewProps) {
  const { data: session } = useSession();
  const category = getFileCategory(filename, fileType);
  const ext = getFileExtension(filename);

  // For SKILL.md, show the skill description as a preview if no content available
  if (filename === 'SKILL.md' && skillDescription && !fileContent) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>{filename}</span>
          <span className="text-xs">• Documentation</span>
        </div>
        <div className="bg-muted/30 rounded-lg p-4 prose prose-sm dark:prose-invert max-w-none">
          <p className="text-sm whitespace-pre-wrap">{skillDescription}</p>
          <p className="text-xs text-muted-foreground mt-4 italic">
            This is the skill description from SKILL.md. Download the full file for complete documentation.
          </p>
        </div>
      </div>
    );
  }

  // For markdown files with content
  if (category === 'markdown' && fileContent) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>{filename}</span>
          <span className="text-xs">• Markdown</span>
        </div>
        <div className="bg-muted/30 rounded-lg overflow-hidden">
          <pre className="p-4 text-sm overflow-auto max-h-[400px] whitespace-pre-wrap break-words">
            {fileContent}
          </pre>
        </div>
      </div>
    );
  }

  // For code files with content
  if (category === 'code' && fileContent) {
    const languageMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      sh: 'bash',
      bash: 'bash',
    };
    const language = languageMap[ext] || 'typescript';

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Code className="h-4 w-4" />
          <span>{filename}</span>
          <span className="text-xs">• {language}</span>
        </div>
        <div className="bg-muted/30 rounded-lg overflow-hidden">
          <pre className="p-4 text-sm overflow-auto max-h-[400px]">
            <code>{fileContent}</code>
          </pre>
        </div>
      </div>
    );
  }

  // For config files with content
  if (category === 'config' && fileContent) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <File className="h-4 w-4" />
          <span>{filename}</span>
          <span className="text-xs">• Configuration</span>
        </div>
        <div className="bg-muted/30 rounded-lg overflow-hidden">
          <pre className="p-4 text-sm overflow-auto max-h-[400px]">
            {fileContent}
          </pre>
        </div>
      </div>
    );
  }

  // For data files with content
  if (category === 'data' && fileContent) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <File className="h-4 w-4" />
          <span>{filename}</span>
          <span className="text-xs">• Data</span>
        </div>
        <div className="bg-muted/30 rounded-lg overflow-hidden">
          <pre className="p-4 text-sm overflow-auto max-h-[400px]">
            {fileContent}
          </pre>
        </div>
      </div>
    );
  }

  // Fallback for files without content or unrecognized types
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <File className="h-4 w-4" />
        <span>{filename}</span>
        {fileType && <span className="text-xs">• {fileType}</span>}
      </div>
      <div className="bg-muted/30 rounded-lg p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <File className="h-5 w-5" />
          <span className="font-medium">File Preview</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Preview is not available for this file type.
          {session ? ' Download the skill to access this file.' : ' Sign in to download and access this file.'}
        </p>
        {session ? (
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Download Skill
          </Button>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <a href="/login">Sign in to Download</a>
          </Button>
        )}
      </div>
    </div>
  );
}

interface SkillFileBrowserProps {
  files: { filePath: string; fileType: string; sizeBytes: number; content?: string | null }[];
  skillId?: string;
  skillDescription?: string;
}

export function SkillFileBrowser({ files, skillId, skillDescription }: SkillFileBrowserProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['']));
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<string | undefined>();
  const [selectedFileContent, setSelectedFileContent] = useState<string | null | undefined>();

  const tree = buildFileTree(files);

  const handleToggle = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleSelectFile = (path: string, name: string, fileType?: string, content?: string | null) => {
    setSelectedFile(path);
    setSelectedFileName(name);
    setSelectedFileType(fileType);
    setSelectedFileContent(content);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* File Tree */}
      <div className="bg-muted/30 p-2 max-h-[400px] overflow-auto">
        {tree.children?.map((child) => (
          <FileTreeNode
            key={child.path}
            node={child}
            level={0}
            expandedFolders={expandedFolders}
            onToggle={handleToggle}
            selectedFile={selectedFile}
            onSelectFile={handleSelectFile}
          />
        ))}
      </div>

      {/* File Preview */}
      {selectedFile && selectedFileName && (
        <div className="border-t p-4 bg-card">
          <FilePreview
            filename={selectedFileName}
            fileType={selectedFileType}
            filePath={selectedFile}
            skillId={skillId}
            skillDescription={skillDescription}
            fileContent={selectedFileContent}
          />
        </div>
      )}
    </div>
  );
}
