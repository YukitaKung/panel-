#!/bin/bash
sudo mysql -e "CREATE USER IF NOT EXISTS 'hostpanel_admin'@'localhost' IDENTIFIED BY 'afc392556efee74182f22e84ad920a11';"
sudo mysql -e "GRANT ALL PRIVILEGES ON *.* TO 'hostpanel_admin'@'localhost' WITH GRANT OPTION;"
sudo mysql -e "FLUSH PRIVILEGES;"
sudo -u postgres psql -c "CREATE ROLE hostpanel_admin WITH LOGIN SUPERUSER PASSWORD 'afc392556efee74182f22e84ad920a11';"
echo "DB_PANEL_PASSWORD=afc392556efee74182f22e84ad920a11" >> /home/okkcom269gmailcom/panel-/.env
