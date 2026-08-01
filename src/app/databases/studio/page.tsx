"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Database, Table as TableIcon, Play, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Editor from "@monaco-editor/react";

function StudioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const type = searchParams.get("type") || "mysql";
  const dbName = searchParams.get("db");

  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [data, setData] = useState<{ columns: string[], rows: any[] } | null>(null);
  
  const [query, setQuery] = useState("");
  const [queryResult, setQueryResult] = useState<{ columns: string[], rows: any[], message?: string } | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dbName) {
      router.push("/databases");
      return;
    }
    fetchTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbName, type]);

  const fetchTables = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/databases/studio/tables?type=${type}&db=${dbName}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setTables(d.tables);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTable = async (tableName: string) => {
    setSelectedTable(tableName);
    setIsLoading(true);
    setError(null);
    setQueryResult(null);
    try {
      const res = await fetch(`/api/databases/studio/data?type=${type}&db=${dbName}&table=${tableName}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setData({ columns: d.columns, rows: d.rows });
      setQuery(`SELECT * FROM ${type === 'mysql' ? `\`${tableName}\`` : `"${tableName}"`} LIMIT 50;`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const runQuery = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/databases/studio/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, dbName, query }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setQueryResult(d);
      setData(null); // Clear table view since we are viewing query results
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!dbName) return null;

  const currentView = queryResult || data;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Database className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">
            {dbName} <span className="text-sm font-normal text-muted-foreground uppercase ml-2">({type})</span>
          </h1>
        </div>
        <Button variant="outline" onClick={() => router.push("/databases")}>Back to Databases</Button>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Sidebar (Tables) */}
        <Card className="w-64 flex flex-col overflow-hidden bg-muted/10">
          <div className="p-3 border-b font-semibold flex items-center justify-between bg-muted/20">
            <span>Tables</span>
            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={fetchTables}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {tables.length === 0 && !isLoading && (
              <p className="text-sm text-muted-foreground text-center mt-4">No tables found</p>
            )}
            {tables.map(t => (
              <Button
                key={t}
                variant={selectedTable === t ? "secondary" : "ghost"}
                className="w-full justify-start font-normal text-sm"
                onClick={() => handleSelectTable(t)}
              >
                <TableIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="truncate">{t}</span>
              </Button>
            ))}
          </div>
        </Card>

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Query Editor */}
          <Card className="h-48 flex flex-col overflow-hidden border-primary/20">
            <div className="flex items-center justify-between p-2 border-b bg-muted/20">
              <span className="text-sm font-semibold ml-2">SQL Editor</span>
              <Button size="sm" onClick={runQuery} disabled={isLoading}>
                <Play className="w-4 h-4 mr-2" />
                Run Query (F5)
              </Button>
            </div>
            <div className="flex-1">
              <Editor
                height="100%"
                language="sql"
                theme="vs-dark"
                value={query}
                onChange={(v) => setQuery(v || "")}
                options={{ minimap: { enabled: false }, padding: { top: 10 } }}
                onMount={(editor, monaco) => {
                  editor.addCommand(monaco.KeyCode.F5, () => runQuery());
                }}
              />
            </div>
          </Card>

          {/* Results Grid */}
          <Card className="flex-1 flex flex-col overflow-hidden relative">
            <div className="p-2 border-b bg-muted/20 flex items-center justify-between">
              <span className="text-sm font-semibold ml-2">
                {queryResult ? "Query Results" : selectedTable ? `Data: ${selectedTable}` : "Results"}
              </span>
              {queryResult?.message && (
                <span className="text-xs text-muted-foreground">{queryResult.message}</span>
              )}
            </div>

            <div className="flex-1 overflow-auto relative">
              {isLoading && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 backdrop-blur-sm">
                  <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}

              {error && (
                <div className="p-6 text-center text-destructive">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>{error}</p>
                </div>
              )}

              {!error && currentView && currentView.columns && currentView.columns.length > 0 && (
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0 shadow-sm z-0">
                    <TableRow>
                      {currentView.columns.map(c => (
                        <TableHead key={c} className="whitespace-nowrap">{c}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentView.rows.map((row, i) => (
                      <TableRow key={i}>
                        {currentView.columns.map(c => (
                          <TableCell key={c} className="max-w-xs truncate" title={String(row[c])}>
                            {row[c] !== null ? String(row[c]) : <span className="text-muted-foreground italic">NULL</span>}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {!error && currentView && currentView.columns?.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No data returned.
                </div>
              )}

              {!error && !currentView && !isLoading && (
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                  <Database className="w-12 h-12 mb-4 opacity-20" />
                  <p>Select a table or run a query to view data.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={<div>Loading Studio...</div>}>
      <StudioContent />
    </Suspense>
  );
}
