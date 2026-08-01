import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Settings, Trash2, Database, KeyRound, Download, Upload, ExternalLink } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const databases = [
  {
    id: 1,
    name: "db_api_prod",
    username: "user_api_prod",
    size: "245 MB",
    created: "2024-01-15",
  },
  {
    id: 2,
    name: "db_blog",
    username: "user_blog",
    size: "1.2 GB",
    created: "2024-02-20",
  }
];

export default function DatabasesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Databases</h1>
          <p className="text-muted-foreground mt-1">Manage your MySQL/MariaDB databases.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            phpMyAdmin
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Database
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Database Management</CardTitle>
          <CardDescription>
            Simple database manager. Credentials are automatically generated when creating a database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Database Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {databases.map((db) => (
                <TableRow key={db.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      {db.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {db.username}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {db.size}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {db.created}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
                        <span className="sr-only">Open menu</span>
                        <Settings className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Backup
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Upload className="mr-2 h-4 w-4" />
                          Restore
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <KeyRound className="mr-2 h-4 w-4" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-rose-500 focus:bg-rose-500/10 focus:text-rose-500">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Database
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
