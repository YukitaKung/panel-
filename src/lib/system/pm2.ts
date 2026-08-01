import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function getPm2List() {
  try {
    const { stdout } = await execAsync("pm2 jlist");
    return JSON.parse(stdout);
  } catch (error) {
    console.error("Failed to get PM2 list:", error);
    return [];
  }
}

export async function startApp(appName: string, startCommand: string = "npm -- start") {
  try {
    // Note: The actual path needs to be where the app is cloned
    const cmd = `pm2 start ${startCommand} --name "${appName}"`;
    await execAsync(cmd);
    await execAsync("pm2 save");
    return true;
  } catch (error) {
    console.error(`Failed to start app ${appName}:`, error);
    return false;
  }
}

export async function stopApp(appName: string) {
  try {
    await execAsync(`pm2 stop "${appName}"`);
    await execAsync("pm2 save");
    return true;
  } catch (error) {
    console.error(`Failed to stop app ${appName}:`, error);
    return false;
  }
}

export async function deleteApp(appName: string) {
  try {
    await execAsync(`pm2 delete "${appName}"`);
    await execAsync("pm2 save");
    return true;
  } catch (error) {
    console.error(`Failed to delete app ${appName}:`, error);
    return false;
  }
}

export async function restartApp(appName: string) {
  try {
    await execAsync(`pm2 restart "${appName}"`);
    return true;
  } catch (error) {
    console.error(`Failed to restart app ${appName}:`, error);
    return false;
  }
}
