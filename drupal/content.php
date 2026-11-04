<?php

/**
 * @file
 * Creates the content of the vuepal test site.
 *
 * Runs once after the recipe, see `ddev setup`. The E2E tests rely on the
 * paths, titles and redirects created here.
 */

use Drupal\Core\File\FileExists;
use Drupal\menu_link_content\Entity\MenuLinkContent;
use Drupal\node\Entity\Node;
use Drupal\node\NodeInterface;
use Drupal\redirect\Entity\Redirect;

/**
 * Creates a German node with an English translation.
 */
function vuepal_create_node(string $bundle, array $de, array $en): NodeInterface {
  $node = Node::create([
    'type' => $bundle,
    'langcode' => 'de',
    'status' => 1,
    'uid' => 1,
    'title' => $de['title'],
    'path' => ['alias' => $de['alias']],
  ] + ($de['fields'] ?? []));
  $node->save();

  $node->addTranslation('en', [
    'title' => $en['title'],
    'path' => ['alias' => $en['alias']],
  ] + ($en['fields'] ?? []))->save();

  return $node;
}

/**
 * Returns a metatag field value that overrides the given tags.
 */
function vuepal_metatags(array $tags): array {
  return ['field_metatags' => ['value' => json_encode($tags)]];
}

$about = vuepal_create_node('page',
  [
    'title' => 'Über uns',
    'alias' => '/ueber-uns',
    'fields' => vuepal_metatags(['description' => 'Wer hinter vuepal steht.']),
  ],
  [
    'title' => 'About us',
    'alias' => '/about-us',
    'fields' => vuepal_metatags(['description' => 'Who is behind vuepal.']),
  ],
);

// A child page, so that the breadcrumb has more than one level.
vuepal_create_node('page',
  ['title' => 'Team', 'alias' => '/ueber-uns/team'],
  ['title' => 'Team', 'alias' => '/about-us/team'],
);

vuepal_create_node('article',
  [
    'title' => 'Erster Artikel',
    'alias' => '/artikel/erster-artikel',
    'fields' => ['field_lead' => 'Der Lead des ersten Artikels.'],
  ],
  [
    'title' => 'First article',
    'alias' => '/articles/first-article',
    'fields' => ['field_lead' => 'The lead of the first article.'],
  ],
);

// A node of a bundle that the GraphQL server does not expose, so its type is
// NodeUnexposed. No fragment of the playground's route queries covers it.
Node::create([
  'type' => 'event',
  'langcode' => 'de',
  'status' => 1,
  'uid' => 1,
  'title' => 'Sommerfest',
  'path' => ['alias' => '/veranstaltungen/sommerfest'],
])->save();

// The nodes behind the keys of frontend_routing. Their aliases come from
// frontend_routing.settings, which the playground generates.
$keys = \Drupal::config('frontend_routing.settings')->get('keys');
$contact = vuepal_create_node('page',
  ['title' => 'Kontakt', 'alias' => $keys['contact-page']['aliases']['de']],
  ['title' => 'Contact', 'alias' => $keys['contact-page']['aliases']['en']],
);
$news = vuepal_create_node('page',
  ['title' => 'Neuigkeiten', 'alias' => $keys['news-page']['aliases']['de']],
  ['title' => 'News', 'alias' => $keys['news-page']['aliases']['en']],
);
\Drupal::state()->set('frontend_routing.settings', [
  'contact-page' => $contact->id(),
  'news-page' => $news->id(),
]);

// The minimal profile uses /user/login as the front page, and the route
// normalizer of the redirect module would then redirect the login form to /de.
$home = vuepal_create_node('page',
  ['title' => 'Startseite', 'alias' => '/startseite'],
  ['title' => 'Home', 'alias' => '/home'],
);
\Drupal::configFactory()->getEditable('system.site')
  ->set('page.front', '/node/' . $home->id())
  ->save();

// Anonymous users get access denied.
Node::create([
  'type' => 'page',
  'langcode' => 'de',
  'status' => 0,
  'uid' => 1,
  'title' => 'Entwurf',
  'path' => ['alias' => '/entwurf'],
])->save();

// A file the browser downloads instead of displaying it.
\Drupal::service('file_system')->saveData(
  "PK\x05\x06" . str_repeat("\0", 18),
  'public://vuepal-download.zip',
  FileExists::Replace,
);

$redirects = [
  // Redirect to a node: /de/alte-seite -> /de/ueber-uns.
  ['de', 'alte-seite', 'entity:node/' . $about->id(), 301],
  ['en', 'old-page', 'entity:node/' . $about->id(), 301],
  // Redirect with its own query string, the current one must not be added.
  ['de', 'alte-seite-mit-query', 'internal:/ueber-uns?von=redirect', 302],
  // Redirect to a file download, the browser stays on the page.
  ['de', 'download', 'base:sites/default/files/vuepal-download.zip', 301],
];
foreach ($redirects as [$langcode, $source, $target, $status]) {
  Redirect::create([
    'redirect_source' => $source,
    'redirect_redirect' => $target,
    'language' => $langcode,
    'status_code' => $status,
  ])->save();
}

// An admin menu link with markup in its label. Users with the "administer
// menu" permission can add one, and the command palette of the admin toolbar
// must render it as text.
MenuLinkContent::create([
  'title' => 'Vuepal <img src=x onerror="window.vuepalXss=true">',
  'link' => ['uri' => 'internal:/node/1'],
  'menu_name' => 'admin',
  'parent' => 'system.admin_structure',
])->save();

echo "Created the vuepal test content.\n";
