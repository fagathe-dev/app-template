# App Template - Modèle d'Application Symfony

## Description
**App Template** est un projet de modèle d'application Symfony conçu pour servir de base à la création d'applications Symfony.  
Ce template inclut toutes les fonctionnalités de base, entités et configurations nécessaires pour accélérer le démarrage et garantir une structure cohérente pour vos projets.

## Fonctionnalités
- **Configuration de base Symfony** : Inclut les paramètres initiaux pour un démarrage rapide.
- **Entités Génériques** : Modèles d'entités communes utilisées dans de nombreuses applications (ex. : utilisateurs, rôles, logs).  
- **Fonctionnalités de Base** : Gestion des utilisateurs, authentification, gestion des rôles et des permissions.  
- **Architecture Modulaire** : Structure claire et organisée, facile à étendre.  
- **Compatibilité Symfony** : Intégration fluide avec les composants natifs de Symfony.  

## Structure du Projet
Voici un aperçu de la structure de base du projet :

app-template/  
├── config/  
├── src/  
│   ├── Controller/  
│   ├── Entity/  
│   ├── Repository/  
│   ├── Service/  
├── templates/  
├── tests/  
├── README.md  
└── composer.json
└── .env.template

## Prérequis
- PHP 8.3 ou supérieur.  
- Symfony 6.x.  
- Composer installé.  

## Installation
1. Clonez ce dépôt :  
```bash
git clone https://github.com/votre-repo/app-template.git
```

2. Accéder au dossier du projet 
```bash
cd app-template
```

3. Installer les dépendances avec Composer 
```bash
composer install
```

4. Configurez votre fichier `.env pour votre environnement local.