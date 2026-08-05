#!/bin/bash

# Ensure domains folder exists
sudo mkdir -p /var/www/domains
sudo chown okkcom269gmailcom:www-data /var/www/domains
sudo chmod 775 /var/www/domains

# Directories to ignore
IGNORE=("apps" "backups" "html" "domains")

cd /var/www

for d in */; do
  dir_name=${d%/}
  
  # Skip ignored directories
  skip=0
  for ign in "${IGNORE[@]}"; do
    if [ "$dir_name" == "$ign" ]; then
      skip=1
      break
    fi
  done
  
  if [ $skip -eq 1 ]; then
    continue
  fi
  
  echo "Processing domain: $dir_name"
  
  # Move domain directory to domains folder
  sudo mv "/var/www/$dir_name" "/var/www/domains/"
  
  # If there is a public_html inside, move its contents up and remove it
  if [ -d "/var/www/domains/$dir_name/public_html" ]; then
    echo "Found public_html in $dir_name. Moving contents up..."
    # Move all files (including hidden) except . and ..
    sudo sh -c "shopt -s dotglob && mv /var/www/domains/$dir_name/public_html/* /var/www/domains/$dir_name/ 2>/dev/null || true"
    sudo rmdir "/var/www/domains/$dir_name/public_html" 2>/dev/null || true
  fi
  
  # Update Nginx config if it exists
  if [ -f "/etc/nginx/sites-available/$dir_name" ]; then
    echo "Updating Nginx config for $dir_name"
    # Replace root /var/www/domain/public_html; with root /var/www/domains/domain;
    # Replace root /var/www/domain; with root /var/www/domains/domain;
    sudo sed -i "s|root /var/www/$dir_name/public_html;|root /var/www/domains/$dir_name;|g" "/etc/nginx/sites-available/$dir_name"
    sudo sed -i "s|root /var/www/$dir_name;|root /var/www/domains/$dir_name;|g" "/etc/nginx/sites-available/$dir_name"
  fi
done

# Restart Nginx
echo "Testing Nginx..."
sudo nginx -t && sudo systemctl reload nginx
echo "Migration complete!"
