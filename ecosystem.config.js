module.exports = {
  apps: [
    {
      name: "vibe-drama",
      script: "server.js",
      env_file: ".env.local", // Auto load .env.local
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      error_file: "./logs/error.log",
      out_file: "./logs/output.log",
      merge_logs: true,
    },
  ],
};
