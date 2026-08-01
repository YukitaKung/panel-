import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Plus, Settings, Trash2, ShieldCheck, FileCode2, Play, Square } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const phpWebsites = [
  {
    id: 1,
    domain: "blog.company.com",
    documentRoot: "/var/www/blog.company.com/public",
    phpVersion: "PHP 8.2",
    ssl: "Active",
    status: "Running",
  },
  {
    id: 2,
    domain: "legacy.company.com",
    documentRoot: "/var/www/legacy.company.com",
    phpVersion: "PHP 7.4",
    ssl: "Active",
    status: "Stopped",
  }
];

export default function PhpWebsitesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PHP Websites</h1>
          <p className="text-muted-foreground mt-1">Manage traditional PHP/Nginx websites.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add PHP Website
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Websites Overview</CardTitle>
          <CardDescription>
            Simple configuration for PHP websites. Each website has its own document root and PHP version.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Domain</TableHead>
                <TableHead>Document Root</TableHead>
                <TableHead>PHP Version</TableHead>
                <TableHead>SSL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {phpWebsites.map((website) => (
                <TableRow key={website.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      {website.domain}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {website.documentRoot}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileCode2 className="h-4 w-4" />
                      {website.phpVersion}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-emerald-500 text-sm">
                      <ShieldCheck className="h-4 w-4 mr-1.5" />
                      {website.ssl}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={website.status === "Running" ? "default" : "secondary"} className={website.status === "Running" ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                      {website.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
                        <span className="sr-only">Open menu</span>
                        <Settings className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {website.status === "Running" ? (
                          <DropdownMenuItem>
                            <Square className="mr-2 h-4 w-4 text-rose-500" />
                            Stop Website
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem>
                            <Play className="mr-2 h-4 w-4 text-emerald-500" />
                            Start Website
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Settings className="mr-2 h-4 w-4" />
                          Edit Configuration
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Manage SSL
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-rose-500 focus:bg-rose-500/10 focus:text-rose-500">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
