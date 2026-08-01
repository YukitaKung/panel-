import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Settings, Trash2, HardDrive, Download, Upload, RotateCcw, Database, AppWindow, Server } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const backups = [
  {
    id: 1,
    name: "Full Server Backup",
    type: "Server",
    size: "4.2 GB",
    date: "Today, 03:00 AM",
    status: "Completed",
  },
  {
    id: 2,
    name: "db_api_prod_backup",
    type: "Database",
    size: "245 MB",
    date: "Yesterday, 03:00 AM",
    status: "Completed",
  },
  {
    id: 3,
    name: "api.company.com_app",
    type: "Application",
    size: "1.1 GB",
    date: "Aug 15, 03:00 AM",
    status: "Completed",
  }
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case "Server":
      return <Server className="h-4 w-4 text-muted-foreground" />;
    case "Database":
      return <Database className="h-4 w-4 text-muted-foreground" />;
    case "Application":
      return <AppWindow className="h-4 w-4 text-muted-foreground" />;
    default:
      return <HardDrive className="h-4 w-4 text-muted-foreground" />;
  }
};

export default function BackupsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Backups</h1>
          <p className="text-muted-foreground mt-1">Manage system, application, and database backups.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Upload Backup
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Backup
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Backup Archives</CardTitle>
          <CardDescription>
            List of all available backups on this server.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Archive Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.map((backup) => (
                <TableRow key={backup.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      {backup.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {getTypeIcon(backup.type)}
                      {backup.type}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {backup.size}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {backup.date}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
                        <span className="sr-only">Open menu</span>
                        <Settings className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Restore
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
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
