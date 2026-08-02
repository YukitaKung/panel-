"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ApiDocsPage() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const CodeBlock = ({ code, language = "json" }: { code: string, language?: string }) => (
    <div className="relative group mt-2">
      <pre className="bg-[#1a1b26] p-4 rounded-md overflow-x-auto text-sm font-mono text-[#a9b1d6] border border-border/50">
        <code>{code}</code>
      </pre>
      <Button 
        size="icon" 
        variant="ghost" 
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
        onClick={() => copyToClipboard(code)}
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Documentation</h1>
        <p className="text-muted-foreground mt-1">
          Automate HostPanel operations using HTTP requests. All API requests must be authenticated.
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>How to authenticate your requests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            All API endpoints require a Bearer token in the <code className="bg-muted px-1 py-0.5 rounded text-primary">Authorization</code> header.
            You can generate a token from the <a href="/api-keys" className="text-primary hover:underline font-medium">API Keys</a> page.
          </p>
          <CodeBlock 
            language="bash"
            code={`curl -X GET http://YOUR_SERVER_IP:5555/api/subdomains \\
  -H "Authorization: Bearer sk_live_your_api_key_here"`} 
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="subdomains" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subdomains">Subdomains</TabsTrigger>
          <TabsTrigger value="databases">Databases</TabsTrigger>
          <TabsTrigger value="content">Database Content</TabsTrigger>
        </TabsList>

        {/* SUBDOMAINS API */}
        <TabsContent value="subdomains" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">GET</Badge>
                <CardTitle className="text-lg">/api/subdomains</CardTitle>
              </div>
              <CardDescription>List all active subdomains.</CardDescription>
            </CardHeader>
            <CardContent>
              <h4 className="font-medium text-sm mb-2">Response Example:</h4>
              <CodeBlock code={`[
  {
    "id": "uuid-here",
    "domain": "myapp",
    "target": "localhost:3000",
    "status": "active"
  }
]`} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-500 hover:bg-green-600">POST</Badge>
                <CardTitle className="text-lg">/api/subdomains</CardTitle>
              </div>
              <CardDescription>Create a new subdomain.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Request Body (JSON):</h4>
                <CodeBlock code={`{
  "subdomain": "api-v1",
  "port": 8080
}`} />
              </div>
              <div>
                <h4 className="font-medium text-sm mb-2">cURL Example:</h4>
                <CodeBlock language="bash" code={`curl -X POST http://YOUR_SERVER_IP:5555/api/subdomains \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"subdomain": "api-v1", "port": 8080}'`} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DATABASES API */}
        <TabsContent value="databases" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">GET</Badge>
                <CardTitle className="text-lg">/api/databases/mysql</CardTitle>
              </div>
              <CardDescription>List all MySQL databases (Change to /postgres for PostgreSQL).</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock code={`[
  {
    "name": "my_shop_db",
    "type": "mysql",
    "sizeMb": 15.4
  }
]`} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-500 hover:bg-green-600">POST</Badge>
                <CardTitle className="text-lg">/api/databases/mysql</CardTitle>
              </div>
              <CardDescription>Create a new MySQL database.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Request Body (JSON):</h4>
                <CodeBlock code={`{
  "name": "new_app_db"
}`} />
              </div>
              <div>
                <h4 className="font-medium text-sm mb-2">cURL Example:</h4>
                <CodeBlock language="bash" code={`curl -X POST http://YOUR_SERVER_IP:5555/api/databases/mysql \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"name": "new_app_db"}'`} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONTENT API */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">POST</Badge>
                <CardTitle className="text-lg">/api/databases/studio/query</CardTitle>
              </div>
              <CardDescription>Execute raw SQL queries against a database to insert, update, or fetch data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Request Body (JSON):</h4>
                <CodeBlock code={`{
  "engine": "mysql",
  "database": "my_shop_db",
  "query": "INSERT INTO users (name, email) VALUES ('John', 'john@example.com')"
}`} />
              </div>
              <div>
                <h4 className="font-medium text-sm mb-2">cURL Example (Insert Data):</h4>
                <CodeBlock language="bash" code={`curl -X POST http://YOUR_SERVER_IP:5555/api/databases/studio/query \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "engine": "mysql",
    "database": "my_shop_db",
    "query": "INSERT INTO users (name, email) VALUES (\\'Alice\\', \\'alice@example.com\\')"
  }'`} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
