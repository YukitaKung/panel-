"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Key, Copy, Trash2, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/apikeys");
      if (res.ok) {
        setKeys(await res.json());
      }
    } catch (error) {
      toast.error("Failed to fetch API keys");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }
    
    setIsCreating(true);
    try {
      const res = await fetch("/api/apikeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName })
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success("API key created successfully");
        setNewlyCreatedKey(data.key);
        setNewName("");
        fetchKeys();
      } else {
        toast.error(`Error: ${data.error}`);
      }
    } catch (error) {
      toast.error("Failed to create API key");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeClick = (id: string) => {
    setKeyToRevoke(id);
    setRevokeConfirmOpen(true);
  };

  const confirmRevoke = async () => {
    if (!keyToRevoke) return;
    const id = keyToRevoke;

    try {
      const res = await fetch(`/api/apikeys?id=${id}`, {
        method: "DELETE"
      });
      
      if (res.ok) {
        toast.success("API key revoked");
        fetchKeys();
      } else {
        const data = await res.json();
        toast.error(`Error: ${data.error}`);
      }
    } catch (error) {
      toast.error("Failed to revoke API key");
    } finally {
      setKeyToRevoke(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand("copy");
          toast.success("Copied to clipboard");
        } catch (err) {
          toast.error("Failed to copy text");
        } finally {
          textArea.remove();
        }
      }
    } catch (err) {
      toast.error("Failed to copy text");
    }
  };

  const maskKey = (key: string) => {
    if (key.length <= 15) return key;
    return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
        <p className="text-muted-foreground mt-1">Manage API keys to securely interact with the OX PANEL API.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Create New Key
            </CardTitle>
            <CardDescription>
              Generate a new API key to authenticate automated requests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Key Name</label>
                <Input 
                  placeholder="e.g. Deployment Script" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
              
              {newlyCreatedKey && (
                <div className="mt-4 p-4 rounded-none bg-green-500/10 border border-green-500/20">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-green-500">Key Created Successfully</p>
                      <p className="text-xs text-muted-foreground">Please copy this key now. For security reasons, you will not be able to see it again.</p>
                      <div className="flex items-center gap-2 mt-2">
                        <code className="text-sm bg-background p-2 rounded border flex-1 break-all">
                          {newlyCreatedKey}
                        </code>
                        <Button size="icon" variant="outline" onClick={() => copyToClipboard(newlyCreatedKey)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleCreate} disabled={isCreating} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Generate API Key
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-muted/30 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Security Notice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              API keys grant <strong>full access</strong> to your OX PANEL. Treat them exactly like your password.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Never share your API keys in public repositories or client-side code.</li>
              <li>Use environment variables to store them securely.</li>
              <li>If a key is compromised, revoke it immediately and generate a new one.</li>
            </ul>
            <p className="pt-2">
              See the <a href="/api-docs" className="text-primary hover:underline font-medium">API Documentation</a> for usage examples.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active API Keys</CardTitle>
          <CardDescription>You have {keys.length} active {keys.length === 1 ? 'key' : 'keys'}.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-none h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No API keys generated yet.
            </div>
          ) : (
            <div className="rounded-none border overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b bg-muted/50 text-sm">
                  <div className="col-span-3">Name</div>
                  <div className="col-span-4">Key</div>
                  <div className="col-span-2">Created</div>
                  <div className="col-span-2">Last Used</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>
                <div className="divide-y">
                  {keys.map((key) => (
                    <div key={key.id} className="grid grid-cols-12 gap-4 p-4 items-center text-sm">
                    <div className="col-span-3 font-medium">{key.name}</div>
                    <div className="col-span-4 font-mono text-muted-foreground">
                      {maskKey(key.key)}
                    </div>
                    <div className="col-span-2 text-muted-foreground">
                      {new Date(key.createdAt).toLocaleDateString()}
                    </div>
                    <div className="col-span-2">
                      {key.lastUsedAt ? (
                        <span className="text-muted-foreground">{new Date(key.lastUsedAt).toLocaleDateString()}</span>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground bg-muted/50">Never</Badge>
                      )}
                    </div>
                    <div className="col-span-1 text-right">
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleRevokeClick(key.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={revokeConfirmOpen}
        onOpenChange={setRevokeConfirmOpen}
        title="Revoke API Key"
        description="Are you sure you want to revoke this API key? Any scripts or applications currently using this key will immediately be denied access."
        confirmText="Yes, revoke it"
        onConfirm={confirmRevoke}
      />
    </div>
  );
}
