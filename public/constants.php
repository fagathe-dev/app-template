<?php

## LOGGER CONFIGURATION
define('LOG_DIR', dirname(__DIR__) . '/logs/');
define('LOG_RETENTION_DAYS', 30); // Number of days to keep logs
define('LOG_TIMESTAMP_FORMAT', 'd-m-Y H:i:s'); // Log format
define('LOG_FILE_TIME_FORMAT', 'd-m-Y'); // Log format
define('LOG_ALERT_ON_CRITICAL', true); // Send alert on error (true/false)

## JSON DATA FILES
define('JSON_DATA_DIR', dirname(__DIR__) . '/data/');