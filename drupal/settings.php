<?php

/**
 * @file
 * Settings for the vuepal test site.
 *
 * Copied to web/sites/default/settings.php by the Drupal scaffold plugin
 * (see composer.json). The site only runs inside ddev.
 */

use Symfony\Component\HttpFoundation\Request;

$databases['default']['default'] = [
  'database' => 'db',
  'username' => 'db',
  'password' => 'db',
  'host' => 'db',
  'port' => 3306,
  'driver' => 'mysql',
  'prefix' => '',
  'namespace' => 'Drupal\\mysql\\Driver\\Database\\mysql',
  'autoload' => 'core/modules/mysql/src/Driver/Database/mysql/',
];

$settings['hash_salt'] = 'vuepal-test-site';
$settings['config_sync_directory'] = 'sites/default/files/sync';
$settings['skip_permissions_hardening'] = TRUE;
$settings['trusted_host_patterns'] = [
  '^vuepal\.ddev\.site$',
  '^localhost$',
  '^127\.0\.0\.1$',
];

// The Nuxt server calls Drupal on http://localhost and forwards the
// X-Forwarded-* headers of the browser request. Trusting them makes Drupal see
// https://vuepal.ddev.site, so the session cookie name matches the one the
// browser got.
$settings['reverse_proxy'] = TRUE;
$settings['reverse_proxy_addresses'] = ['127.0.0.1', '::1'];
$settings['reverse_proxy_trusted_headers'] = Request::HEADER_X_FORWARDED_FOR | Request::HEADER_X_FORWARDED_HOST | Request::HEADER_X_FORWARDED_PORT | Request::HEADER_X_FORWARDED_PROTO;

$config['system.logging']['error_level'] = 'verbose';

// Shown in the admin toolbar of the playground.
$config['environment_indicator.indicator']['name'] = 'vuepal test site';
$config['environment_indicator.indicator']['fg_color'] = '#ffffff';
$config['environment_indicator.indicator']['bg_color'] = '#0b6e4f';
