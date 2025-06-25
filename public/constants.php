<?php

define('ROOT_DIR', dirname(__DIR__) . '/');

## LOGGER CONFIGURATION
define('LOG_DIR', dirname(__DIR__) . '/logs/');
define('LOG_RETENTION_DAYS', 30); // Number of days to keep logs
define('LOG_TIMESTAMP_FORMAT', 'd-m-Y H:i:s'); // Log format
define('LOG_FILE_TIME_FORMAT', 'd-m-Y'); // Log format
define('LOG_ALERT_ON_CRITICAL', true); // Send alert on error (true/false)

## JSON DATA FILES
define('JSON_DATA_DIR', dirname(__DIR__) . '/data/');

define('APP_NAME', 'Mon site portfolio développeur web');
define('APP_SEO_TITLE', 'AGATHE Frédérick, portfolio développeur web');
define('APP_SEO_IMAGE', ''); // Image for SEO tags
define('APP_SEO_LANGUAGE', 'fr'); // Language for SEO tags
define('APP_SEO_LOCALE', 'fr_FR'); // Locale for SEO tags
define('APP_SEO_AUTHOR_DEFAULT', 'AGATHE Frédérick'); // Default author for SEO tags

define('APP_EMAIL_CONTACT', ['contact@fagathe-dev.me' => 'Contact fagathe-dev.me']);
