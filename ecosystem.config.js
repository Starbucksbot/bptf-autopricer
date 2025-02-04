module.exports = {
  apps: [{
    name: 'autopricer',
    script: './autopricer.js',
    watch: false,
    env: {
      NODE_ENV: 'production',
    },
    error_file: 'logs/error.log',
    out_file: 'logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    max_memory_restart: '1G'
  }]
};