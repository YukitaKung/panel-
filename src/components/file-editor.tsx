"use client";

import React, { useRef, useState } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Save, X, AlertCircle } from "lucide-react";

interface FileEditorProps {
  filePath: string;
  initialContent: string;
  onClose: () => void;
  onSave: (path: string, newContent: string) => Promise<void>;
}

export function FileEditor({ filePath, initialContent, onClose, onSave }: FileEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Extract file extension to determine language
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  let language = "plaintext";
  
  const langMap: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    json: "json",
    html: "html",
    css: "css",
    md: "markdown",
    php: "php",
    py: "python",
    sh: "shell",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    env: "ini",
  };

  if (langMap[ext]) {
    language = langMap[ext];
  } else if (filePath.includes(".env")) {
    language = "ini";
  }

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await onSave(filePath, content);
    } catch (err: any) {
      setError(err.message || "Failed to save file.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    // Add Ctrl+S support
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl h-[85vh] bg-card border rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-14 border-b flex items-center justify-between px-4 bg-muted/30">
          <div className="flex items-center space-x-2 truncate">
            <span className="font-mono text-sm text-muted-foreground truncate">{filePath}</span>
            {error && (
              <span className="flex items-center text-xs text-destructive ml-4">
                <AlertCircle className="w-3 h-3 mr-1" />
                {error}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save (Ctrl+S)"}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 w-full relative">
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={content}
            onChange={(value) => setContent(value || "")}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
            loading={
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Loading editor...
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
