"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, RefreshCw, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface Subdomain {
  domain: string;
  sslEnabled: boolean;
  sslStatus: string;
}

export default function SSLPage() {
  const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubdomains = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/subdomains");
      if (res.ok) {
        setSubdomains(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch subdomains:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubdomains();
  }, []);

  const issueSsl = async (domain: string) => {
    toast.loading(`Issuing SSL for ${domain}...`, { id: 'issue-ssl' });
    try {
      const res = await fetch("/api/ssl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain })
      });
      if (res.ok) {
        toast.success(`SSL issued successfully for ${domain}!`, { id: 'issue-ssl' });
        fetchSubdomains();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to issue SSL");
      }
    } catch (error: any) {
      toast.error(error.message, { id: 'issue-ssl' });
    }
  };

  const toggleAutoSsl = async (domain: string, currentVal: boolean) => {
    const newVal = !currentVal;
    try {
      const res = await fetch("/api/ssl", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, sslEnabled: newVal })
      });
      if (res.ok) {
        toast.success(`Auto-SSL ${newVal ? 'enabled' : 'disabled'} for ${domain}`);
        fetchSubdomains();
      }
    } catch (error) {
      toast.error("Failed to update setting");
    }
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1"/> Active</Badge>;
      case "pending":
        return <Badge variant="secondary" className="text-blue-500 bg-blue-500/10"><RefreshCw className="w-3 h-3 mr-1 animate-spin"/> Issuing...</Badge>;
      case "error":
        return <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20"><XCircle className="w-3 h-3 mr-1"/> Failed</Badge>;
      default:
        return <Badge variant="outline">No Certificate</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ความปลอดภัย (SSL/TLS)</h1>
          <p className="text-muted-foreground mt-1">Manage SSL certificates and Let's Encrypt auto-renewals.</p>
        </div>
        <Button variant="outline" onClick={fetchSubdomains}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh Status
        </Button>
      </div>

      <Card className="shadow-soft border-muted/40">
        <CardHeader className="bg-muted/10 border-b">
          <CardTitle>Certificates List</CardTitle>
          <CardDescription>View and manage SSL for your subdomains.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Domain</TableHead>
                <TableHead>SSL Status</TableHead>
                <TableHead>Auto Renew</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subdomains.map((sub) => (
                <TableRow key={sub.domain}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <ShieldCheck className={`h-4 w-4 ${sub.sslStatus === 'active' ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                    {sub.domain}
                  </TableCell>
                  <TableCell>{renderStatus(sub.sslStatus)}</TableCell>
                  <TableCell>
                    <Switch 
                      checked={sub.sslEnabled}
                      onCheckedChange={() => toggleAutoSsl(sub.domain, sub.sslEnabled)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => issueSsl(sub.domain)}
                      disabled={sub.sslStatus === 'pending'}
                    >
                      {sub.sslStatus === 'active' ? 'Re-Issue' : 'Issue SSL'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {subdomains.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    ไม่มีซับโดเมนในระบบ
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="text-xs text-muted-foreground flex items-center gap-2 bg-muted/50 p-4 rounded-md border">
        <AlertCircle className="w-4 h-4 text-primary" />
        Certificates are issued via Let's Encrypt and automatically renewed via system cron. Ensure your domain points to this server's IP before issuing.
      </div>
    </div>
  );
}
