# Composants d'Email Réutilisables

Ce document décrit les composants d'email réutilisables disponibles dans le dossier `templates/emails/components/`.

## Structure des Composants

### 1. Heading (`heading.html.twig`)

Composant pour les titres et sous-titres d'email.

**Paramètres :**

- `text` (requis) : Le texte du titre
- `level` (optionnel, défaut: 'h4') : Niveau du titre (h1-h6)
- `emoji` (optionnel) : Emoji à afficher avant le texte
- `center` (optionnel, défaut: true) : Centrer le texte

**Exemple :**

```twig
{% include "emails/components/heading.html.twig" with {
    'text': 'Bienvenue !',
    'emoji': '👋',
    'level': 'h2',
    'center': true
} %}
```

### 2. Paragraph (`paragraph.html.twig`)

Composant pour les paragraphes de texte.

**Paramètres :**

- `content` (requis) : Le contenu du paragraphe (peut contenir du HTML)
- `color` (optionnel, défaut: '#878a99') : Couleur du texte
- `center` (optionnel, défaut: false) : Centrer le texte
- `margin_bottom` (optionnel, défaut: '26px') : Marge en bas
- `font_size` (optionnel, défaut: '15px') : Taille de police

**Exemple :**

```twig
{% include "emails/components/paragraph.html.twig" with {
    'content': '<p>Votre texte ici</p>',
    'center': true,
    'color': '#333333'
} %}
```

### 3. Button (`button.html.twig`)

Composant pour les boutons/liens d'action.

**Paramètres :**

- `url` (requis) : L'URL du lien
- `text` (requis) : Le texte du bouton
- `color` (optionnel, défaut: '#4b38b3') : Couleur de fond
- `text_color` (optionnel, défaut: '#FFF') : Couleur du texte
- `center` (optionnel, défaut: true) : Centrer le bouton
- `padding` (optionnel, défaut: '.5rem .9rem') : Padding du bouton

**Exemple :**

```twig
{% include "emails/components/button.html.twig" with {
    'url': 'https://example.com',
    'text': 'Cliquez ici',
    'color': '#28a745'
} %}
```

### 4. Link Fallback (`link-fallback.html.twig`)

Composant pour afficher un lien de fallback en cas de problème avec le bouton.

**Paramètres :**

- `url` (requis) : L'URL du lien
- `message` (optionnel) : Message d'explication personnalisé
- `color` (optionnel, défaut: '#878a99') : Couleur du texte
- `center` (optionnel, défaut: true) : Centrer le texte

**Exemple :**

```twig
{% include "emails/components/link-fallback.html.twig" with {
    'url': activation_link,
    'message': 'Si le bouton ne fonctionne pas :'
} %}
```

### 5. User Info (`user-info.html.twig`)

Composant pour afficher des informations utilisateur structurées.

**Paramètres :**

- `title` (requis) : Titre de la section
- `info_items` (requis) : Array d'items avec 'label' et 'value'
- `color` (optionnel, défaut: '#878a99') : Couleur du texte
- `center` (optionnel, défaut: false) : Centrer le texte

**Exemple :**

```twig
{% include "emails/components/user-info.html.twig" with {
    'title': 'Vos informations :',
    'info_items': [
        {'label': 'Email', 'value': user.email},
        {'label': 'Rôle', 'value': user.role}
    ]
} %}
```

### 6. Alert (`alert.html.twig`)

Composant pour les alertes et notifications colorées.

**Paramètres :**

- `content` (requis) : Le contenu de l'alerte
- `type` (optionnel, défaut: 'info') : Type d'alerte (success, warning, info, error)
- `center` (optionnel, défaut: true) : Centrer le texte

**Exemple :**

```twig
{% include "emails/components/alert.html.twig" with {
    'content': 'Attention : Cette action est irréversible',
    'type': 'warning'
} %}
```

### 7. Separator (`separator.html.twig`)

Composant pour les séparateurs visuels.

**Paramètres :**

- `height` (optionnel, défaut: 20) : Hauteur du séparateur en px
- `color` (optionnel, défaut: '#e9ecef') : Couleur de la ligne
- `width` (optionnel, défaut: '100%') : Largeur en pourcentage
- `margin` (optionnel, défaut: '20px 0') : Marge autour du séparateur

**Exemple :**

```twig
{% include "emails/components/separator.html.twig" with {
    'color': '#ddd',
    'margin': '30px 0'
} %}
```

## Templates Refactorisés

Les templates suivants ont été refactorisés pour utiliser ces composants :

- `auth/verify-account.html.twig`
- `auth/admin/create-account.html.twig`
- `auth/admin/change-role.html.twig`
- `admin/change-role.html.twig` (nouveau)

## Bonnes Pratiques

1. **Réutilisation** : Utilisez toujours les composants plutôt que de réécrire le HTML
2. **Cohérence** : Respectez les couleurs et styles définis par défaut
3. **Paramètres** : N'utilisez les paramètres optionnels que si nécessaire
4. **Documentation** : Documentez tout nouveau composant créé

## Structure des Dossiers

```
templates/emails/
├── base.html.twig                    # Template de base
├── components/                       # Composants réutilisables
│   ├── heading.html.twig
│   ├── paragraph.html.twig
│   ├── button.html.twig
│   ├── link-fallback.html.twig
│   ├── user-info.html.twig
│   ├── alert.html.twig
│   └── separator.html.twig
├── admin/                           # Templates pour l'admin
│   └── change-role.html.twig
└── auth/                           # Templates d'authentification
    ├── verify-account.html.twig
    └── admin/
        ├── create-account.html.twig
        └── change-role.html.twig
```
