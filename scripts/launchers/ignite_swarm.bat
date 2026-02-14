@echo off
echo 🧬 Swarm Spore Igniting...
powershell -Command "Expand-Archive -Path swarm_seed.zip -DestinationPath . -Force"
cd swarm
npm install
npm run dev
