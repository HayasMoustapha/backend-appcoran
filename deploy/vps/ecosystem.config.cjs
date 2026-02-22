module.exports = {
  apps: [
    {
      name: "appcoran-backend",
      script: "src/server.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        HOST: "0.0.0.0",
        PORT: "4000"
      },
      max_memory_restart: "512M",
      listen_timeout: 10000,
      kill_timeout: 5000,
      merge_logs: true,
      out_file: "logs/out.log",
      error_file: "logs/error.log",
      time: true
    }
  ]
};
