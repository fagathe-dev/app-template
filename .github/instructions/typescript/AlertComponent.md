**Rôle**: En tant que développeur front-end Typescript, je veux que tu crées un prompt pour améliorer un composant existant et apporter des options supplémentaires.

**Source**: Le fichier source à améliorer est `public/ts/components/Alert.ts`.

**Ce que tu dois savoir** :

**Spécifications du composant `Alert`** :
Le composant `Alert` est utilisé pour afficher des messages d'alerte à l'utilisateur. Il doit être capable de gérer différents types de messages (succès, erreur, information, etc.) et doit être facilement personnalisable.

Je veux ajouter des options supplémentaires pour personnaliser le comportement et l'apparence du composant `Alert`. 
Voici la liste des options à ajouter :
- `containerId`: ID du conteneur où l'alerte sera affichée (optionnel). 
  Si cette option n'est pas fournie, l'alerte sera affichée dans un conteneur par défaut avec l'ID `alert-container` soit la constante `Alert.DEFAULT_CONTAINER_ID`.
- `duration`: Durée d'affichage de l'alerte en millisecondes (optionnel). 
- `dismissible`: Permet à l'utilisateur de fermer l'alerte (optionnel). valeur par défaut : `false`. Si cette option est définie à `true`, un bouton de fermeture doit être affiché dans l'alerte.

Les options doivent être passées dans le constructeur du Composant, ce sera le troisième paramètre et il ne doit pas être obligatoire.

**Voici les spécifications** :
```typescript
export interface AlertOptions {
    containerId: string; // ID du conteneur où l'alerte sera affichée
    duration?: number; // Durée d'affichage en millisecondes (optionnel)
    dismissible?: boolean; // Permet à l'utilisateur de fermer l'alerte (optionnel)
}
```

Je veux une fonction setUpOptions qui va prendre en paramètre un objet de type `AlertOptions` et qui va configurer le composant `Alert` en fonction des options fournies. Si une option n'est pas fournie, elle doit utiliser une valeur par défaut.
**Exemple d'utilisation** :
```typescript
const alert = new Alert('Message d\'alerte', 'success', {
    containerId: 'custom-alert-container',
    duration: 5000,
    dismissible: true
});
```
 
L'appel à la fonction `setUpOptions` doit être effectué dans la methode `init` du composant `Alert`, en tout premier. Il doit être appelé avant toute autre logique d'initialisation. 

**Ce que tu dois faire** :
- Prendre en compte les spécifications ci-dessus pour modifier le composant `Alert`.
- Ajouter la nouvelle interface `AlertOptions` et la méthode `setUpOptions` dans le fichier `public/ts/components/Alert.ts`.
- Assurer que le composant gère correctement les nouvelles options, notamment en ce qui concerne l'affichage et la durée de l'alerte.
- Mettre à jour la méthode `init` pour appeler `setUpOptions` avec les options fournies.
- Modifier les exemples d'utilisation du composant `Alert` dans le code existant pour refléter les nouvelles options.
- renomme la méthode `hide` en un nom plus explicite comme `dismiss` pour mieux refléter son comportement.
- Préciser que le fichier source à améliorer est `public/ts/components/Alert.ts`.
- Chercher dans le répertoire `public/ts` toutes les utilisations de la fonction et adapter le code si nécessaire pour la bonne implémentation.
- Une fois la modification effectuée, lancer la commande de build `npm run build`.
- Destination du prompt : `.github/prompts/typescript/components/Alert.prompt.md`.

