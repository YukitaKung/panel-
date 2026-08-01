import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

// Path where Nginx configs are stored on Ubuntu
const NGINX_SITES_AVAILABLE = "/etc/nginx/sites-available";
const NGINX_SITES_ENABLED = "/etc/nginx/sites-enabled";

export async function createNginxProxy(domain: string, port: number) {
  const config = `server {
    listen 80;
    listen [::]:80;
    server_name ${domain};

    location / {
        proxy_pass http://localhost:${port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`;

  const availablePath = path.join(NGINX_SITES_AVAILABLE, domain);
  const enabledPath = path.join(NGINX_SITES_ENABLED, domain);

  try {
    // We use sudo bash to write to /etc/nginx
    await execAsync(`sudo bash -c "cat > ${availablePath} << 'EOF'\n${config}\nEOF"`);
    
    // Create symlink
    await execAsync(`sudo ln -sf ${availablePath} ${enabledPath}`);
    
    // Test config and reload
    await execAsync(`sudo nginx -t`);
    await execAsync(`sudo systemctl reload nginx`);
    
    return true;
  } catch (error) {
    console.error(`Failed to create Nginx proxy for ${domain}:`, error);
    return false;
  }
}

export async function deleteNginxProxy(domain: string) {
  const availablePath = path.join(NGINX_SITES_AVAILABLE, domain);
  const enabledPath = path.join(NGINX_SITES_ENABLED, domain);

  try {
    await execAsync(`sudo rm -f ${availablePath}`);
    await execAsync(`sudo rm -f ${enabledPath}`);
    await execAsync(`sudo systemctl reload nginx`);
    return true;
  } catch (error) {
    console.error(`Failed to delete Nginx proxy for ${domain}:`, error);
    return false;
  }
}
