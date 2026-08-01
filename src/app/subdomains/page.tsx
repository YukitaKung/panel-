import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Plus, Settings, Trash2, ShieldCheck, ShieldAlert, Power } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

const subdomains = [
  {
    id: 1,
    domain: "api.company.com",
    application: "api.company.com (Node.js 20.x)",
    ssl: "Active",
    status: "Active",
    maintenance: false,
  },
  {
    id: 2,
    domain: "dashboard.company.com",
    application: "dashboard.company.com (Node.js 18.x)",
    ssl: "Expired",
    status: "Active",
    maintenance: true,
  }
];

export default function SubdomainsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subdomains</h1>
          <p className="text-muted-foreground mt-1">Route domains to your Node.js applications.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Subdomain
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subdomain Routing</CardTitle>
          <CardDescription>
            Subdomains point directly to Applications. Changing an application's root path automatically affects all linked subdomains.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Domain</TableHead>
                <TableHead>Linked Application</TableHead>
                <TableHead>SSL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Maintenance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subdomains.map((subdomain) => (
                <TableRow key={subdomain.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      {subdomain.domain}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {subdomain.application}
                  </TableCell>
                  <TableCell>
                    {subdomain.ssl === "Active" ? (
                      <div className="flex items-center text-emerald-500">
                        <ShieldCheck className="h-4 w-4 mr-1.5" />
                        Active
                      </div>
                    ) : (
                      <div className="flex items-center text-rose-500">
                        <ShieldAlert className="h-4 w-4 mr-1.5" />
                        Expired
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={subdomain.status === "Active" ? "default" : "secondary"} className={subdomain.status === "Active" ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                      {subdomain.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Checkbox id={`maintenance-${subdomain.id}`} checked={subdomain.maintenance} />
                      <label
                        htmlFor={`maintenance-${subdomain.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {subdomain.maintenance ? "Enabled" : "Disabled"}
                      </label>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
                        <span className="sr-only">Open menu</span>
                        <Settings className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Settings className="mr-2 h-4 w-4" />
                          Edit Subdomain
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
