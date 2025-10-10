# Plan d'Implémentation : Analyseur de Structure HTML

**Date:** 9 octobre 2025  
**Objectif:** Créer un système d'analyse de structure HTML basé sur la profondeur des mots pour identifier les zones d'intérêt

---

## 🎯 Vue d'Ensemble

Le système analysera la structure hiérarchique d'un document HTML en calculant la profondeur de chaque mot (niveau d'encapsulation) et utilisera cette information pour détecter les blocs/zones d'intérêt dans le document.

---

## 📊 Concepts Clés

### 1. Profondeur d'un Mot
- **Définition:** Nombre de balises HTML parentes entre le mot et la racine du document
- **Exemple:** 
  ```html
  <html>              <!-- profondeur 0 -->
    <body>            <!-- profondeur 1 -->
      <div>           <!-- profondeur 2 -->
        <p>Mot</p>    <!-- "Mot" a une profondeur de 4 -->
      </div>
    </body>
  </html>
  ```

### 2. Bloc d'Intérêt
- **Définition:** Zone du document où la densité de mots et la profondeur suggèrent du contenu significatif
- **Critères possibles:**
  - Concentration de mots à profondeur similaire
  - Zones avec forte densité textuelle
  - Transitions significatives de profondeur
  - Clusters de contenu

---

## 🏗️ Architecture du Système

### Modules à Créer

```
src/html-structure/
├── html_parser.ts           # Parse HTML et extrait structure DOM
├── depth_calculator.ts      # Calcule profondeur de chaque mot
├── interest_detector.ts     # Détecte les zones d'intérêt
├── block_analyzer.ts        # Analyse les caractéristiques des blocs
├── types.ts                 # Types TypeScript pour le système
└── html_structure_test.ts   # Tests unitaires
```

---

## 📋 Tâches Détaillées

### Phase 1: Structures de Données et Types
**Fichier:** `src/html-structure/types.ts`

- [ ] **Tâche 1.1:** Définir `WordNode`
  - Position dans le texte (index début/fin)
  - Contenu du mot
  - Profondeur dans le DOM
  - Chemin DOM (sélecteur CSS ou XPath)
  - Balise parente directe
  - Attributs du parent (class, id, etc.)

- [ ] **Tâche 1.2:** Définir `StructureNode`
  - Représentation d'un nœud HTML
  - Type de balise
  - Profondeur
  - Enfants (récursif)
  - Texte contenu
  - Attributs

- [ ] **Tâche 1.3:** Définir `InterestBlock`
  - Zone d'intérêt identifiée
  - Position de début/fin
  - Liste de `WordNode` contenus
  - Score d'intérêt (0-1)
  - Profondeur moyenne
  - Statistiques (nb mots, densité, etc.)
  - Raison de sélection (critère utilisé)

- [ ] **Tâche 1.4:** Définir `DepthProfile`
  - Distribution des profondeurs dans le document
  - Histogramme des profondeurs
  - Profondeur min/max/moyenne/médiane
  - Zones de transition

---

### Phase 2: Parsing HTML et Extraction de Structure
**Fichier:** `src/html-structure/html_parser.ts`

- [ ] **Tâche 2.1:** Implémenter `parseHTML(html: string)`
  - Utiliser DOMParser ou deno-dom
  - Construire l'arbre DOM complet
  - Gérer les erreurs de parsing

- [ ] **Tâche 2.2:** Implémenter `buildStructureTree(node: Node)`
  - Parcours récursif du DOM
  - Création de la structure `StructureNode`
  - Ignorer scripts, styles, commentaires
  - Préserver les attributs importants

- [ ] **Tâche 2.3:** Implémenter `extractTextNodes(tree: StructureNode)`
  - Extraire tous les nœuds textuels
  - Nettoyer les espaces blancs
  - Associer chaque texte à son nœud parent

---

### Phase 3: Calcul de Profondeur
**Fichier:** `src/html-structure/depth_calculator.ts`

- [ ] **Tâche 3.1:** Implémenter `calculateDepth(node: Node)`
  - Calculer la profondeur depuis la racine
  - Gérer les différents types de nœuds
  - Cache des profondeurs calculées

- [ ] **Tâche 3.2:** Implémenter `extractWords(text: string)`
  - Tokenizer simple (split sur espaces/ponctuation)
  - Garder la position de chaque mot
  - Support Unicode

- [ ] **Tâche 3.3:** Implémenter `annotateWordsWithDepth(tree: StructureNode)`
  - Pour chaque nœud texte, extraire les mots
  - Assigner la profondeur à chaque mot
  - Créer liste de `WordNode[]`
  - Calculer chemin DOM pour chaque mot

- [ ] **Tâche 3.4:** Implémenter `buildDepthProfile(words: WordNode[])`
  - Générer statistiques globales
  - Histogramme des profondeurs
  - Identifier transitions significatives

---

### Phase 4: Détection des Zones d'Intérêt
**Fichier:** `src/html-structure/interest_detector.ts`

- [ ] **Tâche 4.1:** Algorithme de densité textuelle
  - Fenêtre glissante sur la séquence de mots
  - Calculer densité (mots/unité de profondeur)
  - Score basé sur concentration

- [ ] **Tâche 4.2:** Algorithme de stabilité de profondeur
  - Détecter zones où profondeur varie peu
  - Variance/écart-type de profondeur dans une fenêtre
  - Plateaux de profondeur = contenu structuré

- [ ] **Tâche 4.3:** Algorithme de clustering
  - Grouper mots avec profondeurs similaires
  - DBSCAN ou K-means sur (position, profondeur)
  - Identifier clusters denses

- [ ] **Tâche 4.4:** Algorithme de transition de profondeur
  - Détecter changements brusques de profondeur
  - Gradient de profondeur
  - Transitions = frontières de blocs

- [ ] **Tâche 4.5:** Implémentter `detectInterestBlocks(words: WordNode[])`
  - Combiner les 4 algorithmes ci-dessus
  - Fusion des blocs détectés
  - Calcul de scores d'intérêt
  - Filtrage des blocs trop petits/non significatifs

---

### Phase 5: Analyse des Blocs
**Fichier:** `src/html-structure/block_analyzer.ts`

- [ ] **Tâche 5.1:** Implémenter `analyzeBlock(block: InterestBlock)`
  - Statistiques textuelles (longueur, nb mots)
  - Analyse de la profondeur (min/max/moyenne)
  - Diversité des balises parentes
  - Présence de balises sémantiques (article, section, etc.)

- [ ] **Tâche 5.2:** Implémenter `scoreBlock(block: InterestBlock)`
  - Score composite basé sur:
    - Densité textuelle
    - Stabilité de profondeur
    - Présence de balises sémantiques
    - Longueur du contenu
  - Normaliser score entre 0-1

- [ ] **Tâche 5.3:** Implémenter `rankBlocks(blocks: InterestBlock[])`
  - Trier par score d'intérêt
  - Éliminer duplicatas/chevauchements
  - Garder top N blocs

---

### Phase 6: API et Interface
**Fichier:** `src/html-structure/analyzer.ts` (module principal)

- [ ] **Tâche 6.1:** Créer fonction principale `analyzeHTMLStructure(html: string)`
  - Orchestrer toutes les étapes
  - Parse → Depth → Detect → Analyze
  - Retourner résultat structuré

- [ ] **Tâche 6.2:** Implémenter options de configuration
  - Seuils de détection configurables
  - Choix d'algorithmes à activer/désactiver
  - Niveau de détail de sortie

- [ ] **Tâche 6.3:** Ajouter visualisation/debug
  - Export en format lisible
  - Coloration par profondeur
  - Mise en évidence des zones d'intérêt

---

## 🤔 Questions Ouvertes / Décisions à Prendre

1. **Granularité:** Analyser au niveau mot, phrase ou paragraphe?
   - → **Proposition:** Commencer au niveau mot, puis agréger

2. **Algorithmes:** Quel poids donner à chaque critère de détection?
   - → **Proposition:** Poids configurables, valeurs par défaut empiriques

3. **Visualisation:** Créer une vue HTML interactive?
   - → **Proposition:** Phase bonus si temps disponible, pas pour l'instant

4. **Intégration:** Connecter avec système d'extraction produit existant?
   - → **Proposition:** Oui, les zones d'intérêt peuvent guider l'extraction

---