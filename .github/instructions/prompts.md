**Contexte**: Je suis développeur PHP/Symfony et je travaille sur un projet Symfony où je suis en train de développer la partie gestion des utilisateurs dans l'espace d'administration. Je dois créer des sections d'onglet pour la page de modification d'un utilisateur.
**Rôle** : En tant de développeur PHP/Symfony, je veux créer une US(User Story) pour que j'ajoute l'issue sur Github
**Fonctionnalité**: Création d'une template pour la page d'édition d'un utilisateur dans l'interface d'administration de mon application
**Voici les informtions que je peux te fournir** :
- onglet 1 : informations générales de l'utilisateur (nom, prénom, email) avec possibilité de modifier ces informations
- onglet 2 : rôles (possibilité de modifier les rôles de l'utilisateur), un bouton pour envoyer un email à l'utilisateur un token de réinitialisation de mot de passe, un bouton pour modifier son jeton d'API
- onglet 3 : section textuelle pour dire que l'utilisateur est actif ou non, avec un bouton pour activer/désactiver l'utilisateur et un bouton pour supprimer l'utilisateur avec une confirmation et un message d'avertissement pour les risques de suppression

J'ai déjà du contenu textuel pour les sections suivantes
- Onglet 1 : Informations Générales
  - Contenu à intégrer
  ```html
    <p class="mb-4">
        Modifiez les informations de base de cet utilisateur telles que le <strong>nom</strong>, le <strong>prénom</strong> et l'adresse <strong>e-mail</strong>. Ces données sont <em>essentielles</em> pour l'identification et la communication.
    </p>
  ``` 
- Onglet 2 : Rôles
  - Contenu à intégrer
  ```html
    <p class="mb-4">
        Gérez les <strong>rôles attribués</strong> à l'utilisateur pour contrôler ses privilèges au sein de l'application. Vous pouvez également envoyer un lien de <em>réinitialisation de mot de passe</em> par e-mail ou modifier son <em>jeton d'API</em> pour les intégrations externes.
    </p>
  ``` 
- Onglet 3 : État de l'Utilisateur
  - Contenu à intégrer
  ```html
    <p class="mb-4">
        Cette section vous permet de gérer le statut d'activation de l'utilisateur. Un utilisateur <strong>actif</strong> peut se connecter et utiliser l'application, tandis qu'un utilisateur <strong>inactif</strong> ne le peut pas. Vous avez également la possibilité de <em>supprimer définitivement</em> le compte de l'utilisateur.
    </p>
  ``` 
  ```html
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

**Ce que tu dois faire** :
- Créer une issue Github en markdown
- Dans l'issue je veux avoir la description, les critères d'acceptation, les tâches et je veux que tu reprennes le code à intégrer que je t'ai fourni