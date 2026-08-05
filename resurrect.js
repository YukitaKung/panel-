const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const { execSync } = require('child_process');

const adapter = new PrismaLibSql({
  url: "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const apps = await prisma.application.findMany();
  for (const app of apps) {
    if (!app.path) continue;
    console.log('Starting ' + app.name + ' on port ' + app.port);
    try {
      // Delete old pm2 instance if exists
      try { execSync('pm2 delete app-' + app.id); } catch(e) {}
      
      console.log('Starting via PM2...');
      let startCmd = app.startScript || "start";
      if (!startCmd.startsWith("npm")) {
        startCmd = "npm run " + startCmd;
      }
      execSync(`PORT=${app.port} pm2 start "${startCmd}" --name "app-${app.id}"`, { cwd: app.path, stdio: 'inherit' });
    } catch(e) {
      console.error("Failed to start " + app.name + ":", e.message);
    }
  }
  try {
    execSync('pm2 save');
  } catch(e) {}
}

main();
