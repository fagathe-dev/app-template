<?php

## LOGGER CONFIGURATION
define('LOG_DIR', dirname(__DIR__) . '/logs/');
define('LOG_RETENTION_DAYS', 30); // Number of days to keep logs
define('LOG_FORMAT', 'Y-m-d H:i:s'); // Log format
define('LOG_LEVEL', 'debug'); // Log level (e.g., debug, info, warning, error)
define('LOG_ALERT_ON_ERROR', true); // Send alert on error (true/false)

## JSON DATA FILES
define('JSON_DATA_DIR', dirname(__DIR__) . '/data/');