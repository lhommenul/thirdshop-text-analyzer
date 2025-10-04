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

Session du 04/10/2025 - Normalisation HTML:
 - Types de normalisation: `NormalizationStrategy` (enum), `NormalizeOptions`, `NormalizedContent`, `HTML_ENTITIES` (`src/text/normalize_types.ts`).
 - Fonctions de normalisation HTML (`src/text/normalize.ts`):
   * `normalizeHtml`: Point d'entrée principal avec sélection de stratégie
   * `normalizeBasic`: Suppression simple des balises HTML
   * `normalizeContentOnly`: Garde uniquement le contenu visible (enlève scripts, styles, commentaires, SVG)
   * `normalizeStructureAware`: Préserve la structure avec sauts de ligne pour titres/paragraphes
   * `normalizeWithMetadata`: Extrait métadonnées (title, description, keywords, language) + contenu
   * `normalizeAggressive`: Nettoyage maximal pour texte pur uniquement
   * `extractText`: Helper simple pour extraction de texte
   * `compareStrategies`: Compare toutes les stratégies sur un même HTML
 - Tests unitaires complets: `src/text/normalize_test.ts` (30+ tests couvrant toutes les stratégies et cas limites).
 - Exemples d'utilisation: `examples/normalize_example.ts` (8 exemples détaillés incluant pipeline complet).
 - Décisions techniques:
   * Utilisation du type `Result<T>` pour gestion uniforme des erreurs
   * Enum `NormalizationStrategy` pour sélection explicite de stratégie
   * Support Unicode complet (caractères accentués, chinois, arabe, etc.)
   * Décodage des entités HTML (nommées, décimales, hexadécimales)
   * Options configurables pour whitespace, lignes vides, sauts de ligne
   * Fonction helper `decodeHtmlEntities` pour conversion d'entités HTML courantes
 - Cas d'usage recommandés par stratégie:
   * BASIC: Tests rapides, prototypage
   * CONTENT_ONLY: Usage général, recommandée par défaut
   * STRUCTURE_AWARE: Analyse de structure documentaire, extraction de sections
   * WITH_METADATA: SEO, classification de documents, enrichissement contextuel
   * AGGRESSIVE: Nettoyage maximal pour analyse linguistique pure