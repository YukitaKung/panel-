"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Server, ShieldAlert } from "lucide-react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex flex-col items-center mb-8">
        <div className="bg-primary/10 p-4 rounded-full mb-4">
          <Server className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">HostPanel</h1>
        <p className="text-muted-foreground mt-2">Premium Hosting Control Panel</p>
      </div>

      <Card className="border-border shadow-xl">
        <CardHeader className="text-center pb-4">
          <CardTitle>Private Access Only</CardTitle>
          <CardDescription>
            This system is strictly protected. Only the authorized administrator can log in.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && (
            <div className="bg-destructive/15 text-destructive p-3 rounded-md flex items-center text-sm font-medium">
              <ShieldAlert className="h-4 w-4 mr-2" />
              {error === "Unauthorized" && "Access Denied: Your Discord ID is not authorized."}
              {error === "OAuthFailed" && "Failed to authenticate with Discord."}
              {error === "NoCode" && "Authentication process was cancelled."}
              {error === "InternalError" && "An internal server error occurred."}
              {!["Unauthorized", "OAuthFailed", "NoCode", "InternalError"].includes(error) && `Error: ${error}`}
            </div>
          )}
          
          <Button 
            size="lg" 
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white transition-colors"
            render={
              <a href="/api/auth/discord">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 127.14 96.36">
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.1,46,96,53,91,65.69,84.69,65.69Z"/>
                </svg>
                Login with Discord
              </a>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
