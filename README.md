Comment produire du code en respectant les bonnes pratiques :

    Gestion des erreurs : Utiliser des blocs try/catch pour capturer et traiter les exceptions.
    Modularité :
        Découper le code en petites fonctions claires et réutilisables.
        Éviter les fonctions trop longues et illisibles.
    Typage des retours :
        Privilégier un système de retour uniformisé sous forme de tuple : [Error, null] | [null, T] (où T est le type attendu en cas de succès).
    Organisation des fichiers :
        Séparer la logique en plusieurs fichiers selon leur responsabilité (ex : services/, utils/, models/).
    Typage et interfaces :
        Isoler les types, interfaces et énumérations (enum) dans des fichiers dédiés (ex : types.ts, interfaces/, enums.ts).
    Tests unitaires :
        Créer un fichier de test pour chaque fonction/módulo développé (ex : maFonction.test.ts).
        Utiliser un framework comme Jest, Mocha ou Vitest.
    Suivi des progrès :
        Documenter l'avancement du développement dans un fichier PROGRESS.md (ex : fonctionnalités implémentées, bugs corrigés, décisions techniques).
    Organisation de la documentation :
        Créer un dossier /documentations à la racine du projet.
        Pour chaque module/fonctionnalité, créer un sous-dossier dédié (ex : documentations/normalize/).
        Regrouper dans ce sous-dossier : guides, README, rapports de tests, exemples.
        Créer un README.md d'index dans chaque sous-dossier pour naviguer dans la documentation.
    Jeux de données pour les tests :
        Utiliser les fichiers du dossier /dataset pour les tests et l'entraînement.
        Créer des données supplémentaires si nécessaire pour couvrir tous les cas d'usage.

---

Modules disponibles :

    Normalisation HTML (src/text/normalize.ts) :
        - 5 stratégies de normalisation (BASIC, CONTENT_ONLY, STRUCTURE_AWARE, WITH_METADATA, AGGRESSIVE)
        - Extraction de texte depuis HTML avec gestion des scripts, styles, métadonnées
        - Documentation complète : documentations/normalize/
        - Tests : 75 tests (100% réussite) - src/text/normalize_test.ts, normalize_integration_test.ts, normalize_edge_cases_test.ts
        - Exemples : demo_normalize.ts, integration_normalize.ts, examples/normalize_example.ts
        - Démarrage rapide : documentations/normalize/QUICKSTART_NORMALIZE.md
