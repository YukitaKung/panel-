import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const dataFile = path.join(process.cwd(), "data", "cron.json");

// Ensure data file exists
async function ensureFile() {
  try {
    await fs.access(dataFile);
  } catch {
    await fs.mkdir(path.dirname(dataFile), { recursive: true }).catch(() => {});
    await fs.writeFile(dataFile, JSON.stringify({ jobs: [] }));
  }
}

async function getCronData() {
  await ensureFile();
  try {
    const data = await fs.readFile(dataFile, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return { jobs: [] };
  }
}

async function saveCronData(data: any) {
  await ensureFile();
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2));
}

async function syncCrontab(jobs: any[]) {
  // Generate crontab string from jobs
  let cronString = "# This file is managed by HostPanel\n";
  jobs.forEach(job => {
    cronString += `${job.minute} ${job.hour} ${job.day} ${job.month} ${job.weekday} ${job.command} # ID:${job.id}\n`;
  });
  
  // Write to a temporary file and load into crontab
  const tmpPath = path.join("/tmp", `panel_crontab_${Date.now()}_${Math.floor(Math.random() * 10000)}`);
  await fs.writeFile(tmpPath, cronString);
  try {
    await execAsync(`crontab ${tmpPath}`);
  } finally {
    await fs.unlink(tmpPath).catch(() => {});
  }
}

export async function GET() {
  try {
    const data = await getCronData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch cron jobs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    if (payload.action === "run") {
      const { command } = payload;
      if (!command) return NextResponse.json({ error: "Command required" }, { status: 400 });
      // Execute command in background
      execAsync(command).catch(e => console.error("Cron manual run failed:", e));
      return NextResponse.json({ success: true, message: "Started" });
    }
    
    const data = await getCronData();
    
    if (payload.id) {
      // Edit existing job
      const index = data.jobs.findIndex((j: any) => j.id === payload.id);
      if (index === -1) return NextResponse.json({ error: "Job not found" }, { status: 404 });
      data.jobs[index] = { ...data.jobs[index], ...payload };
    } else {
      // Create new job
      const newJob = {
        id: Date.now().toString(),
        minute: payload.minute || "*",
        hour: payload.hour || "*",
        day: payload.day || "*",
        month: payload.month || "*",
        weekday: payload.weekday || "*",
        command: payload.command,
        description: payload.description || "",
      };
      if (!newJob.command) return NextResponse.json({ error: "Command required" }, { status: 400 });
      data.jobs.push(newJob);
    }

    await saveCronData(data);
    
    // Sync with system crontab
    try {
      await syncCrontab(data.jobs);
    } catch (e: any) {
      console.error("Failed to sync crontab:", e);
      return NextResponse.json({ error: "Saved but failed to apply to system: " + e.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, jobs: data.jobs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    
    const data = await getCronData();
    data.jobs = data.jobs.filter((j: any) => j.id !== id);
    
    await saveCronData(data);
    
    // Sync with system crontab
    try {
      await syncCrontab(data.jobs);
    } catch (e: any) {
      console.error("Failed to sync crontab:", e);
      return NextResponse.json({ error: "Deleted but failed to apply to system: " + e.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, jobs: data.jobs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
