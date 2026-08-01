"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Folder, File, FileText, FileImage, FileCode2, FileArchive,
  Upload, Download, Plus, Trash2, Edit2, Copy, Scissors, ArrowLeft, MoreVertical
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

const files = [
  { id: 1, name: "api.company.com", type: "folder", size: "--", modified: "Oct 24, 2024" },
  { id: 2, name: "dashboard.company.com", type: "folder", size: "--", modified: "Oct 20, 2024" },
  { id: 3, name: "logs", type: "folder", size: "--", modified: "Oct 25, 2024" },
  { id: 4, name: "nginx.conf", type: "code", size: "4.2 KB", modified: "Sep 10, 2024" },
  { id: 5, name: "server_backup.zip", type: "archive", size: "4.2 GB", modified: "Oct 25, 2024" },
  { id: 6, name: "logo.png", type: "image", size: "128 KB", modified: "Aug 15, 2024" },
  { id: 7, name: "readme.txt", type: "text", size: "1.1 KB", modified: "Jan 1, 2024" },
];

const getFileIcon = (type: string) => {
  switch (type) {
    case "folder": return <Folder className="h-5 w-5 text-blue-400 fill-blue-400/20" />;
    case "code": return <FileCode2 className="h-5 w-5 text-orange-400" />;
    case "archive": return <FileArchive className="h-5 w-5 text-red-400" />;
    case "image": return <FileImage className="h-5 w-5 text-emerald-400" />;
    case "text": return <FileText className="h-5 w-5 text-muted-foreground" />;
    default: return <File className="h-5 w-5 text-muted-foreground" />;
  }
};

export default function FileManagerPage() {
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">File Manager</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="py-3 px-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 px-2 text-muted-foreground">
                <span className="hover:text-foreground cursor-pointer">/</span>
                <span>var</span>
                <span className="hover:text-foreground cursor-pointer">/</span>
                <span>www</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Scissors className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-500 hover:bg-rose-500/10">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12 pl-4">
                    <Checkbox />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-24">Size</TableHead>
                  <TableHead className="w-40">Modified</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id} className="group cursor-pointer">
                    <TableCell className="pl-4">
                      <Checkbox />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.type)}
                        <span className="font-medium group-hover:text-primary transition-colors">
                          {file.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {file.size}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {file.modified}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity" />}>
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {file.type !== "folder" && (
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" /> Download
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <Edit2 className="mr-2 h-4 w-4" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" /> Copy
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Scissors className="mr-2 h-4 w-4" /> Move
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {file.type === "archive" && (
                            <DropdownMenuItem>
                              <FileArchive className="mr-2 h-4 w-4" /> Extract
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-rose-500 focus:bg-rose-500/10 focus:text-rose-500">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
