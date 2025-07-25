# [US] Créer la page d'édition utilisateur avec onglets dans l'administration

## Description

En tant qu'administrateur,
Je souhaite accéder à une page dédiée pour modifier les informations d'un utilisateur,
Afin de gérer efficacement ses détails, ses permissions et le statut de son compte via une interface organisée par onglets.

## Pré-requis

Cette fonctionnalité est accessible **UNIQUEMENT** aux utilisateurs ayant un niveau d'accès `ROLE_SUPER_ADMIN` minimum.

## Critères d'Acceptation

* La page d'édition de l'utilisateur doit être accessible depuis l'interface d'administration.
* La page doit afficher des onglets distincts pour organiser les informations.
* **Onglet "Informations Générales"** :
    * Doit afficher le nom, prénom et e-mail de l'utilisateur.
    * Ces champs doivent être modifiables.
    * Le texte descriptif fourni doit être intégré.
* **Onglet "Permissions et Accès"** :
    * Doit permettre de modifier les rôles de l'utilisateur.
    * Doit inclure un bouton pour envoyer un e-mail de réinitialisation de mot de passe.
    * Doit inclure un bouton pour modifier le jeton d'API de l'utilisateur.
    * Le texte descriptif fourni doit être intégré.
* **Onglet "Gestion du Compte"** :
    * Doit indiquer si l'utilisateur est actif ou inactif.
    * Doit inclure un bouton pour activer/désactiver l'utilisateur.
    * Doit inclure un bouton pour supprimer l'utilisateur.
    * La suppression doit demander une confirmation avec le message d'avertissement fourni dans un composant `alert-danger` de Bootstrap.
    * Le texte descriptif fourni doit être intégré.
* L'intégration de toutes les sections textuelles fournies doit être réalisée en HTML avec les classes Bootstrap 5.3 spécifiées et la mise en valeur des informations importantes.


## Tâches

- [ ] Créer la route et le contrôleur Symfony pour la page d'édition d'un utilisateur (ex: `/admin/users/{id}/edit`).
- [ ] Mettre en place la structure de base de la template Twig pour la page d'édition.
- [ ] Intégrer les onglets (composant Tabs/Pills de Bootstrap 5.3) dans la template.
- [ ] Développer la section pour l'onglet "Informations Générales" :
    - [ ] Implémenter le formulaire pour la modification du nom, prénom, e-mail.
    - [ ] Intégrer le contenu textuel fourni.
- [ ] Développer la section pour l'onglet "Permissions et Accès" :
    - [ ] Implémenter la logique de modification des rôles.
    - [ ] Ajouter les boutons pour l'envoi d'e-mail de réinitialisation et la modification du jeton d'API.
    - [ ] Intégrer le contenu textuel fourni.
- [ ] Développer la section pour l'onglet "Gestion du Compte" :
    - [ ] Implémenter la bascule actif/inactif.
    - [ ] Ajouter le bouton de suppression.
    - [ ] Implémenter la modale de confirmation pour la suppression.
    - [ ] Intégrer le contenu textuel fourni, y compris l'alerte Bootstrap.
- [ ] Assurer la persistance des données via l'ORM (Doctrine).
- [ ] Ajouter les styles CSS et le JavaScript nécessaires (si applicable) pour les interactions des onglets et la confirmation de suppression.

## Contenu HTML à Intégrer

### Onglet : Informations Générales

```html
<p class="mb-4">
    Modifiez les informations de base de cet utilisateur telles que le <strong>nom</strong>, le <strong>prénom</strong> et l'adresse <strong>e-mail</strong>. Ces données sont <em>essentielles</em> pour l'identification et la communication.
</p>
```

### Onglet : Permissions et Accès

```html
<p class="mb-4">
    Gérez les <strong>rôles attribués</strong> à l'utilisateur pour contrôler ses privilèges au sein de l'application. Vous pouvez également envoyer un lien de <em>réinitialisation de mot de passe</em> par e-mail ou modifier son <em>jeton d'API</em> pour les intégrations externes.
</p>
```

### Onglet : Gestion du Compte

```html
<p class="mb-4">
    Cette section vous permet de gérer le statut d'activation de l'utilisateur. Un utilisateur <strong>actif</strong> peut se connecter et utiliser l'application, tandis qu'un utilisateur <strong>inactif</strong> ne le peut pas. Vous avez également la possibilité de <em>supprimer définitivement</em> le compte de l'utilisateur.
</p>

<div class="alert alert-danger" role="alert">
    <h4 class="alert-heading">Attention : Suppression Définitive du Compte !</h4>
    <p>
        Vous êtes sur le point de supprimer définitivement le compte de cet utilisateur. Cette action est <strong>irréversible</strong> et entraînera la <em>perte de toutes les données</em> associées à ce compte.
    </p>
    <hr>
    <p class="mb-0">
        L'utilisateur ne pourra plus se connecter et son historique sera effacé de nos systèmes.
    </p>
    <p class="mt-2 fw-bold">
        Êtes-vous certain de vouloir continuer ?
    </p>
</div>
```