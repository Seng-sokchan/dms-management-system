module.exports = {
  apps: [{
    name: "dms-backend",
    script: "src/server.js",
    instances: 1,
    exec_mode: "fork",
    time: true,
    autorestart: true,
    max_memory_restart: "512M",
    kill_timeout: 10000,
  }],
};
