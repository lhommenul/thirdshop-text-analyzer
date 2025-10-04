Comment produire le code les règles : 
1. utiliser try catch 
2. faire du modulaire, limiter un maximum les grosses fonctions unlisibles
3. utiliser comme type de retour Turple = [Error,null] | [null,T]
4. split les fichiers
5. split les types et interface enum dans des fichiers séparés
6. faire des fichiers de test pour chaque fonctions réalisés
7. Les développement que tu vas faire tu dois en garder un résumer dans 

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