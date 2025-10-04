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
        Documenter l’avancement du développement dans un fichier PROGRESS.md (ex : fonctionnalités implémentées, bugs corrigés, décisions techniques).
    Jeux de données pour les tests :
        Utiliser les fichiers du dossier /dataset pour les tests et l’entraînement.
        Créer des données supplémentaires si nécessaire pour couvrir tous les cas d’usage.


Travaux du jour:
- Création du type `Result<T>` et helpers `ok`/`fail` (`src/types/result.ts`).
- Statistiques descriptives: `computeMean`, `computeMedian`, `computeModes`, `computeVariance`, `computeStandardDeviation`, `computeQuantile`, `computeSummary` (`src/stats/*`).
- Utilitaires texte: `stripHtml`, `tokenize` (`src/text/tokenize.ts`).
- Fréquence des mots (TF): `termFrequency` avec options relatif/brut (`src/text/tf.ts`).
- Tests: `src/stats/descriptive_test.ts`, `src/text/tf_test.ts`.
- Démo: `main.ts` exécute un résumé statistique et un TF simple.
 - IDF: `idfFromDocs` avec lissage et base log personnalisable (`src/text/idf.ts`).
 - Tests IDF: `src/text/idf_test.ts` (corpus simple, smoothing > 0).
 - Démo mise à jour: `main.ts` lit `dataset/pieceoccasion-1.html` et `dataset/pieceoccasion-2.html`, calcule TF sur `text1` et un échantillon d'IDF sur les deux documents.
 - TF-IDF: `tfidfFromDocs` et helper `topKTerms` (`src/text/tfidf.ts`).
 - Tests TF-IDF: `src/text/tfidf_test.ts`.
 - Démo TF-IDF: `main.ts` affiche le top 10 des termes TF-IDF pour chaque document.
 - Cooccurrence: `buildCooccurrenceMatrix`, `mostAssociated`, `computePPMI` (`src/text/cooccurrence*.ts`).
 - Tests Cooccurrence/PPMI: `src/text/cooccurrence_test.ts`.
 - Démo Cooccurrence: `main.ts` affiche voisins de `"porte"` (brut et PPMI).
 - PCA: `pca`, `pcaTransform` (`src/stats/pca.ts`) + utilitaires matrice (`src/math/matrix.ts`).
 - Analyse factorielle: `factorAnalysis` avec rotation varimax (`src/stats/factor.ts`).
 - Tests PCA/FA: `src/stats/pca_test.ts`, `src/stats/factor_test.ts`.
 - Démo PCA/FA: `main.ts` calcule TF-IDF sur 2 docs et affiche top termes par composante/facteur.