# V4 Deployment Plan

## Build

```bash
cd /var/www/ShanghaiTravels-src/figma-design
npm install   # if needed
npm run build
```

## Deploy marketing root

```bash
# Backup current
cp -a /var/www/ShanghaiTravels /var/www/ShanghaiTravels.bak-v4-$(date +%Y%m%d)

# Sync built assets (preserve uploads if any)
rsync -a --delete \
  --exclude 'erp' \
  /var/www/ShanghaiTravels-src/figma-design/dist/ \
  /var/www/ShanghaiTravels/

# Restore injects selectively: auth-entry only (Login/Register chooser)
# Remove hero-services / packages-home / destinations-home from index.html
# (homepage now renders these in React)
```

## Verify

1. `https://shanghaitravels.com.bd/` — full homepage  
2. Packages carousel loads from API  
3. Destinations show live packageCount  
4. `/erp/` still serves TravelOS  
5. Login/Register choosers work  
6. Mobile Lighthouse / visual QA  

## Rollback

Restore `/var/www/ShanghaiTravels.bak-v4-*`.

## Git

Branch `feature/v4-premium-homepage` — Website/CMS UI only.  
