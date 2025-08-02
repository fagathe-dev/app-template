**Rôle**: En tant que lead développeur, je veux mettre en place un workflow pour commit mes développements sur mon repo GitHub. Je veux que tu me crée un prompt pour ajouter le package .husky avec toute la config nécessaire et un deuxième prompt pour créer un workflow de commit.

### Premier prompt

**Ce que je veux**:

- Améliorer la qualité du code avant de pousser sur mon repo GitHub.
  - formatter le code avec Prettier suivant les règles décrites dans le fichier `.prettierrc`
  - lancer la commande de `lint` pour respecter qu'il n'y a pas d'erreur ou de warning.
  - pas de test pour l'instant donc pas besoin de cette partie

**Les tâches à définir dans le prompt**:

- Installer le package husky
- Destination du prompt: `.github/prompts/archi/husky.prompt.md`

### Deuxième prompt

**Ce que je veux**:
Je veux que tu me génère un fichier de prompt pour un workflow de commit github.
Je veux utiliser un porcessus de commit sur GitHub pour m'assurer que le code produit est de bonnes qualité et respecte les bonnes pratiques de développement.

Pour mon workflow je veux regarder le nom de la branche pour générer le message de commit, un git status pour ajouter les fichiers dans le commit **(TRÈS IMPORTANT) en se basant sur le fichier .gitignore**. Définir le type de commit en te basant de la [documentation sur les conventionnal commit](https://www.conventionalcommits.org/en/v1.0.0/).
En général dans le nom de branche il y a le numero de l'issue github: voici le pattern que j'utilise en général : (us|archi|fix|docs)-numero_issue-xxxxxxxxxxxx
Ici us(User Story) correspond à une nouvelle `feat` et chore correspond à `chore`
En résumé, je veux que le message de commit ressemble à ça :
'`type`(`#numero de l'issue`): `un message pour décrire les changements`'

- Destination du prompt: `.github/prompts/commit-lint-workflow.prompt.md`

**_ IMPORTANT! Mettre à jour la documentation _**

**_ IMPORTANT! Il n'y a pas de modifications à faire sur le projet ou de commande à executer à ce stade, je veux juste que tu crée un fichier de prompt _**
