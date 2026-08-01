"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Database, Table as TableIcon, AlertCircle, RefreshCw, Upload, Edit2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function StudioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const type = searchParams.get("type") || "mysql";
  const dbName = searchParams.get("db");

  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [data, setData] = useState<{ columns: string[], rows: any[] } | null>(null);
  
  // Edit State
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

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

  const handleSelectTable = async (tableName: string | null) => {
    if (!tableName) return;
    setSelectedTable(tableName);
    setEditingRowIndex(null);
    setIsLoading(true);
    setError(null);
    setUploadMessage(null);
    try {
      const res = await fetch(`/api/databases/studio/data?type=${type}&db=${dbName}&table=${tableName}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setData({ columns: d.columns, rows: d.rows });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSql = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !dbName) return;

    if (!file.name.endsWith(".sql")) {
      toast.error("Please upload a valid .sql file.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    formData.append("dbName", dbName);

    try {
      const res = await fetch(`/api/databases/studio/upload`, {
        method: "POST",
        body: formData,
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Upload failed");
      
      setUploadMessage("SQL file executed successfully!");
      toast.success("SQL file executed successfully!");
      fetchTables(); // Refresh tables after upload
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleEditClick = (index: number) => {
    if (!data) return;
    setEditingRowIndex(index);
    setEditData({ ...data.rows[index] });
  };

  const handleSaveRow = async (index: number) => {
    if (!data || !selectedTable) return;
    setIsSaving(true);
    setError(null);
    try {
      const oldData = data.rows[index];
      const res = await fetch(`/api/databases/studio/data`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, dbName, tableName: selectedTable, oldData, newData: editData }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to update row");
      
      // Update local state to reflect changes
      const newRows = [...data.rows];
      newRows[index] = { ...editData };
      setData({ ...data, rows: newRows });
      setEditingRowIndex(null);
      setUploadMessage("Row updated successfully.");
      toast.success("Row updated successfully");
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!dbName) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Database className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">
            {dbName} <span className="text-sm font-normal text-muted-foreground uppercase ml-2">({type})</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            accept=".sql" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleUploadSql} 
          />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            {isUploading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Upload .sql
          </Button>
          <Button variant="outline" onClick={() => router.push("/databases")}>Back to Databases</Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 gap-4 overflow-hidden">
        {/* Mobile View: Select Dropdown for Tables */}
        <div className="md:hidden">
          <Select value={selectedTable || ""} onValueChange={handleSelectTable}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a table..." />
            </SelectTrigger>
            <SelectContent>
              {tables.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop View: Sidebar (Tables) */}
        <Card className="hidden md:flex w-64 flex-col overflow-hidden bg-muted/10 border">
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
        <Card className="flex-1 flex flex-col overflow-hidden relative border min-h-[400px]">
          <div className="p-3 border-b bg-muted/20 flex items-center justify-between">
            <span className="text-sm font-semibold ml-2">
              {selectedTable ? `Data: ${selectedTable}` : "Data View"}
            </span>
          </div>

          <div className="flex-1 overflow-auto relative bg-background">
            {isLoading && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 backdrop-blur-sm">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}

            {uploadMessage && (
              <div className="p-4 m-4 bg-green-500/10 text-green-500 rounded-md text-sm">
                {uploadMessage}
              </div>
            )}

            {error && (
              <div className="p-6 text-center text-destructive">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p>{error}</p>
              </div>
            )}

            {!error && data && data.columns && data.columns.length > 0 && (
              <div className="w-full h-full">
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0 shadow-sm z-0">
                    <TableRow>
                      {data.columns.map(c => (
                        <TableHead key={c} className="whitespace-nowrap">{c}</TableHead>
                      ))}
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rows.map((row, i) => (
                      <TableRow key={i}>
                        {data.columns.map(c => (
                          <TableCell key={c} className="max-w-xs truncate" title={String(row[c])}>
                            {editingRowIndex === i ? (
                              <Input 
                                value={editData[c] === null ? "" : editData[c]}
                                onChange={(e) => setEditData({ ...editData, [c]: e.target.value })}
                                className="h-8"
                              />
                            ) : (
                              row[c] !== null ? String(row[c]) : <span className="text-muted-foreground italic">NULL</span>
                            )}
                          </TableCell>
                        ))}
                        <TableCell className="text-right">
                          {editingRowIndex === i ? (
                            <div className="flex justify-end space-x-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10" onClick={() => handleSaveRow(i)} disabled={isSaving}>
                                {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setEditingRowIndex(null)} disabled={isSaving}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(i)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {!error && data && data.columns?.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No data in this table.
              </div>
            )}

            {!error && !data && !isLoading && (
              <div className="p-8 h-full text-center text-muted-foreground flex flex-col items-center justify-center">
                <Database className="w-12 h-12 mb-4 opacity-20" />
                <p>Select a table to view its data.</p>
              </div>
            )}
          </div>
        </Card>
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
