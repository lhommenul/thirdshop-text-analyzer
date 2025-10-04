# Plan de Développement Final - ThirdShop Text Analyzer
## Classification et Extraction de Données Produit (Version Consolidée)

**Date :** 4 octobre 2025  
**Version :** 1.0 Final (fusion des plans A et BIS)  
**Objectif :** Système production-ready pour catégoriser les pages web (produit vs non-produit) et extraire des données structurées avec normalisation rigoureuse

---

## 📊 Table des matières

1. [Vision et contexte](#vision-et-contexte)
2. [KPI et métriques de succès](#kpi-et-métriques-de-succès)
3. [API publique](#api-publique)
4. [Architecture technique](#architecture-technique)
5. [Spécifications fonctionnelles](#spécifications-fonctionnelles)
6. [Roadmap et jalons](#roadmap-et-jalons)
7. [Risques et mitigations](#risques-et-mitigations)
8. [Livrables](#livrables)
9. [Stack technique](#stack-technique)

---

## Vision et contexte

### Objectif global
Exploiter des documents HTML pour :
1. **Classifier** automatiquement les pages produit vs non-produit (F1 ≥ 0.90)
2. **Extraire** des attributs clés avec normalisation rigoureuse (prix, devise, référence, dimensions, poids, etc.)
3. **Fournir** des explications et des scores de confiance pour chaque décision

### Approche technique
- **Multi-source fusion** : Combiner JSON-LD, microdata, Open Graph, heuristiques textuelles avec résolution de conflits
- **Feature engineering riche** : Features structurelles, textuelles et sémantiques pour classification explicable
- **Normalisation stricte** : Unités SI, ISO 4217, formats standardisés avec traçabilité
- **Performance optimisée** : Target ≥50 pages/s avec I/O parallèle
- **Priorité FR** : Patterns et stopwords français, extensible multi-langues

### Analyse de l'existant ✅

**Points forts :**
- ✅ Gestion d'erreurs avec type `Result<T>` uniforme
- ✅ Code modulaire (src/text/, src/stats/, src/math/)
- ✅ 75 tests unitaires (100% de réussite)
- ✅ Documentation complète dans `/documentations`
- ✅ Normalisation HTML avec 5 stratégies
- ✅ Analyse textuelle (TF, IDF, TF-IDF, co-occurrence, PCA)

**Ce qui manque :**
- ❌ Parser DOM structuré
- ❌ Extraction métadonnées e-commerce (Schema.org, Open Graph, JSON-LD)
- ❌ Classification automatique des pages
- ❌ Normalisation d'unités (SI, ISO 4217)
- ❌ Pipeline unifié extraction + classification
- ❌ CLI d'analyse en lot

---

## KPI et métriques de succès

### Classification (Produit vs Non-Produit)

| Métrique | Sprint 2 (MVP) | Sprint 4 (Optimisé) | Plan Final |
|----------|----------------|---------------------|------------|
| **F1-Score** | ≥ 0.87 | ≥ 0.92 | **≥ 0.90** ✓ |
| **Précision** | ≥ 0.85 | ≥ 0.90 | **≥ 0.88** ✓ |
| **Rappel** | ≥ 0.90 | ≥ 0.95 | **≥ 0.92** ✓ |
| **Confiance moyenne** | ≥ 0.70 | ≥ 0.80 | **≥ 0.75** ✓ |
| **AUPRC** | - | - | **≥ 0.92** ✓ |

### Extraction de données

| Attribut | Objectif | Mesure |
|----------|----------|--------|
| **Prix + Devise** | **≥ 98%** | Exactitude ±0.01 unité, ISO 4217 |
| **Référence/SKU** | **≥ 95%** | Exact-match (case-insensitive) |
| **Nom produit** | **≥ 90%** | Présence + cohérence |
| **Marque** | **≥ 85%** | Exact-match |
| **Poids** | **≥ 90%** | Normalisation en grammes ±1% |
| **Dimensions** | **≥ 90%** | Normalisation en millimètres ±1% |
| **Images produit** | **≥ 85%** | Comptage + pertinence |
| **JSON-LD Product** | **≥ 95%** | Détection quand présent |

### Performance

| Métrique | Objectif |
|----------|----------|
| **Throughput** | **≥ 50 pages/s** |
| **Latence par page** | < 20ms (en moyenne) |
| **Batch 100 pages** | < 5s (I/O parallèle) |
| **Mémoire** | < 500MB stable |
| **CPU** | ≤ 80% sur 4 cores |

---

## API publique

### Fonctions principales

```typescript
/**
 * Classifie une page HTML comme produit ou non-produit
 * @returns Score, label, features extraites, raisons explicatives
 */
export function isProductPage(
  html: string,
  opts?: ClassificationOptions
): Result<{
  score: number;           // 0-10
  label: boolean;          // true = produit
  confidence: number;      // 0-1
  features: PageFeatures;
  reasons: string[];       // Explications lisibles
}>;

/**
 * Extrait toutes les informations produit disponibles
 * @returns Données produit normalisées avec confiance et evidence
 */
export function extractProductInfo(
  html: string,
  opts?: ExtractionOptions
): Result<{
  product: ProductInfo;
  confidence: number;             // 0-1 global
  evidence: ExtractionEvidence[]; // Traçabilité par source
}>;

/**
 * Analyse complète : classification + extraction + analyse textuelle
 * Point d'entrée principal du pipeline
 */
export function analyzePage(
  html: string,
  opts?: AnalysisOptions
): Result<AnalysisResult>;

/**
 * Parse HTML et extrait métadonnées structurées
 */
export function parseDom(
  html: string
): Result<{
  document: DomLike;
  jsonLd: any[];
  microdata: any[];
  openGraph: Record<string, string>;
  metadata: PageMetadata;
}>;

/**
 * Analyse batch avec parallélisation
 */
export async function analyzePages(
  htmlPages: Array<{ id: string; html: string }>,
  opts?: AnalysisOptions
): Promise<Result<Map<string, AnalysisResult>>>;

/**
 * Analyse d'un dossier complet
 */
export async function analyzeDirectory(
  dirpath: string,
  pattern?: string,
  opts?: AnalysisOptions
): Promise<Result<Map<string, AnalysisResult>>>;
```

### Types de données

```typescript
export interface ProductInfo {
  // Identifiants
  reference?: string;        // SKU, EAN, référence interne
  sku?: string;
  ean?: string;
  gtin13?: string;
  gtin14?: string;
  
  // Informations de base
  name?: string;
  brand?: string;
  model?: string;
  category?: string;
  description?: string;
  
  // Prix (normalisé)
  price?: {
    amount: number;          // En centimes (EUR) ou cents (USD)
    currency: string;        // ISO 4217 (EUR, USD, GBP, etc.)
    originalValue: string;   // Valeur originale extraite
    confidence: number;      // 0-1
  };
  
  // Caractéristiques physiques (normalisées SI)
  weight?: {
    value: number;          // En grammes
    unit: 'g';              // Toujours g après normalisation
    originalValue: string;
    originalUnit: string;
  };
  
  dimensions?: {
    length?: number;        // En millimètres
    width?: number;
    height?: number;
    diameter?: number;
    unit: 'mm';            // Toujours mm après normalisation
    originalValue: string;
  };
  
  // Capacités électriques (normalisées SI)
  battery?: {
    capacity: number;       // En mAh
    voltage?: number;       // En V
    power?: number;         // En W
  };
  
  // Disponibilité
  availability?: 'in_stock' | 'out_of_stock' | 'preorder' | 'discontinued' | 'unknown';
  stockQuantity?: number;
  
  // Images
  images?: Array<{
    url: string;
    alt?: string;
    width?: number;
    height?: number;
    isPrimary: boolean;
  }>;
  
  // Métadonnées
  condition?: 'new' | 'used' | 'refurbished' | 'unknown';
  warranty?: string;
  color?: string;
  size?: string;
  material?: string;
  
  // Traçabilité extraction
  extractionMethods: Array<'jsonld' | 'microdata' | 'opengraph' | 'pattern' | 'context' | 'semantic'>;
  confidence: number;      // 0-1 confiance globale
}

export interface ExtractionEvidence {
  field: string;           // Nom du champ (ex: "price")
  value: any;              // Valeur extraite
  source: 'jsonld' | 'microdata' | 'opengraph' | 'pattern' | 'context' | 'semantic';
  confidence: number;      // 0-1
  location?: string;       // XPath ou sélecteur CSS
  rawText?: string;        // Texte original extrait
}

export interface PageFeatures {
  // Features structurelles HTML
  structural: {
    hasSchemaOrgProduct: boolean;
    hasOpenGraphProduct: boolean;
    hasJsonLdProduct: boolean;
    hasAddToCartButton: boolean;
    hasBuyButton: boolean;
    hasProductImages: boolean;
    hasRatings: boolean;
    hasPriceDisplay: boolean;
    imageCount: number;
    imageHighResCount: number;      // ≥ 300x300
    linkDensity: number;            // ratio liens/contenu
    tableCount: number;
    listCount: number;
    formCount: number;
  };
  
  // Features textuelles
  textual: {
    wordCount: number;
    digitDensity: number;           // ratio chiffres/mots
    ecommerceKeywordCount: number;  // "prix", "acheter", "panier", etc.
    productKeywordCount: number;    // "référence", "dimensions", etc.
    hasPrice: boolean;
    hasPriceLabel: boolean;         // "Prix", "Price", etc.
    hasReference: boolean;
    hasStock: boolean;
    hasShipping: boolean;
    hasWarranty: boolean;
    topTermsTfidf: Array<[string, number]>;
    language?: string;              // Détection langue
  };
  
  // Features sémantiques
  semantic: {
    hasSpecTable: boolean;          // Tableau de spécifications
    hasFeatureList: boolean;        // Liste de caractéristiques
    hasProductDescription: boolean;
    hasProductTitle: boolean;
    contentStructureScore: number;  // 0-10
    mainContentDensity: number;     // Ratio contenu principal/total
  };
  
  // Scores agrégés
  scores: {
    structuralScore: number;    // 0-10
    textualScore: number;       // 0-10
    semanticScore: number;      // 0-10
    overallScore: number;       // 0-10 (pondéré)
  };
}

export interface AnalysisResult {
  // Classification
  classification: {
    isProductPage: boolean;
    confidence: number;
    score: number;           // 0-10
    reasons: string[];       // Explications lisibles
    features: PageFeatures;
  };
  
  // Données produit (si page produit)
  productData?: ProductInfo;
  evidence?: ExtractionEvidence[];
  
  // Analyse textuelle
  textAnalysis: {
    wordCount: number;
    topTerms: Array<[string, number]>;
    keyPhrases: string[];
    language?: string;
  };
  
  // Métadonnées page
  metadata: {
    title?: string;
    description?: string;
    keywords?: string[];
    language?: string;
    canonical?: string;
  };
  
  // Statistiques traitement
  processingTime: number;
  stepsCompleted: string[];
  errors?: string[];
}
```

---

## Architecture technique

### Vue d'ensemble du pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                      HTML INPUT                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: PARSING DOM & NORMALISATION                       │
│  - Parse HTML (linkedom)                                     │
│  - Extraction JSON-LD, microdata, Open Graph                 │
│  - Normalisation HTML (WITH_METADATA)                        │
│  - Détection contenu principal (densité, nav removal)       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: FEATURE ENGINEERING                                │
│  - Features structurelles (JSON-LD, boutons, forms)         │
│  - Features textuelles (TF-IDF, keywords, digit density)    │
│  - Features sémantiques (tables, lists, content structure)  │
│  - Calcul scores pondérés                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 3: CLASSIFICATION                                     │
│  - Scoring multi-critères (structural × 0.5 + textual × 0.3 │
│    + semantic × 0.2)                                         │
│  - Décision: seuil calibré (défaut 5.0/10)                 │
│  - Génération raisons explicatives                          │
│  - Calcul confiance basé sur distance au seuil             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├──────────► NON-PRODUIT → Résultat minimal
                       │
                       ▼ PRODUIT
┌─────────────────────────────────────────────────────────────┐
│  PHASE 4: EXTRACTION MULTI-SOURCE                            │
│  - Priorité: JSON-LD > microdata > OpenGraph > patterns     │
│  - Normalisation unités (SI, ISO 4217)                      │
│  - Fusion avec résolution conflits                          │
│  - Evidence tracking détaillé                               │
│  - Context-aware extraction (proximité textuelle)           │
│  - Semantic extraction (tableaux specs, listes)             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 5: ANALYSE TEXTUELLE (Optionnelle)                   │
│  - TF-IDF top termes                                        │
│  - Extraction key phrases                                   │
│  - Co-occurrence analysis                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  RÉSULTAT ENRICHI                                            │
│  - Classification + confiance + explications                 │
│  - Données produit normalisées + evidence                    │
│  - Analyse textuelle (top termes, keyphrases)               │
│  - Métadonnées + statistiques traitement                    │
└─────────────────────────────────────────────────────────────┘
```

### Organisation des modules

```
src/
├── html/                        # NOUVEAU - Parsing HTML
│   ├── parser.ts               # Parser DOM (linkedom wrapper)
│   ├── content_extractor.ts    # Extraction contenu principal
│   ├── dom_utils.ts            # Utilitaires DOM (querySelector, etc.)
│   ├── parser_types.ts         # Types (DOMNode, ParseOptions)
│   └── parser_test.ts
│
├── extraction/                  # NOUVEAU - Extraction données produit
│   ├── product_extractor.ts   # Orchestration extraction principale
│   ├── schema_parser.ts        # Schema.org, Open Graph, JSON-LD
│   ├── pattern_matcher.ts      # Patterns regex (prix, ref, dimensions)
│   ├── semantic_extractor.ts   # Extraction tableaux, listes specs
│   ├── context_extractor.ts    # Extraction par proximité textuelle
│   ├── normalizer.ts           # Normalisation unités (SI, ISO 4217)
│   ├── fusion.ts               # Fusion multi-source + résolution conflits
│   ├── patterns.ts             # Bibliothèque patterns FR/EN
│   ├── extraction_types.ts     # Types (ProductInfo, Evidence, etc.)
│   └── extraction_test.ts
│
├── classification/              # NOUVEAU - Classification pages
│   ├── features.ts             # Feature engineering
│   ├── rule_classifier.ts      # Classificateur basé sur règles
│   ├── scoring.ts              # Système de scoring détaillé
│   ├── ml_classifier.ts        # Classificateur ML (Sprint 4, optionnel)
│   ├── calibration.ts          # Calibration seuils (AUPRC, F1)
│   ├── classification_types.ts # Types (Features, ClassificationResult)
│   └── classification_test.ts
│
├── pipeline/                    # NOUVEAU - Pipeline unifié
│   ├── analyzer.ts             # Pipeline principal
│   ├── batch_processor.ts      # Traitement parallèle batch
│   ├── formatters.ts           # Export JSON, CSV, Markdown, texte
│   ├── reporters.ts            # Génération rapports métriques
│   ├── analyzer_types.ts       # Types (AnalysisOptions, AnalysisResult)
│   └── analyzer_test.ts
│
├── cli/                         # NOUVEAU - Interface CLI
│   ├── analyze.ts              # Commande principale
│   ├── commands.ts             # Sous-commandes (extract, classify, etc.)
│   ├── config.ts               # Configuration CLI
│   └── output.ts               # Formatage sortie console
│
├── text/                        # EXISTANT - Modules texte (AMÉLIORÉ)
│   ├── normalize.ts            # ✅ Déjà implémenté
│   ├── tokenize.ts             # ✅ Amélioré (digits, n-grams, stopwords FR)
│   ├── tf.ts, idf.ts, tfidf.ts # ✅ Déjà implémenté
│   ├── cooccurrence.ts         # ✅ Déjà implémenté
│   └── stopwords_fr.ts         # NOUVEAU - Liste stopwords français
│
├── stats/                       # EXISTANT - Statistiques
│   └── ...                     # ✅ Déjà implémenté
│
├── math/                        # EXISTANT - Matrices, algèbre
│   └── ...                     # ✅ Déjà implémenté
│
└── types/
    └── result.ts               # ✅ Déjà implémenté
```

---

## Spécifications fonctionnelles

### 1. Parsing DOM et contenu principal

#### 1.1 Parser HTML structuré (`src/html/parser.ts`)

**Objectif :** Wrapper robuste autour de linkedom pour Deno

**Fonctionnalités :**
- Parse HTML en structure DOM navigable
- Support sélecteurs CSS complets
- Extraction JSON-LD, microdata, Open Graph
- Gestion entités HTML et encodage
- Tolérance aux erreurs (HTML malformé)

**API :**
```typescript
export function parseHtml(html: string, opts?: ParseOptions): Result<ParsedDocument>;
export function querySelector(root: DOMNode, selector: string): Result<DOMNode | null>;
export function querySelectorAll(root: DOMNode, selector: string): Result<DOMNode[]>;
export function extractJsonLd(document: DOMNode): Result<any[]>;
export function extractMicrodata(document: DOMNode): Result<any[]>;
export function extractOpenGraph(document: DOMNode): Result<Record<string, string>>;
```

#### 1.2 Extraction contenu principal (`src/html/content_extractor.ts`)

**Objectif :** Isoler le contenu principal pour améliorer features textuelles

**Heuristiques :**
- Calcul densité texte/liens par bloc
- Suppression navigation, header, footer, sidebar
- Détection sections répétitives (menus, ads)
- Score de pertinence par nœud DOM

**API :**
```typescript
export function extractMainContent(document: DOMNode): Result<{
  mainContent: string;
  mainContentNode: DOMNode;
  contentDensity: number;
  removedNodes: string[]; // Types de nœuds supprimés
}>;
```

### 2. Feature Engineering

#### 2.1 Features structurelles (`src/classification/features.ts`)

**Extraction automatique depuis DOM :**
```typescript
structural: {
  hasSchemaOrgProduct: boolean;          // itemtype="Product"
  hasOpenGraphProduct: boolean;          // og:type="product"
  hasJsonLdProduct: boolean;             // @type="Product"
  hasAddToCartButton: boolean;           // Bouton "Ajouter au panier"
  hasBuyButton: boolean;                 // Bouton "Acheter"
  hasProductImages: boolean;             // Images ≥ 300x300
  hasRatings: boolean;                   // Étoiles, avis
  hasPriceDisplay: boolean;              // Affichage prix stylisé
  imageCount: number;
  imageHighResCount: number;
  linkDensity: number;                   // < 0.3 typique pour produits
  tableCount: number;
  listCount: number;
  formCount: number;
}
```

**Scoring :** `structuralScore = Σ(feature × weight) / maxScore × 10`

#### 2.2 Features textuelles (`src/classification/features.ts`)

**Extraction depuis texte normalisé :**
```typescript
textual: {
  wordCount: number;
  digitDensity: number;                  // Produits ont souvent beaucoup de chiffres
  ecommerceKeywordCount: number;         // "prix", "acheter", "livraison", etc.
  productKeywordCount: number;           // "référence", "dimensions", "poids"
  hasPrice: boolean;
  hasPriceLabel: boolean;
  hasReference: boolean;
  hasStock: boolean;
  hasShipping: boolean;
  hasWarranty: boolean;
  topTermsTfidf: Array<[string, number]>;
  language?: string;
}
```

**Mots-clés e-commerce FR/EN :**
```typescript
export const ECOMMERCE_KEYWORDS = [
  // FR
  'prix', 'acheter', 'ajouter', 'panier', 'commander', 'livraison',
  'stock', 'disponible', 'garantie', 'retour', 'remboursement',
  // EN
  'price', 'buy', 'add', 'cart', 'order', 'shipping', 'delivery',
  'stock', 'available', 'warranty', 'return', 'refund'
];
```

**Scoring :** `textualScore = f(keywordDensity, digitDensity, price presence, ...)`

#### 2.3 Features sémantiques (`src/classification/features.ts`)

**Analyse structure contenu :**
```typescript
semantic: {
  hasSpecTable: boolean;                 // <table> avec "Caractéristiques"
  hasFeatureList: boolean;               // <ul>/<dl> avec specs
  hasProductDescription: boolean;        // Bloc description détaillée
  hasProductTitle: boolean;              // <h1> type produit
  contentStructureScore: number;         // 0-10 qualité structure
  mainContentDensity: number;            // Ratio contenu principal/total
}
```

### 3. Classification

#### 3.1 Classificateur basé sur règles (`src/classification/rule_classifier.ts`)

**Formule de scoring :**
```typescript
overallScore = 
  (structuralScore × 0.5) +
  (textualScore × 0.3) +
  (semanticScore × 0.2)

isProductPage = overallScore >= threshold (défaut: 5.0)

confidence = sigmoid((overallScore - threshold) / 2.0)
```

**Génération raisons explicatives :**
```typescript
reasons = [
  "✓ JSON-LD Product détecté",
  "✓ Prix trouvé: 120.00 EUR",
  "✓ Référence produit: 23572714",
  "✓ Tableau de spécifications présent",
  "⚠ Pas de bouton 'Ajouter au panier'",
  "⚠ Faible densité d'images"
]
```

#### 3.2 Calibration des seuils (`src/classification/calibration.ts`)

**Méthode :**
1. Annoter dataset de validation (produit/non-produit)
2. Calculer scores sur tout le dataset
3. Générer courbe Precision-Recall
4. Sélectionner seuil maximisant F1 ou AUPRC
5. Valider sur test set séparé

**API :**
```typescript
export function calibrateThreshold(
  examples: LabeledExample[],
  metric: 'f1' | 'auprc'
): Result<{
  optimalThreshold: number;
  f1Score: number;
  precision: number;
  recall: number;
  auprc: number;
}>;
```

### 4. Extraction multi-source

#### 4.1 Extraction JSON-LD / Microdata / Open Graph (`src/extraction/schema_parser.ts`)

**Priorité :** JSON-LD > Microdata > Open Graph

**Standards supportés :**

**JSON-LD (priorité 1) :**
```json
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "Compresseur air conditionné PEUGEOT 307",
  "sku": "23572714",
  "brand": { "@type": "Brand", "name": "PEUGEOT" },
  "offers": {
    "@type": "Offer",
    "price": "120.00",
    "priceCurrency": "EUR",
    "availability": "https://schema.org/InStock"
  },
  "weight": { "@type": "QuantitativeValue", "value": "2.5", "unitCode": "KGM" },
  "image": "https://example.com/product.jpg"
}
```

**Microdata (priorité 2) :**
```html
<div itemscope itemtype="https://schema.org/Product">
  <span itemprop="name">Compresseur</span>
  <span itemprop="price">120.00</span>
  <span itemprop="priceCurrency">EUR</span>
</div>
```

**Open Graph (priorité 3) :**
```html
<meta property="og:type" content="product">
<meta property="product:price:amount" content="120.00">
<meta property="product:price:currency" content="EUR">
```

#### 4.2 Extraction par patterns regex (`src/extraction/pattern_matcher.ts`)

**Bibliothèque patterns FR/EN :**
```typescript
export const PATTERNS = {
  // Prix (multi-formats)
  PRICE_EUR_SYMBOL: /(\d+(?:[.,]\d{2})?)\s*€/g,
  PRICE_EUR_CODE: /(\d+(?:[.,]\d{2})?)\s*EUR/gi,
  PRICE_LABELED_FR: /prix[\s:]*(\d+[.,]\d{2})/gi,
  PRICE_LABELED_EN: /price[\s:]*(\d+[.,]\d{2})/gi,
  PRICE_USD: /\$\s*(\d+(?:[.,]\d{2})?)/g,
  
  // Référence/SKU (multi-formats)
  REF_LABELED_FR: /réf(?:érence)?[\s:.]*([A-Z0-9-]{4,20})/gi,
  REF_LABELED_EN: /ref(?:erence)?[\s:.]*([A-Z0-9-]{4,20})/gi,
  SKU_LABELED: /SKU[\s:.]*([A-Z0-9-]{4,20})/gi,
  EAN: /EAN[\s:.]*(\d{13})/gi,
  GTIN: /GTIN[\s:.]*(\d{8,14})/gi,
  
  // Poids (normalisation vers grammes)
  WEIGHT_KG: /(\d+(?:[.,]\d+)?)\s*kg/gi,
  WEIGHT_G: /(\d+)\s*g(?:rammes?)?/gi,
  WEIGHT_LABELED_FR: /poids[\s:]*(\d+(?:[.,]\d+)?)\s*(kg|g)/gi,
  WEIGHT_LABELED_EN: /weight[\s:]*(\d+(?:[.,]\d+)?)\s*(kg|g)/gi,
  
  // Dimensions (normalisation vers mm)
  DIMENSIONS_3D: /(\d+)\s*[x×]\s*(\d+)\s*[x×]\s*(\d+)\s*(mm|cm|m)/gi,
  DIMENSIONS_2D: /(\d+)\s*[x×]\s*(\d+)\s*(mm|cm|m)/gi,
  LENGTH_LABELED: /longueur[\s:]*(\d+)\s*(mm|cm|m)/gi,
  WIDTH_LABELED: /largeur[\s:]*(\d+)\s*(mm|cm|m)/gi,
  HEIGHT_LABELED: /hauteur[\s:]*(\d+)\s*(mm|cm|m)/gi,
  
  // Stock/Disponibilité
  IN_STOCK_FR: /en\s+stock|disponible/gi,
  OUT_OF_STOCK_FR: /rupture|indisponible|épuisé/gi,
  IN_STOCK_EN: /in\s+stock|available/gi,
  OUT_OF_STOCK_EN: /out\s+of\s+stock|unavailable|sold\s+out/gi,
};
```

#### 4.3 Normalisation d'unités (`src/extraction/normalizer.ts`)

**Objectif :** Unités SI + ISO 4217 pour comparabilité

**Règles de normalisation :**

```typescript
// Prix → centimes + ISO 4217
"120.00 €" → { amount: 12000, currency: "EUR" }
"$99.99"   → { amount: 9999, currency: "USD" }
"45,50 EUR" → { amount: 4550, currency: "EUR" }

// Poids → grammes
"2.5 kg"   → { value: 2500, unit: "g" }
"500 g"    → { value: 500, unit: "g" }
"1.2kg"    → { value: 1200, unit: "g" }

// Dimensions → millimètres
"30 x 20 x 10 cm" → { length: 300, width: 200, height: 100, unit: "mm" }
"1.5 m"           → { value: 1500, unit: "mm" }
"250 mm"          → { value: 250, unit: "mm" }

// Capacité batterie → mAh
"3000 mAh" → { capacity: 3000, unit: "mAh" }
"3 Ah"     → { capacity: 3000, unit: "mAh" }
```

**API :**
```typescript
export function normalizePrice(value: string, currency?: string): Result<Money>;
export function normalizeWeight(value: string | number, unit: string): Result<Weight>;
export function normalizeDimension(value: string | number, unit: string): Result<number>; // mm
export function normalizeBatteryCapacity(value: string | number, unit: string): Result<number>; // mAh
```

#### 4.4 Extraction context-aware (`src/extraction/context_extractor.ts`)

**Objectif :** Trouver valeurs par proximité textuelle avec mots-clés

**Méthode :**
1. Tokenizer le texte avec positions
2. Trouver occurrences de mots-clés ("Prix", "Référence", etc.)
3. Chercher patterns dans fenêtre de N tokens autour
4. Scorer par distance au mot-clé

**Exemple :**
```
Texte: "... Référence fabricant : 23572714. Ce compresseur ..."
       ↑ keyword         ↑ value (distance: 2 tokens)
```

**API :**
```typescript
export function extractByContext(
  text: string,
  keywords: string[],
  pattern: RegExp,
  windowSize?: number  // défaut: 10 tokens
): Result<Array<{
  value: string;
  keyword: string;
  distance: number;
  confidence: number;
}>>;
```

#### 4.5 Extraction sémantique (`src/extraction/semantic_extractor.ts`)

**Objectif :** Extraire depuis tableaux HTML et listes structurées

**Tableaux de spécifications :**
```html
<table>
  <tr><td>Référence</td><td>23572714</td></tr>
  <tr><td>Poids</td><td>2.5 kg</td></tr>
  <tr><td>Dimensions</td><td>30 x 20 x 10 cm</td></tr>
</table>
```

**Listes de caractéristiques :**
```html
<dl>
  <dt>SKU</dt><dd>ABC123</dd>
  <dt>Marque</dt><dd>PEUGEOT</dd>
</dl>
```

**API :**
```typescript
export function extractFromTable(
  tableNode: DOMNode,
  keyColumn?: number,
  valueColumn?: number
): Result<Record<string, string>>;

export function extractFromList(
  listNode: DOMNode,
  listType: 'dl' | 'ul'
): Result<Record<string, string>>;
```

#### 4.6 Fusion multi-source (`src/extraction/fusion.ts`)

**Objectif :** Résoudre conflits entre sources et maximiser confiance

**Stratégie de fusion :**
1. **Pondération par source :**
   - JSON-LD : poids 1.0
   - Microdata : poids 0.8
   - Open Graph : poids 0.6
   - Pattern + context : poids 0.4
   - Pattern seul : poids 0.3

2. **Résolution conflits :**
   - Si valeurs identiques → confiance maximale
   - Si valeurs proches (±1%) → moyenne pondérée
   - Si valeurs divergentes → prendre source prioritaire

3. **Evidence tracking :**
   - Enregistrer toutes les sources pour chaque champ
   - Fournir traçabilité complète

**API :**
```typescript
export function mergeProductData(
  sources: Array<{
    data: Partial<ProductInfo>;
    source: ExtractionMethod;
    weight: number;
  }>
): Result<{
  merged: ProductInfo;
  evidence: ExtractionEvidence[];
  conflicts: Array<{
    field: string;
    values: any[];
    resolution: string;
  }>;
}>;
```

### 5. Pipeline unifié

#### 5.1 Orchestration principale (`src/pipeline/analyzer.ts`)

**Implémentation du pipeline :**

```typescript
export function analyzePage(
  html: string,
  opts: AnalysisOptions = {}
): Result<AnalysisResult> {
  const startTime = performance.now();
  const stepsCompleted: string[] = [];
  const errors: string[] = [];
  
  // ÉTAPE 1: Parsing DOM
  const [parseErr, parsed] = parseDom(html);
  if (parseErr) return fail(parseErr);
  stepsCompleted.push('parsing');
  
  // ÉTAPE 2: Normalisation HTML
  const [normErr, normalized] = normalizeHtml(html, {
    strategy: opts.normalizationStrategy ?? 'WITH_METADATA'
  });
  if (normErr) return fail(normErr);
  stepsCompleted.push('normalization');
  
  // ÉTAPE 3: Extraction contenu principal
  const [contentErr, mainContent] = extractMainContent(parsed.document);
  if (contentErr) errors.push(`Content extraction: ${contentErr.message}`);
  stepsCompleted.push('content_extraction');
  
  // ÉTAPE 4: Feature engineering
  const [featErr, features] = extractFeatures(html, normalized, mainContent);
  if (featErr) return fail(featErr);
  stepsCompleted.push('features');
  
  // ÉTAPE 5: Classification
  let classification: ClassificationResult;
  if (!opts.skipClassification) {
    const [classErr, classResult] = classifyPage(features, opts.classifierRules);
    if (classErr) return fail(classErr);
    classification = classResult;
    stepsCompleted.push('classification');
  }
  
  // ÉTAPE 6: Extraction produit (si page produit)
  let productData: ProductInfo | undefined;
  let evidence: ExtractionEvidence[] | undefined;
  
  if (opts.skipClassification || classification.isProductPage) {
    const [extractErr, extracted] = extractProductInfo(html, parsed, opts.extractionOptions);
    if (extractErr) {
      errors.push(`Extraction: ${extractErr.message}`);
    } else {
      productData = extracted.product;
      evidence = extracted.evidence;
      stepsCompleted.push('extraction');
    }
  }
  
  // ÉTAPE 7: Analyse textuelle TF-IDF (optionnelle)
  let topTerms: Array<[string, number]> = [];
  if (opts.computeTfidf ?? true) {
    const [tfErr, tf] = termFrequency(normalized.text, { asRelative: true });
    if (!tfErr) {
      topTerms = Object.entries(tf)
        .sort((a, b) => b[1] - a[1])
        .slice(0, opts.topTermsCount ?? 20);
      stepsCompleted.push('tfidf');
    }
  }
  
  // ÉTAPE 8: Assemblage résultat
  const result: AnalysisResult = {
    classification: {
      isProductPage: classification?.isProductPage ?? false,
      confidence: classification?.confidence ?? 0,
      score: classification?.score ?? 0,
      reasons: classification?.reasons ?? [],
      features
    },
    productData,
    evidence,
    textAnalysis: {
      wordCount: normalized.text.split(/\s+/).length,
      topTerms,
      keyPhrases: [],
      language: normalized.metadata?.language
    },
    metadata: normalized.metadata ?? {},
    processingTime: performance.now() - startTime,
    stepsCompleted,
    errors: errors.length > 0 ? errors : undefined
  };
  
  return ok(result);
}
```

#### 5.2 Traitement batch parallèle (`src/pipeline/batch_processor.ts`)

**Objectif :** Analyser 100+ pages en parallèle avec contrôle concurrence

**API :**
```typescript
export async function analyzePagesBatch(
  pages: Array<{ id: string; html: string }>,
  opts?: AnalysisOptions & { concurrency?: number }
): Promise<Result<Map<string, AnalysisResult>>> {
  const concurrency = opts?.concurrency ?? 10;
  const results = new Map<string, AnalysisResult>();
  
  // Traitement par chunks parallèles
  for (let i = 0; i < pages.length; i += concurrency) {
    const chunk = pages.slice(i, i + concurrency);
    const promises = chunk.map(async ({ id, html }) => {
      const [err, result] = analyzePage(html, opts);
      if (!err) results.set(id, result);
      return { id, err, result };
    });
    
    await Promise.all(promises);
  }
  
  return ok(results);
}
```

#### 5.3 Formatters (`src/pipeline/formatters.ts`)

**Formats de sortie supportés :**

```typescript
// JSON (détaillé ou compact)
export function formatAsJson(result: AnalysisResult, pretty?: boolean): string;

// CSV (pour batch analysis)
export function formatAsCsv(results: Map<string, AnalysisResult>): string;

// Markdown (rapport lisible)
export function formatAsMarkdown(result: AnalysisResult): string;

// Texte (console-friendly)
export function formatAsText(result: AnalysisResult): string;

// Rapport comparatif
export function generateComparisonReport(
  results: Map<string, AnalysisResult>
): string;
```

**Exemple sortie Markdown :**
```markdown
# Analyse: pieceoccasion-1.html

## Classification
- **Type:** Page Produit ✓
- **Confiance:** 0.89
- **Score:** 7.8/10

### Raisons
✓ JSON-LD Product détecté
✓ Prix trouvé: 120.00 EUR
✓ Référence produit: 23572714
✓ Tableau de spécifications présent
⚠ Pas de bouton 'Ajouter au panier'

## Données Produit
- **Nom:** Compresseur air conditionné PEUGEOT 307
- **Prix:** 120.00 EUR (confiance: 0.95)
- **Référence:** 23572714
- **Marque:** PEUGEOT
- **Disponibilité:** En stock

## Statistiques
- Temps de traitement: 12.5ms
- Étapes complétées: 7/7
```

### 6. CLI

#### 6.1 Interface ligne de commande (`cli/analyze.ts`)

**Commandes principales :**

```bash
# Analyser un fichier
deno run -A cli/analyze.ts --file dataset/pieceoccasion-1.html --format json

# Analyser un dossier
deno run -A cli/analyze.ts --dir dataset/ --pattern "*.html" --format csv --out results.csv

# Classification seulement (plus rapide)
deno run -A cli/analyze.ts --dir dataset/ --classify-only --format json

# Extraction seulement (pour pages déjà identifiées comme produits)
deno run -A cli/analyze.ts --dir dataset/ --extract-only --format json

# Avec options avancées
deno run -A cli/analyze.ts \
  --dir dataset/ \
  --format json \
  --out results.json \
  --concurrency 20 \
  --threshold 5.5 \
  --tfidf \
  --top-terms 30

# Génération rapport métriques (avec ground truth)
deno run -A cli/analyze.ts \
  --dir dataset/ \
  --ground-truth labels.json \
  --metrics-report
```

**Options disponibles :**
```typescript
interface CliOptions {
  // Input
  file?: string;
  dir?: string;
  pattern?: string;
  
  // Output
  out?: string;
  format: 'json' | 'csv' | 'markdown' | 'text';
  pretty?: boolean;
  
  // Processing
  concurrency?: number;
  classifyOnly?: boolean;
  extractOnly?: boolean;
  skipClassification?: boolean;
  
  // Classification
  threshold?: number;
  structuralWeight?: number;
  textualWeight?: number;
  semanticWeight?: number;
  
  // Extraction
  enableJsonLd?: boolean;
  enableMicrodata?: boolean;
  enableOpenGraph?: boolean;
  enablePatterns?: boolean;
  
  // Text analysis
  tfidf?: boolean;
  topTerms?: number;
  
  // Evaluation
  groundTruth?: string;
  metricsReport?: boolean;
  
  // Debug
  verbose?: boolean;
  includeFeatures?: boolean;
  includeEvidence?: boolean;
}
```

---

## Roadmap et jalons

### Sprint 0 : Préparation (1 jour)

**Objectifs :**
- ✅ Validation plan final
- ✅ Setup dépendances (linkedom)
- ✅ Création structure de dossiers
- ✅ Types de base

**Livrables :**
- `src/html/parser_types.ts`
- `src/extraction/extraction_types.ts`
- `src/classification/classification_types.ts`
- `src/pipeline/analyzer_types.ts`
- `deno.json` avec dépendances

**Critères de succès :**
- [ ] Projet compile sans erreurs
- [ ] linkedom importable
- [ ] Types validés

---

### Sprint 1 : Parsing & Extraction de base (3 jours)

**Objectifs :**
- ✅ Parser DOM + linkedom wrapper
- ✅ Extraction JSON-LD, microdata, Open Graph
- ✅ Patterns regex (prix, référence)
- ✅ Normalisation unités (SI, ISO 4217)
- ✅ Tests sur dataset

**Livrables :**
- `src/html/parser.ts`
- `src/html/dom_utils.ts`
- `src/extraction/schema_parser.ts`
- `src/extraction/pattern_matcher.ts`
- `src/extraction/normalizer.ts`
- `src/extraction/patterns.ts`
- Tests unitaires (≥20 tests)

**Critères de succès :**
- [ ] Prix extrait et normalisé sur 3/3 pages produit (±0.01)
- [ ] Référence extraite sur 3/3 pages produit (exact-match)
- [ ] JSON-LD détecté correctement (100%)
- [ ] Normalisation EUR/USD/GBP fonctionnelle
- [ ] Normalisation kg/g/mm/cm fonctionnelle
- [ ] 0 erreur sur pages non-produit

---

### Sprint 2 : Classification complète (3 jours)

**Objectifs :**
- ✅ Feature engineering (structural, textual, semantic)
- ✅ Content extractor (densité, nav removal)
- ✅ Classificateur basé sur règles
- ✅ Système de scoring détaillé
- ✅ Génération raisons explicatives
- ✅ Tests de classification

**Livrables :**
- `src/html/content_extractor.ts`
- `src/classification/features.ts`
- `src/classification/rule_classifier.ts`
- `src/classification/scoring.ts`
- `src/text/stopwords_fr.ts`
- Tests unitaires (≥25 tests)

**Critères de succès :**
- [ ] F1 ≥ 0.90 sur dataset (6 fichiers)
- [ ] Précision ≥ 0.88
- [ ] Rappel ≥ 0.92
- [ ] Confiance moyenne ≥ 0.75
- [ ] Aucun faux négatif sur pages produit (rappel 100%)
- [ ] Raisons explicatives générées pour toutes les pages

---

### Sprint 3 : Pipeline & CLI (2 jours)

**Objectifs :**
- ✅ Pipeline unifié
- ✅ Extraction multi-source complète (context, semantic)
- ✅ Fusion avec résolution conflits
- ✅ Batch processor parallèle
- ✅ Formatters (JSON, CSV, Markdown, texte)
- ✅ CLI complet
- ✅ Documentation utilisateur

**Livrables :**
- `src/extraction/context_extractor.ts`
- `src/extraction/semantic_extractor.ts`
- `src/extraction/fusion.ts`
- `src/extraction/product_extractor.ts` (orchestration)
- `src/pipeline/analyzer.ts`
- `src/pipeline/batch_processor.ts`
- `src/pipeline/formatters.ts`
- `cli/analyze.ts`
- `cli/commands.ts`
- `documentations/USER_GUIDE.md`
- Tests d'intégration (≥10 tests)

**Critères de succès :**
- [ ] Pipeline fonctionne sur tout le dataset (6/6)
- [ ] Batch 100 pages < 5s (target: 50+ pages/s)
- [ ] CLI produit JSON/CSV/Markdown valides
- [ ] Evidence tracking complet pour toutes extractions
- [ ] Fusion résout correctement les conflits
- [ ] Documentation utilisateur complète

---

### Sprint 4 : Amélioration & Production (3-5 jours, optionnel)

**Objectifs :**
- ✅ Extraction avancée (dimensions 3D, capacités électriques)
- ✅ Calibration seuils (AUPRC, F1)
- ✅ Classificateur ML (régression logistique)
- ✅ Benchmarks et métriques détaillées
- ✅ Optimisation performance
- ✅ Extension multi-langues (EN, ES)
- ✅ Documentation complète

**Livrables :**
- `src/classification/ml_classifier.ts`
- `src/classification/calibration.ts`
- `tests/benchmarks/classification_metrics.ts`
- `tests/benchmarks/extraction_precision.ts`
- `tools/dataset_annotator.ts`
- `tools/metrics_reporter.ts`
- `documentations/CLASSIFICATION_GUIDE.md`
- `documentations/EXTRACTION_GUIDE.md`
- `documentations/PATTERNS_REFERENCE.md`

**Critères de succès :**
- [ ] F1 ≥ 0.95 avec ML
- [ ] AUPRC ≥ 0.92
- [ ] Extraction dimensions 3D ≥ 90%
- [ ] Extraction poids ≥ 90%
- [ ] Throughput ≥ 50 pages/s
- [ ] Mémoire < 500MB stable
- [ ] Documentation technique complète

---

## Risques et mitigations

### Risque 1 : HTML hétérogène / anti-scraping

**Impact :** Échec parsing ou extraction incomplète  
**Probabilité :** Haute  
**Mitigations :**
- ✅ Privilégier JSON-LD (standard structuré)
- ✅ Tolérance aux erreurs DOM (try/catch)
- ✅ Fallback sur patterns regex si DOM échoue
- ✅ Content extractor pour isoler contenu principal
- ✅ Tests sur HTML réels variés

### Risque 2 : Formats prix/unités variés

**Impact :** Extraction incorrecte ou normalisation échouée  
**Probabilité :** Moyenne  
**Mitigations :**
- ✅ Bibliothèque exhaustive de patterns FR/EN
- ✅ Normalisation stricte avec validation
- ✅ Tests unitaires par format (EUR, USD, GBP, kg, g, cm, mm)
- ✅ Evidence tracking pour debug
- ✅ Logging des échecs de normalisation

### Risque 3 : Performance DOM parsing

**Impact :** Latence > 50ms par page  
**Probabilité :** Moyenne  
**Mitigations :**
- ✅ linkedom (léger, performant)
- ✅ Parse sélectif (limiter profondeur DOM)
- ✅ Batch processing parallèle (concurrence: 10-20)
- ✅ Cache normalisation unités
- ✅ Profiling régulier (Deno.bench)

### Risque 4 : Qualité dataset / annotations

**Impact :** Métriques peu fiables, seuils mal calibrés  
**Probabilité :** Moyenne  
**Mitigations :**
- ✅ Annotations multi-personnes avec accord inter-annotateurs
- ✅ Validation set séparé du test set
- ✅ Mise à jour continue du dataset
- ✅ Équilibrage classes (50/50 produit/non-produit)
- ✅ Revue manuelle des erreurs de classification

### Risque 5 : Faux positifs (pages non-produit classées produit)

**Impact :** Dégradation confiance utilisateurs  
**Probabilité :** Faible  
**Mitigations :**
- ✅ Seuil conservateur (favoriser précision > rappel)
- ✅ Poids élevé pour features structurelles (JSON-LD)
- ✅ Validation multi-critères (prix + référence + images)
- ✅ Score de confiance explicite dans résultat

### Risque 6 : Régression lors des évolutions

**Impact :** Baisse métriques après changement code  
**Probabilité :** Moyenne  
**Mitigations :**
- ✅ Suite de tests complète (≥100 tests)
- ✅ Tests d'intégration sur dataset complet
- ✅ CI/CD avec gate sur métriques minimales
- ✅ Benchmarks automatiques avant/après

---

## Livrables

### Code

```
src/
├── html/
│   ├── parser.ts
│   ├── content_extractor.ts
│   ├── dom_utils.ts
│   ├── parser_types.ts
│   └── parser_test.ts
│
├── extraction/
│   ├── product_extractor.ts      # Orchestration
│   ├── schema_parser.ts           # JSON-LD, microdata, OG
│   ├── pattern_matcher.ts         # Regex patterns
│   ├── semantic_extractor.ts      # Tables, listes
│   ├── context_extractor.ts       # Proximité textuelle
│   ├── normalizer.ts              # SI, ISO 4217
│   ├── fusion.ts                  # Multi-source merge
│   ├── patterns.ts                # Bibliothèque patterns
│   ├── extraction_types.ts
│   └── extraction_test.ts
│
├── classification/
│   ├── features.ts                # Feature engineering
│   ├── rule_classifier.ts         # Règles pondérées
│   ├── scoring.ts                 # Scoring détaillé
│   ├── ml_classifier.ts           # ML (Sprint 4)
│   ├── calibration.ts             # Calibration seuils
│   ├── classification_types.ts
│   └── classification_test.ts
│
├── pipeline/
│   ├── analyzer.ts                # Pipeline principal
│   ├── batch_processor.ts         # Parallélisation
│   ├── formatters.ts              # JSON, CSV, Markdown
│   ├── reporters.ts               # Rapports métriques
│   ├── analyzer_types.ts
│   └── analyzer_test.ts
│
├── cli/
│   ├── analyze.ts                 # CLI principal
│   ├── commands.ts                # Sous-commandes
│   ├── config.ts
│   └── output.ts
│
└── text/ (amélioré)
    ├── tokenize.ts                # + digits, n-grams
    └── stopwords_fr.ts            # Nouveau
```

### Tests

```
tests/
├── integration/
│   ├── full_pipeline_test.ts      # Pipeline bout-en-bout
│   ├── dataset_analysis_test.ts   # Test sur dataset complet
│   └── regression_test.ts         # Non-régression
│
└── benchmarks/
    ├── classification_metrics.ts  # Métriques classification
    ├── extraction_precision.ts    # Métriques extraction
    └── performance_bench.ts       # Benchmarks perf
```

### Documentation

```
documentations/
├── USER_GUIDE.md                  # Guide utilisateur CLI
├── API_REFERENCE.md               # Documentation API publique
│
├── classification/
│   ├── CLASSIFICATION_GUIDE.md    # Guide classification
│   ├── FEATURES_REFERENCE.md      # Détail features
│   └── CALIBRATION_GUIDE.md       # Calibration seuils
│
├── extraction/
│   ├── EXTRACTION_GUIDE.md        # Guide extraction
│   ├── PATTERNS_REFERENCE.md      # Catalogue patterns
│   ├── SCHEMA_SUPPORT.md          # Standards supportés
│   └── NORMALIZATION.md           # Normalisation unités
│
└── pipeline/
    ├── PIPELINE_GUIDE.md          # Architecture pipeline
    └── PERFORMANCE_TUNING.md      # Optimisation perf
```

### Outils

```
tools/
├── dataset_annotator.ts           # Annotation assistée
├── metrics_reporter.ts            # Génération rapports
├── calibration_tool.ts            # Calibration interactive
└── validation_dashboard.ts        # Dashboard métriques
```

### Datasets

```
dataset/
├── pieceoccasion-1.html          # ✅ Existant
├── pieceoccasion-2.html          # ✅ Existant
├── zero-motorcycles-1.html       # ✅ Existant
├── google-1.html                 # ✅ Existant
├── youtube-1.html                # ✅ Existant
├── vehiculeselectriques-forum-1.html # ✅ Existant
├── labels.json                   # NOUVEAU - Annotations
└── ground_truth.json             # NOUVEAU - Valeurs attendues
```

---

## Stack technique

### Runtime & Langage
- **Deno 1.x** avec TypeScript strict
- Modules natifs Deno (fs, path, testing)

### Parsing HTML
- **linkedom** - Parser DOM léger pour Deno
- Support sélecteurs CSS complets
- Extraction JSON-LD, microdata, Open Graph

### Tests
- **Deno test** natif
- **@std/assert** pour assertions
- **Deno.bench** pour benchmarks perf

### Formats de sortie
- **JSON** (structuré)
- **CSV** (batch analysis)
- **Markdown** (rapports lisibles)
- **Texte** (console)

### ML (Optionnel - Sprint 4)
- **Régression logistique from scratch** (préféré)
- Alternative: TensorFlow.js ou ml-regression

### Dépendances

```json
{
  "imports": {
    "@std/assert": "jsr:@std/assert@^1",
    "@std/path": "jsr:@std/path@^1",
    "@std/fs": "jsr:@std/fs@^1",
    "linkedom": "npm:linkedom@^0.16"
  }
}
```

---

## Commandes utiles

```bash
# Tests complets
deno test --allow-read

# Tests avec couverture
deno test --allow-read --coverage=coverage/

# Tests d'un module spécifique
deno test --allow-read src/extraction/

# Benchmarks performance
deno bench --allow-read

# Analyse d'une page
deno run -A cli/analyze.ts --file dataset/pieceoccasion-1.html --format json

# Analyse batch du dataset
deno run -A cli/analyze.ts --dir dataset/ --format csv --out results.csv

# Classification uniquement (plus rapide)
deno run -A cli/analyze.ts --dir dataset/ --classify-only

# Génération rapport métriques
deno run -A cli/analyze.ts --dir dataset/ --ground-truth dataset/labels.json --metrics-report

# Calibration seuils
deno run -A tools/calibration_tool.ts --dataset dataset/ --labels dataset/labels.json

# Format code
deno fmt

# Lint code
deno lint
```

---

## Prochaines étapes immédiates

### 1. Validation du plan ✅
- [x] Relecture du plan final
- [ ] Feedback et ajustements
- [ ] Validation des priorités

### 2. Setup Sprint 0 (Jour 1)
- [ ] Créer structure de dossiers complète
- [ ] Ajouter linkedom dans `deno.json`
- [ ] Créer fichiers de types (`*_types.ts`)
- [ ] Valider compilation

### 3. Démarrage Sprint 1 (Jours 2-4)
- [ ] Implémenter `src/html/parser.ts` (wrapper linkedom)
- [ ] Implémenter `src/extraction/schema_parser.ts` (JSON-LD)
- [ ] Implémenter `src/extraction/patterns.ts` (regex prix EUR)
- [ ] Implémenter `src/extraction/normalizer.ts` (prix → centimes)
- [ ] Tests sur `pieceoccasion-1.html`

### 4. Validation continue
- [ ] Tests unitaires à chaque commit
- [ ] Validation métriques après chaque sprint
- [ ] Documentation à jour

---

## Annexes

### A. Exemples de données extraites attendues

**pieceoccasion-1.html (Sprint 1) :**
```json
{
  "name": "Compresseur air conditionné pour PEUGEOT 307",
  "reference": "23572714",
  "brand": "PEUGEOT",
  "price": {
    "amount": 12000,
    "currency": "EUR",
    "originalValue": "120.00 €",
    "confidence": 0.95
  },
  "condition": "used",
  "availability": "in_stock",
  "extractionMethods": ["jsonld", "opengraph", "pattern"],
  "confidence": 0.92
}
```

**pieceoccasion-1.html (Sprint 3, complet) :**
```json
{
  "name": "Compresseur air conditionné pour PEUGEOT 307",
  "reference": "23572714",
  "brand": "PEUGEOT",
  "model": "307",
  "category": "Pièces détachées",
  "price": {
    "amount": 12000,
    "currency": "EUR",
    "originalValue": "120.00 €",
    "confidence": 0.95
  },
  "weight": {
    "value": 2500,
    "unit": "g",
    "originalValue": "2.5 kg",
    "originalUnit": "kg"
  },
  "availability": "in_stock",
  "condition": "used",
  "images": [
    {
      "url": "https://example.com/product.jpg",
      "width": 800,
      "height": 600,
      "isPrimary": true
    }
  ],
  "extractionMethods": ["jsonld", "opengraph", "pattern", "context", "semantic"],
  "confidence": 0.92
}
```

**Résultat analyse complète :**
```json
{
  "classification": {
    "isProductPage": true,
    "confidence": 0.89,
    "score": 7.8,
    "reasons": [
      "✓ JSON-LD Product détecté",
      "✓ Prix trouvé: 120.00 EUR",
      "✓ Référence produit: 23572714",
      "✓ Tableau de spécifications présent",
      "✓ Images haute résolution: 3",
      "⚠ Pas de bouton 'Ajouter au panier'"
    ],
    "features": { "..." }
  },
  "productData": { "..." },
  "evidence": [
    {
      "field": "price",
      "value": { "amount": 12000, "currency": "EUR" },
      "source": "jsonld",
      "confidence": 0.95,
      "location": "script[type='application/ld+json']"
    },
    {
      "field": "reference",
      "value": "23572714",
      "source": "opengraph",
      "confidence": 0.90,
      "location": "meta[property='product:retailer_item_id']"
    }
  ],
  "textAnalysis": {
    "wordCount": 487,
    "topTerms": [["compresseur", 0.08], ["peugeot", 0.06], ...],
    "language": "fr"
  },
  "metadata": {
    "title": "Compresseur air conditionné PEUGEOT 307 - PieceOccasion.fr",
    "language": "fr"
  },
  "processingTime": 12.5,
  "stepsCompleted": ["parsing", "normalization", "features", "classification", "extraction", "tfidf"]
}
```

### B. Exemples de commandes CLI

```bash
# Analyse simple
deno run -A cli/analyze.ts --file dataset/pieceoccasion-1.html

# Batch avec rapport Markdown
deno run -A cli/analyze.ts --dir dataset/ --format markdown --out report.md

# Export CSV pour analyse Excel
deno run -A cli/analyze.ts --dir dataset/ --format csv --out results.csv

# Avec options classification personnalisées
deno run -A cli/analyze.ts \
  --dir dataset/ \
  --threshold 6.0 \
  --structural-weight 0.6 \
  --textual-weight 0.3 \
  --semantic-weight 0.1

# Mode debug complet
deno run -A cli/analyze.ts \
  --file dataset/pieceoccasion-1.html \
  --verbose \
  --include-features \
  --include-evidence \
  --format json \
  --pretty

# Évaluation avec ground truth
deno run -A cli/analyze.ts \
  --dir dataset/ \
  --ground-truth dataset/labels.json \
  --metrics-report \
  --out metrics.json
```

---

**Fin du plan de développement final**

*Version consolidée - Prêt pour implémentation*  
*Date: 4 octobre 2025*
