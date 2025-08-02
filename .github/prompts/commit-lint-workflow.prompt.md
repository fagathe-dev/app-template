# Workflow de Commit Conventionnel

## Contexte

En tant que lead développeur, nous voulons standardiser nos messages de commit en utilisant les Conventional Commits et en automatisant la génération des messages basée sur le nom des branches.

## Structure du Message de Commit

Format : `type(#issue): description`

### Types de Commit

Basés sur les Conventional Commits et le pattern de branche :

- `feat`: Nouvelle fonctionnalité (correspond à `us-` dans le nom de branche)
- `fix`: Correction de bug (correspond à `fix-` dans le nom de branche)
- `docs`: Documentation (correspond à `docs-` dans le nom de branche)
- `chore`: Maintenance (correspond à `archi-` dans le nom de branche)

## Pattern de Nommage des Branches

Format : `(us|archi|fix|docs)-numero_issue-description`

Exemple :

- `us-123-add-user-authentication` → `feat(#123): add user authentication`
- `fix-456-fix-login-error` → `fix(#456): fix login error`
- `docs-789-update-readme` → `docs(#789): update readme`
- `archi-101-setup-docker` → `chore(#101): setup docker`

## Processus de Commit

1. **Analyse de la Branche**

   ```bash
   # Récupérer le nom de la branche courante
   BRANCH_NAME=$(git branch --show-current)

   # Extraire le type et le numéro d'issue
   TYPE=$(echo $BRANCH_NAME | cut -d'-' -f1)
   ISSUE_NUMBER=$(echo $BRANCH_NAME | cut -d'-' -f2)
   ```

2. **Mapping des Types**

   ```bash
   case $TYPE in
     "us")
       COMMIT_TYPE="feat"
       ;;
     "fix")
       COMMIT_TYPE="fix"
       ;;
     "docs")
       COMMIT_TYPE="docs"
       ;;
     "archi")
       COMMIT_TYPE="chore"
       ;;
   esac
   ```

3. **Gestion des Fichiers**
   - Respecter le `.gitignore`
   - Vérifier les fichiers modifiés avec `git status`
   - Proposer l'ajout de fichiers spécifiques ou tous les fichiers

4. **Construction du Message**
   ```bash
   # Format : type(#issue): description
   git commit -m "$COMMIT_TYPE(#$ISSUE_NUMBER): $DESCRIPTION"
   ```

## Validation du Message

Le message de commit doit :

1. Suivre le format conventionnel
2. Inclure le numéro d'issue
3. Avoir une description claire et concise

## Exemples de Messages Valides

```
feat(#123): add user authentication system
fix(#456): resolve login page redirect issue
docs(#789): update API documentation
chore(#101): configure CI/CD pipeline
```

## Notes Importantes

1. Le type de commit est automatiquement déterminé par le préfixe de la branche
2. Le numéro d'issue est extrait du nom de la branche
3. La description doit être en anglais et utiliser l'impératif présent
4. Les fichiers à commiter doivent respecter le `.gitignore`
