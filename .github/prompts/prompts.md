**Contexte** : Je suis en train de coder une application Symfony avce une interface d'adminstration pour le site incluant la gestion des comptes utilisateur.
**La fonctionnalité concernée** : Création de nouveaux utilisateur. Voici les étapes
1. Formulaire de création d'un utilisateur avec validation du form ✅
2. Création d'un User à partir d'un formulaire ✅
3. Envoi d'un e-mail à l'utilisateur qui vient d'être crée pour changement de mot de passe et validation de compte ❌
**Ma demande** : Je veux que que tu me crée un modèle d'e-mail `.hmtl.twig `
Ce que je veux dans l'e-mail : 
- un message pour dire que son e-mail a bien été crée
- une section avec ces identifiants de connexion avec son mot de passe en clair
- une section de type alert (inspire de bootstrap 5) pour informer l'utilisateur qu'il doit supprimer cet e-mail car contient son mot de passe en clair et changer son mot de passe le plus vite possible
- un lien pour activer son compte

