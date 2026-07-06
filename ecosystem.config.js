module.exports = {
  apps: [
    {
      name: 'abd-event-bus',
      script: 'node',
      args: '-e "require(\'./scripts/event-bus-entry\').start()"',
      exec_mode: 'cluster',
      instances: 2,
      kill_timeout: 5000,
      listen_timeout: 3000,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'abd-worker',
      script: 'node',
      args: '-e "require(\'./scripts/worker-entry\').start()"',
      exec_mode: 'fork',
      kill_timeout: 5000,
      listen_timeout: 3000,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
