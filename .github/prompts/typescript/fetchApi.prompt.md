**Rôle**: En tant que développeur front-end Typescript, je veux que tu génères une fonction `fetchApi` en Typescript pour interagir avec une API RESTful, afin de faciliter les appels API dans mon application.

**Ce que tu dois savoir** :
Voici la structure de la fonction `fetchApi` que je veux que tu crées :

```typescript
// Interface FetchResponse comme définie précédemment
interface FetchResponse<T> {
  ok: boolean;
  headers: Headers;
  status: number;
  statusText: string;
  data: T;
  text: string;
  blob: Blob;
}

const fetchAPI = async <T>(url: string, options: RequestInit = {}): Promise<FetchResponse<T>> => {
  try {
    const response = await fetch(url, options);
    // Vérifie si la réponse est OK (statut 200-299)
    // ...implémentation améliorée...
    return {
      ok: response.ok,
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
      data: await response.json(),
      text: await response.text(),
      blob: await response.blob(),
    };
  } catch (error) {
    console.error('Fetch error:', error);
    throw error; // Relance l'erreur pour que l'appelant puisse la gérer
  }
};
```

Ce que tu dois faire :

- Améliorer la fonction `fetchApi` pour qu'elle gère les erreurs de manière appropriée.
- Ajouter des types pour les réponses de l'API.
- Assurer que la fonction est générique pour pouvoir être utilisée avec différents types de données.
- Ajouter une documentation complète pour la fonction `fetchApi`, incluant des exemples d'utilisation.
- Préciser que le fichier source à améliorer est `public/ts/utils/fetch.ts`.
- Chercher dans le répertoire `public/ts` toutes les utilisations de la fonction et adapter le code si nécessaire pour la bonne implémentation.
- Une fois la modification effectuée, lancer la commande de build `npm run build`.

**Exemples d'utilisation à inclure dans la documentation :**

```typescript
// Exemple GET
const response = await fetchAPI<MyType>('https://api.example.com/data');
if (response.ok) {
  console.log(response.data);
}

// Exemple POST
const response = await fetchAPI<MyType>('https://api.example.com/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'value' }),
});
if (response.ok) {
  console.log(response.data);
}
```
