"use client";

import React, { useState, useEffect } from "react";
import { Database, Plus, RefreshCw, Trash2, DatabaseZap, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface DBItem {
  name: string;
  type: "mysql" | "postgres";
  sizeMb: number;
  user: string;
}

export default function DatabasesPage() {
  const [activeTab, setActiveTab] = useState<"mysql" | "postgres">("mysql");
  const [databases, setDatabases] = useState<DBItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newDbName, setNewDbName] = useState("");
  const [newDbUser, setNewDbUser] = useState("");
  const [newDbPassword, setNewDbPassword] = useState("");

  const fetchDatabases = async (type: "mysql" | "postgres") => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/databases/${type}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setDatabases(data);
    } catch (err: any) {
      console.error(err);
      setDatabases([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabases(activeTab);
  }, [activeTab]);

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewDbPassword(password);
  };

  const handleCreate = async () => {
    if (!newDbName || !newDbUser || !newDbPassword) {
      alert("Please fill all fields");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch(`/api/databases/${activeTab}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dbName: newDbName, dbUser: newDbUser, dbPassword: newDbPassword }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create database");
      
      setIsCreateOpen(false);
      setNewDbName("");
      setNewDbUser("");
      setNewDbPassword("");
      fetchDatabases(activeTab);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (dbName: string) => {
    if (!confirm(`Are you sure you want to delete database '${dbName}' and its user? This is irreversible!`)) return;
    
    try {
      const res = await fetch(`/api/databases/${activeTab}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dbName }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      
      fetchDatabases(activeTab);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredDbs = databases.filter(db => db.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Databases</h1>
          <p className="text-muted-foreground">Manage your MySQL and PostgreSQL (ช้าง) databases.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => fetchDatabases(activeTab)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Database
          </Button>
        </div>
      </div>

      <Tabs defaultValue="mysql" onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="mysql">MySQL / MariaDB</TabsTrigger>
          <TabsTrigger value="postgres">PostgreSQL</TabsTrigger>
        </TabsList>
        
        <div className="mt-6 flex items-center mb-4 max-w-md">
          <Search className="w-4 h-4 mr-2 text-muted-foreground" />
          <Input 
            placeholder="Search databases..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>

        <TabsContent value="mysql" className="mt-0">
          <DBTable 
            isLoading={isLoading} 
            databases={filteredDbs} 
            onDelete={handleDelete}
            type="MySQL"
          />
        </TabsContent>
        <TabsContent value="postgres" className="mt-0">
          <DBTable 
            isLoading={isLoading} 
            databases={filteredDbs} 
            onDelete={handleDelete}
            type="PostgreSQL"
          />
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create {activeTab === "mysql" ? "MySQL" : "PostgreSQL"} Database</DialogTitle>
            <DialogDescription>
              This will automatically create a database, a dedicated user, and grant all necessary permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dbname" className="text-right">DB Name</Label>
              <Input id="dbname" value={newDbName} onChange={(e) => setNewDbName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dbuser" className="text-right">Username</Label>
              <Input id="dbuser" value={newDbUser} onChange={(e) => setNewDbUser(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dbpass" className="text-right">Password</Label>
              <div className="col-span-3 flex space-x-2">
                <Input id="dbpass" value={newDbPassword} onChange={(e) => setNewDbPassword(e.target.value)} type="text" />
                <Button variant="outline" type="button" onClick={generatePassword}>Generate</Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DBTable({ isLoading, databases, onDelete, type }: { isLoading: boolean, databases: DBItem[], onDelete: (name: string) => void, type: string }) {
  return (
    <Card className="flex flex-col relative min-h-[400px]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 backdrop-blur-sm">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Database Name</TableHead>
            <TableHead>Owner / User</TableHead>
            <TableHead>Size (MB)</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {databases.length === 0 && !isLoading && (
            <TableRow>
              <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                <DatabaseZap className="w-12 h-12 mx-auto mb-3 opacity-20" />
                No {type} databases found.
              </TableCell>
            </TableRow>
          )}
          {databases.map((db) => (
            <TableRow key={db.name}>
              <TableCell className="font-medium flex items-center">
                <Database className="w-4 h-4 mr-2 text-primary" />
                {db.name}
              </TableCell>
              <TableCell>{db.user}</TableCell>
              <TableCell>{db.sizeMb.toFixed(2)} MB</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(db.name)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
