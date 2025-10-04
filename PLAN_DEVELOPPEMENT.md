# Plan de Développement - ThirdShop Text Analyzer
## Classification et Extraction de Données Produit

**Date :** 4 octobre 2025  
**Objectif :** Catégoriser les pages web (produit vs non-produit) et extraire des données structurées (référence, prix, poids, dimensions, etc.)

---

## 📊 Table des matières

1. [Analyse de l'existant](#1-analyse-de-lexistant)
2. [Architecture proposée](#2-architecture-proposée)
3. [Phase 1 : Extraction de données structurées](#phase-1--extraction-de-données-structurées)
4. [Phase 2 : Classification des pages](#phase-2--classification-des-pages)
5. [Phase 3 : Pipeline d'analyse complet](#phase-3--pipeline-danalyse-complet)
6. [Phase 4 : Amélioration et validation](#phase-4--amélioration-et-validation)
7. [Roadmap et priorités](#roadmap-et-priorités)
8. [Stack technique](#stack-technique)
9. [Métriques de succès](#métriques-de-succès)

---

## 1. Analyse de l'existant

### 1.1 Code existant - Points forts ✅

#### Architecture
- ✅ Gestion d'erreurs avec type `Result<T>` uniforme
- ✅ Code modulaire (src/text/, src/stats/, src/math/)
- ✅ 75 tests unitaires (100% de réussite)
- ✅ Documentation complète dans `/documentations`
- ✅ Respect des bonnes pratiques (typage, modularité)

#### Modules fonctionnels

**Normalisation HTML** (`src/text/normalize.ts`)
- 5 stratégies de normalisation :
  - `BASIC` : Suppression simple des balises
  - `CONTENT_ONLY` : Contenu visible uniquement
  - `STRUCTURE_AWARE` : Préserve la structure
  - `WITH_METADATA` : Extrait title, description, keywords, language
  - `AGGRESSIVE` : Nettoyage maximal
- Décodage des entités HTML
- Support Unicode complet

**Analyse textuelle**
- `TF` (Term Frequency) : Fréquence des termes
- `IDF` (Inverse Document Frequency) : Rareté des termes
- `TF-IDF` : Score de pertinence des termes
- Co-occurrence et PPMI (Pointwise Mutual Information)
- PCA et analyse factorielle

**Statistiques**
- Statistiques descriptives (moyenne, médiane, variance, etc.)
- Matrice de cooccurrence avec pondération par distance

### 1.2 Dataset disponible

```
dataset/
├── pieceoccasion-1.html     # Page produit e-commerce (PEUGEOT 307)
├── pieceoccasion-2.html     # Page produit e-commerce
├── zero-motorcycles-1.html  # Page produit (moto électrique)
├── google-1.html            # Page non-produit (moteur de recherche)
├── youtube-1.html           # Page non-produit (plateforme vidéo)
└── vehiculeselectriques-forum-1.html  # Page non-produit (forum)
```

**Observations dataset :**
- ✅ Mix pages produit/non-produit (50/50)
- ✅ HTML réel avec métadonnées Schema.org et Open Graph détectées
- ✅ Présence de prix structurés : `<meta property="product:price:amount" content="120.00">`
- ✅ Patterns textuels identifiés : "Prix TTC", "Référence", "Livraison", etc.

### 1.3 Ce qui manque ❌

#### Extraction de données
- ❌ Pas de parser DOM structuré
- ❌ Pas d'extraction de métadonnées e-commerce (Schema.org, Open Graph, JSON-LD)
- ❌ Pas d'extraction de données produit (prix, référence, dimensions, poids)
- ❌ Seulement des regex basiques dans `tokenize.ts`

#### Classification
- ❌ Aucun système de classification automatique
- ❌ Pas de feature engineering pour ML
- ❌ Pas de scoring pour évaluer si une page est un produit
- ❌ Pas de détection de patterns e-commerce

#### Pipeline
- ❌ Pas d'orchestration des modules
- ❌ Pas de pipeline unifié extraction + classification

---

## 2. Architecture proposée

### 2.1 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                      HTML INPUT                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: NORMALISATION & PARSING                           │
│  - Normalisation HTML (WITH_METADATA)                        │
│  - Parsing DOM structuré                                     │
│  - Extraction métadonnées (Schema.org, Open Graph, JSON-LD) │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: FEATURE ENGINEERING                                │
│  - Features structurelles HTML                               │
│  - Features textuelles (TF-IDF, mots-clés)                  │
│  - Features sémantiques                                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 3: CLASSIFICATION                                     │
│  - Scoring multi-critères                                    │
│  - Décision: PRODUIT / NON-PRODUIT                          │
│  - Calcul de confiance                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├──────────► NON-PRODUIT → Résultat minimal
                       │
                       ▼ PRODUIT
┌─────────────────────────────────────────────────────────────┐
│  PHASE 4: EXTRACTION DONNÉES PRODUIT                         │
│  - Extraction multi-stratégie:                               │
│    * Structured data (Schema.org, Open Graph)                │
│    * HTML sémantique (classes CSS)                           │
│    * Patterns regex (prix, référence, dimensions)            │
│    * Context-aware (proximité textuelle)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  RÉSULTAT ENRICHI                                            │
│  - Classification + confiance                                │
│  - Données produit structurées                               │
│  - Analyse textuelle (top termes, keyphrases)               │
│  - Métadonnées                                               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Organisation des modules

```
src/
├── html/                        # NOUVEAU - Parsing HTML
│   ├── parser.ts               # Parser DOM
│   ├── parser_types.ts         # Types (ProductData, etc.)
│   └── parser_test.ts
│
├── extraction/                  # NOUVEAU - Extraction données produit
│   ├── product_extractor.ts   # Orchestration extraction
│   ├── schema_parser.ts        # Schema.org, Open Graph, JSON-LD
│   ├── pattern_matcher.ts      # Regex patterns (prix, ref, etc.)
│   ├── semantic_extractor.ts   # Extraction context-aware
│   ├── patterns.ts             # Bibliothèque de patterns
│   ├── extraction_types.ts
│   └── extraction_test.ts
│
├── classification/              # NOUVEAU - Classification pages
│   ├── features.ts             # Feature engineering
│   ├── rule_classifier.ts      # Classificateur basé sur règles
│   ├── scoring.ts              # Système de scoring
│   ├── ml_classifier.ts        # Classificateur ML (optionnel)
│   ├── classification_types.ts
│   └── classification_test.ts
│
├── pipeline/                    # NOUVEAU - Pipeline unifié
│   ├── analyzer.ts             # Pipeline principal
│   ├── analyzer_types.ts
│   └── analyzer_test.ts
│
├── text/                        # EXISTANT - Modules texte
│   ├── normalize.ts            # ✅ Déjà implémenté
│   ├── tokenize.ts             # ✅ Déjà implémenté
│   ├── tf.ts, idf.ts, tfidf.ts # ✅ Déjà implémenté
│   └── cooccurrence.ts         # ✅ Déjà implémenté
│
├── stats/                       # EXISTANT - Statistiques
│   └── ...                     # ✅ Déjà implémenté
│
└── types/
    └── result.ts               # ✅ Déjà implémenté
```

---

## Phase 1 : Extraction de données structurées

### Objectif
Extraire les données produit de manière ciblée et robuste à partir de HTML.

### 1.1 Parser HTML structuré

#### Fichier : `src/html/parser.ts`

**Fonctionnalités :**
- Parser DOM natif (DOMParser API ou linkedom pour Deno)
- Support sélecteurs CSS (`querySelector`, `querySelectorAll`)
- Extraction de texte avec gestion des espaces
- Navigation dans l'arbre DOM
- Extraction d'attributs

**API publique :**
```typescript
export interface DOMNode {
  tagName: string;
  textContent: string;
  attributes: Record<string, string>;
  children: DOMNode[];
}

export interface ParseOptions {
  removeScripts?: boolean;
  removeStyles?: boolean;
  preserveWhitespace?: boolean;
}

/**
 * Parse HTML en structure DOM
 */
export function parseHtml(
  html: string,
  options?: ParseOptions
): Result<DOMNode>;

/**
 * Sélectionne éléments par sélecteur CSS
 */
export function querySelector(
  root: DOMNode,
  selector: string
): Result<DOMNode | null>;

/**
 * Sélectionne tous les éléments correspondants
 */
export function querySelectorAll(
  root: DOMNode,
  selector: string
): Result<DOMNode[]>;

/**
 * Extrait texte d'un nœud
 */
export function getTextContent(node: DOMNode): string;

/**
 * Obtient un attribut
 */
export function getAttribute(
  node: DOMNode,
  name: string
): string | undefined;
```

**Exemple d'utilisation :**
```typescript
const [err, dom] = parseHtml(html);
if (err) return fail(err);

const [selectErr, priceNode] = querySelector(dom, '[itemprop="price"]');
if (!selectErr && priceNode) {
  const price = getTextContent(priceNode);
  console.log("Prix:", price);
}
```

#### Fichier : `src/html/parser_types.ts`

```typescript
export interface DOMNode {
  tagName: string;
  textContent: string;
  attributes: Record<string, string>;
  children: DOMNode[];
}

export interface ParseOptions {
  removeScripts?: boolean;
  removeStyles?: boolean;
  preserveWhitespace?: boolean;
}
```

#### Tests : `src/html/parser_test.ts`

**Cas de test :**
- Parsing HTML basique
- Sélecteurs CSS simples et complexes
- Extraction d'attributs
- Gestion des entités HTML
- HTML malformé
- Cas limites (nœuds vides, attributs multiples)

### 1.2 Extraction de métadonnées structurées

#### Fichier : `src/extraction/schema_parser.ts`

**Standards supportés :**

**1. Schema.org (Microdata)**
```html
<div itemscope itemtype="https://schema.org/Product">
  <span itemprop="name">Compresseur air conditionné</span>
  <span itemprop="price">120.00</span>
  <span itemprop="priceCurrency">EUR</span>
  <span itemprop="sku">23572714</span>
</div>
```

**2. Open Graph**
```html
<meta property="og:type" content="product">
<meta property="product:price:amount" content="120.00">
<meta property="product:price:currency" content="EUR">
<meta property="og:title" content="Compresseur air conditionné">
```

**3. JSON-LD**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "Compresseur air conditionné",
  "offers": {
    "@type": "Offer",
    "price": "120.00",
    "priceCurrency": "EUR"
  }
}
</script>
```

**API publique :**
```typescript
export interface StructuredData {
  type: 'schema.org' | 'opengraph' | 'jsonld' | 'unknown';
  confidence: number;
  data: Record<string, any>;
}

/**
 * Extrait toutes les métadonnées structurées
 */
export function extractStructuredData(
  html: string
): Result<StructuredData[]>;

/**
 * Extrait données Schema.org Microdata
 */
export function extractSchemaMicrodata(
  html: string
): Result<Record<string, any>>;

/**
 * Extrait données Open Graph
 */
export function extractOpenGraph(
  html: string
): Result<Record<string, any>>;

/**
 * Extrait données JSON-LD
 */
export function extractJsonLd(
  html: string
): Result<Array<Record<string, any>>>;

/**
 * Normalise les données extraites en ProductData
 */
export function normalizeToProductData(
  structured: StructuredData[]
): Result<ProductData>;
```

#### Fichier : `src/extraction/pattern_matcher.ts`

**Patterns à détecter :**

```typescript
export const PATTERNS = {
  // Prix
  PRICE_EUR: /(\d+[.,]\d{2})\s*€/g,
  PRICE_LABELED: /prix[\s:]*(\d+[.,]\d{2})/gi,
  PRICE_CURRENCY: /(\d+[.,]\d{2})\s*(EUR|USD|GBP|CHF)/gi,
  
  // Référence / SKU
  REFERENCE: /réf(?:érence)?[\s:]*([A-Z0-9-]+)/gi,
  SKU: /SKU[\s:]*([A-Z0-9-]+)/gi,
  EAN: /EAN[\s:]*(\d{13})/gi,
  
  // Poids
  WEIGHT_KG: /(\d+[.,]?\d*)\s*kg/gi,
  WEIGHT_G: /(\d+)\s*g(?:rammes?)?/gi,
  WEIGHT_LABELED: /poids[\s:]*(\d+[.,]?\d*)\s*(kg|g)/gi,
  
  // Dimensions
  DIMENSIONS: /(\d+)\s*x\s*(\d+)\s*x\s*(\d+)\s*(cm|mm)/gi,
  DIMENSION_LABELED: /dimensions?[\s:]*(\d+)\s*x\s*(\d+)(?:\s*x\s*(\d+))?\s*(cm|mm)/gi,
  
  // Taille
  SIZE: /taille[\s:]*([XSMLXL0-9]+)/gi,
  
  // Stock / Disponibilité
  IN_STOCK: /en\s+stock/gi,
  OUT_OF_STOCK: /(?:rupture|indisponible)/gi,
  STOCK_QUANTITY: /(\d+)\s+(?:en|disponible)/gi,
};

export interface PatternMatch {
  pattern: string;
  value: string;
  position: number;
  confidence: number;
}

/**
 * Recherche tous les patterns dans le texte
 */
export function findPatterns(
  text: string,
  patterns: Record<string, RegExp>
): Result<Record<string, PatternMatch[]>>;

/**
 * Extrait le prix le plus probable
 */
export function extractPrice(text: string): Result<{
  amount: number;
  currency: string;
  confidence: number;
} | null>;

/**
 * Extrait la référence produit
 */
export function extractReference(text: string): Result<string | null>;

/**
 * Extrait les dimensions
 */
export function extractDimensions(text: string): Result<{
  width?: number;
  height?: number;
  depth?: number;
  unit: string;
} | null>;

/**
 * Extrait le poids
 */
export function extractWeight(text: string): Result<{
  value: number;
  unit: string;
} | null>;
```

#### Fichier : `src/extraction/semantic_extractor.ts`

**Extraction context-aware :**

```typescript
/**
 * Recherche un élément de données en utilisant le contexte
 * Ex: trouve "120.00 €" près du mot "Prix"
 */
export function extractByContext(
  text: string,
  keywords: string[],
  pattern: RegExp,
  windowSize?: number
): Result<string[]>;

/**
 * Extrait données d'un tableau HTML
 * Ex: tableau de spécifications techniques
 */
export function extractFromTable(
  html: string,
  labelColumn?: number,
  valueColumn?: number
): Result<Record<string, string>>;

/**
 * Extrait liste de caractéristiques
 * Ex: <ul> ou <dl> avec specs produit
 */
export function extractFromList(
  html: string,
  listSelector: string
): Result<Record<string, string>>;
```

#### Fichier : `src/extraction/product_extractor.ts`

**Orchestrateur principal :**

```typescript
export interface ProductData {
  // Identifiants
  reference?: string;
  sku?: string;
  ean?: string;
  
  // Prix
  price?: {
    amount: number;
    currency: string;
    confidence: number;
  };
  
  // Informations produit
  name?: string;
  brand?: string;
  description?: string;
  category?: string;
  
  // Caractéristiques physiques
  weight?: {
    value: number;
    unit: string;
  };
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    unit: string;
  };
  size?: string;
  color?: string;
  
  // Disponibilité
  availability?: 'in_stock' | 'out_of_stock' | 'preorder' | 'unknown';
  stockQuantity?: number;
  
  // Autre
  warranty?: string;
  condition?: 'new' | 'used' | 'refurbished';
  
  // Métadonnées extraction
  extractionMethod: Array<'structured' | 'semantic' | 'pattern' | 'context'>;
  confidence: number;
}

export interface ExtractionOptions {
  enableStructured?: boolean;
  enablePatterns?: boolean;
  enableContext?: boolean;
  enableSemantic?: boolean;
}

/**
 * Extrait toutes les données produit disponibles
 * Combine toutes les stratégies d'extraction
 */
export function extractProductData(
  html: string,
  options?: ExtractionOptions
): Result<ProductData>;

/**
 * Fusionne plusieurs sources de données produit
 * avec résolution de conflits
 */
export function mergeProductData(
  sources: ProductData[]
): Result<ProductData>;
```

#### Fichier : `src/extraction/extraction_types.ts`

```typescript
export interface ProductData {
  // ... (types ci-dessus)
}

export interface ExtractionOptions {
  // ... (types ci-dessus)
}

export interface StructuredData {
  type: 'schema.org' | 'opengraph' | 'jsonld' | 'unknown';
  confidence: number;
  data: Record<string, any>;
}

export interface PatternMatch {
  pattern: string;
  value: string;
  position: number;
  confidence: number;
}

export type ExtractionMethod = 'structured' | 'semantic' | 'pattern' | 'context';
```

### Tests Phase 1

**Fichier : `src/extraction/extraction_test.ts`**

```typescript
import { assertEquals, assertExists } from "@std/assert";
import { extractProductData } from "./product_extractor.ts";

Deno.test("extractProductData - pieceoccasion-1.html", async () => {
  const html = await Deno.readTextFile("./dataset/pieceoccasion-1.html");
  const [err, data] = extractProductData(html);
  
  assertEquals(err, null);
  assertExists(data);
  
  // Vérifier extraction prix
  assertEquals(data.price?.amount, 120.00);
  assertEquals(data.price?.currency, "EUR");
  
  // Vérifier extraction nom
  assertExists(data.name);
  
  // Vérifier méthodes utilisées
  assertEquals(data.extractionMethod.includes('structured'), true);
});

Deno.test("extractProductData - page non-produit", async () => {
  const html = await Deno.readTextFile("./dataset/google-1.html");
  const [err, data] = extractProductData(html);
  
  assertEquals(err, null);
  // Page non-produit : très peu de données extraites
  assertEquals(data.price, undefined);
  assertEquals(data.reference, undefined);
});
```

---

## Phase 2 : Classification des pages

### Objectif
Déterminer automatiquement si une page HTML est une fiche produit ou non.

### 2.1 Feature Engineering

#### Fichier : `src/classification/features.ts`

**Types de features :**

```typescript
export interface PageFeatures {
  // Features structurelles HTML
  structural: {
    hasSchemaOrgProduct: boolean;
    hasOpenGraphProduct: boolean;
    hasJsonLdProduct: boolean;
    hasAddToCartForm: boolean;
    hasProductImages: boolean;
    hasRatings: boolean;
    imageCount: number;
    linkDensity: number;  // ratio liens/contenu
  };
  
  // Features textuelles
  textual: {
    wordCount: number;
    ecommerceKeywordFrequency: number;
    productKeywordFrequency: number;
    hasPrice: boolean;
    hasPriceLabel: boolean;
    hasReference: boolean;
    hasStock: boolean;
    hasShipping: boolean;
    hasWarranty: boolean;
    topTermsTfidf: Array<[string, number]>;
  };
  
  // Features sémantiques
  semantic: {
    hasSpecTable: boolean;
    hasFeatureList: boolean;
    hasProductDescription: boolean;
    hasProductTitle: boolean;
    contentStructureScore: number;
  };
  
  // Scores agrégés
  scores: {
    structuralScore: number;    // 0-10
    textualScore: number;       // 0-10
    semanticScore: number;      // 0-10
    overallScore: number;       // 0-10
  };
}

/**
 * Extrait toutes les features d'une page
 */
export function extractFeatures(
  html: string,
  normalized?: NormalizedContent
): Result<PageFeatures>;

/**
 * Calcule le score structurel
 */
export function calculateStructuralScore(
  structural: PageFeatures['structural']
): number;

/**
 * Calcule le score textuel
 */
export function calculateTextualScore(
  textual: PageFeatures['textual']
): number;

/**
 * Calcule le score sémantique
 */
export function calculateSemanticScore(
  semantic: PageFeatures['semantic']
): number;

/**
 * Liste des mots-clés e-commerce
 */
export const ECOMMERCE_KEYWORDS = [
  'prix', 'price', 'acheter', 'buy', 'panier', 'cart',
  'ajouter', 'add', 'commander', 'order', 'livraison',
  'shipping', 'stock', 'disponible', 'available',
  'garantie', 'warranty', 'retour', 'return'
];

/**
 * Liste des mots-clés produit
 */
export const PRODUCT_KEYWORDS = [
  'référence', 'ref', 'sku', 'ean', 'modèle', 'model',
  'marque', 'brand', 'dimensions', 'poids', 'weight',
  'taille', 'size', 'couleur', 'color', 'caractéristiques',
  'specifications', 'specs', 'description'
];
```

### 2.2 Classificateur basé sur règles

#### Fichier : `src/classification/rule_classifier.ts`

```typescript
export interface ClassificationResult {
  isProductPage: boolean;
  confidence: number;  // 0-1
  score: number;       // 0-10
  reasons: string[];
  features: PageFeatures;
}

export interface ClassifierRules {
  structuralWeight: number;
  textualWeight: number;
  semanticWeight: number;
  threshold: number;  // seuil de décision
}

const DEFAULT_RULES: ClassifierRules = {
  structuralWeight: 0.5,
  textualWeight: 0.3,
  semanticWeight: 0.2,
  threshold: 5.0  // sur 10
};

/**
 * Classifie une page avec règles
 */
export function classifyPage(
  html: string,
  rules?: Partial<ClassifierRules>
): Result<ClassificationResult>;

/**
 * Calcule le score global pondéré
 */
export function calculateWeightedScore(
  features: PageFeatures,
  rules: ClassifierRules
): number;

/**
 * Génère les raisons de la classification
 */
export function generateReasons(
  features: PageFeatures,
  isProductPage: boolean
): string[];

/**
 * Calcule la confiance de la classification
 */
export function calculateConfidence(
  score: number,
  threshold: number
): number;
```

**Exemple de règles :**
```typescript
// Score = (Structural * 0.5) + (Textual * 0.3) + (Semantic * 0.2)
// Si Score >= 5.0 → PRODUIT, sinon NON-PRODUIT

// Confiance:
// Score 0-2: très peu confiant (0.0-0.3)
// Score 2-4: peu confiant (0.3-0.5)
// Score 4-6: moyennement confiant (0.5-0.7)
// Score 6-8: confiant (0.7-0.9)
// Score 8-10: très confiant (0.9-1.0)
```

### 2.3 Système de scoring détaillé

#### Fichier : `src/classification/scoring.ts`

```typescript
export interface DetailedScore {
  category: string;
  criteria: string;
  score: number;
  weight: number;
  contribution: number;
  explanation: string;
}

/**
 * Calcule un scoring détaillé avec explications
 */
export function calculateDetailedScoring(
  features: PageFeatures
): Result<{
  details: DetailedScore[];
  totalScore: number;
  breakdown: {
    structural: number;
    textual: number;
    semantic: number;
  };
}>;

/**
 * Génère un rapport de scoring lisible
 */
export function generateScoringReport(
  detailedScore: ReturnType<typeof calculateDetailedScoring>[1]
): string;
```

**Exemple de scoring détaillé :**
```
STRUCTURAL (5.0/10):
  - Schema.org Product: +3.0 (trouvé)
  - Open Graph Product: +2.0 (trouvé)
  - Add to Cart form: +0.0 (non trouvé)
  
TEXTUAL (7.0/10):
  - Prix détecté: +2.5 (oui)
  - Référence détectée: +1.5 (oui)
  - Mots-clés e-commerce: +2.0 (8/15 trouvés)
  - Stock mentionné: +1.0 (oui)
  
SEMANTIC (6.0/10):
  - Tableau specs: +2.0 (trouvé)
  - Liste features: +2.0 (trouvé)
  - Description produit: +2.0 (trouvé)

SCORE FINAL: 5.9/10 → PRODUIT (confiance: 0.78)
```

### 2.4 Classificateur ML (Optionnel)

#### Fichier : `src/classification/ml_classifier.ts`

**Pour aller plus loin (Sprint 4) :**

```typescript
export interface TrainingExample {
  features: PageFeatures;
  label: 'product' | 'non_product';
}

export interface MLModel {
  type: 'logistic_regression' | 'svm' | 'random_forest';
  weights: number[];
  bias: number;
  featureNames: string[];
}

/**
 * Entraîne un modèle ML sur des exemples
 */
export function trainModel(
  examples: TrainingExample[],
  modelType?: MLModel['type']
): Result<MLModel>;

/**
 * Prédit la classe d'une nouvelle page
 */
export function predict(
  model: MLModel,
  features: PageFeatures
): Result<ClassificationResult>;

/**
 * Validation croisée
 */
export function crossValidate(
  examples: TrainingExample[],
  folds?: number
): Result<{
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
}>;
```

### Tests Phase 2

**Fichier : `src/classification/classification_test.ts`**

```typescript
Deno.test("classifyPage - pieceoccasion-1.html (produit)", async () => {
  const html = await Deno.readTextFile("./dataset/pieceoccasion-1.html");
  const [err, result] = classifyPage(html);
  
  assertEquals(err, null);
  assertEquals(result.isProductPage, true);
  assert(result.confidence > 0.7);
  assert(result.score > 5.0);
});

Deno.test("classifyPage - google-1.html (non-produit)", async () => {
  const html = await Deno.readTextFile("./dataset/google-1.html");
  const [err, result] = classifyPage(html);
  
  assertEquals(err, null);
  assertEquals(result.isProductPage, false);
  assert(result.score < 5.0);
});

Deno.test("feature extraction - structural", async () => {
  const html = await Deno.readTextFile("./dataset/pieceoccasion-1.html");
  const [err, features] = extractFeatures(html);
  
  assertEquals(features.structural.hasOpenGraphProduct, true);
  assertEquals(features.structural.hasSchemaOrgProduct, true);
});
```

---

## Phase 3 : Pipeline d'analyse complet

### Objectif
Orchestrer tous les modules dans un pipeline unifié et simple d'utilisation.

### 3.1 Pipeline principal

#### Fichier : `src/pipeline/analyzer.ts`

```typescript
export interface AnalysisOptions {
  // Options de normalisation
  normalizationStrategy?: NormalizationStrategy;
  
  // Options d'extraction
  extractionOptions?: ExtractionOptions;
  
  // Options de classification
  classifierRules?: Partial<ClassifierRules>;
  
  // Analyse textuelle
  computeTfidf?: boolean;
  topTermsCount?: number;
  
  // Performance
  skipClassification?: boolean;  // force extraction même si non-produit
}

export interface AnalysisResult {
  // Classification
  classification: {
    isProductPage: boolean;
    confidence: number;
    score: number;
    reasons: string[];
  };
  
  // Données produit (si page produit)
  productData?: ProductData;
  
  // Analyse textuelle
  textAnalysis: {
    wordCount: number;
    topTerms: Array<[string, number]>;
    keyPhrases: string[];
    language?: string;
  };
  
  // Métadonnées
  metadata: {
    title?: string;
    description?: string;
    keywords?: string[];
    language?: string;
  };
  
  // Features (pour debug)
  features?: PageFeatures;
  
  // Statistiques du traitement
  processingTime: number;
  stepsCompleted: string[];
}

/**
 * Analyse complète d'une page HTML
 * Point d'entrée principal du pipeline
 */
export function analyzePage(
  html: string,
  options?: AnalysisOptions
): Result<AnalysisResult>;

/**
 * Analyse batch de plusieurs pages
 */
export function analyzePages(
  htmlPages: Array<{ id: string; html: string; }>,
  options?: AnalysisOptions
): Result<Map<string, AnalysisResult>>;

/**
 * Analyse un fichier HTML
 */
export async function analyzeFile(
  filepath: string,
  options?: AnalysisOptions
): Promise<Result<AnalysisResult>>;

/**
 * Analyse tous les fichiers d'un dossier
 */
export async function analyzeDirectory(
  dirpath: string,
  pattern?: string,
  options?: AnalysisOptions
): Promise<Result<Map<string, AnalysisResult>>>;
```

**Implémentation du pipeline :**

```typescript
export function analyzePage(
  html: string,
  options: AnalysisOptions = {}
): Result<AnalysisResult> {
  const startTime = performance.now();
  const stepsCompleted: string[] = [];
  
  try {
    // ÉTAPE 1: Normalisation
    const [normErr, normalized] = normalizeHtml(html, {
      strategy: options.normalizationStrategy ?? NormalizationStrategy.WITH_METADATA
    });
    if (normErr) return fail(normErr);
    stepsCompleted.push('normalization');
    
    // ÉTAPE 2: Extraction de features
    const [featErr, features] = extractFeatures(html, normalized);
    if (featErr) return fail(featErr);
    stepsCompleted.push('feature_extraction');
    
    // ÉTAPE 3: Classification
    let classification: ClassificationResult;
    if (!options.skipClassification) {
      const [classErr, classResult] = classifyPage(html, options.classifierRules);
      if (classErr) return fail(classErr);
      classification = classResult;
      stepsCompleted.push('classification');
    }
    
    // ÉTAPE 4: Extraction données produit (si page produit)
    let productData: ProductData | undefined;
    if (options.skipClassification || classification.isProductPage) {
      const [extractErr, extracted] = extractProductData(html, options.extractionOptions);
      if (extractErr) {
        // Non-bloquant: continuer sans données produit
        console.warn('Product extraction failed:', extractErr.message);
      } else {
        productData = extracted;
        stepsCompleted.push('product_extraction');
      }
    }
    
    // ÉTAPE 5: Analyse textuelle TF-IDF
    let topTerms: Array<[string, number]> = [];
    if (options.computeTfidf ?? true) {
      const [tfErr, tf] = termFrequency(normalized.text, { asRelative: true });
      if (!tfErr) {
        topTerms = Object.entries(tf)
          .sort((a, b) => b[1] - a[1])
          .slice(0, options.topTermsCount ?? 20);
        stepsCompleted.push('tfidf_analysis');
      }
    }
    
    // ÉTAPE 6: Assemblage du résultat
    const result: AnalysisResult = {
      classification: {
        isProductPage: classification?.isProductPage ?? false,
        confidence: classification?.confidence ?? 0,
        score: classification?.score ?? 0,
        reasons: classification?.reasons ?? []
      },
      productData,
      textAnalysis: {
        wordCount: normalized.text.split(/\s+/).length,
        topTerms,
        keyPhrases: [],
        language: normalized.metadata?.language
      },
      metadata: normalized.metadata ?? {},
      features: options.includeFeatures ? features : undefined,
      processingTime: performance.now() - startTime,
      stepsCompleted
    };
    
    return ok(result);
    
  } catch (error) {
    return fail(error);
  }
}
```

### 3.2 Utilitaires de formatage

#### Fichier : `src/pipeline/formatters.ts`

```typescript
/**
 * Formate un résultat d'analyse en JSON lisible
 */
export function formatAsJson(
  result: AnalysisResult,
  pretty?: boolean
): string;

/**
 * Formate un résultat d'analyse en texte
 */
export function formatAsText(result: AnalysisResult): string;

/**
 * Formate en Markdown
 */
export function formatAsMarkdown(result: AnalysisResult): string;

/**
 * Formate en CSV (pour analyse batch)
 */
export function formatAsCsv(
  results: Map<string, AnalysisResult>
): string;

/**
 * Génère un rapport comparatif
 */
export function generateComparisonReport(
  results: Map<string, AnalysisResult>
): string;
```

### Tests Phase 3

**Fichier : `src/pipeline/analyzer_test.ts`**

```typescript
Deno.test("analyzePage - full pipeline", async () => {
  const html = await Deno.readTextFile("./dataset/pieceoccasion-1.html");
  const [err, result] = analyzePage(html);
  
  assertEquals(err, null);
  assertExists(result);
  
  // Vérifier toutes les étapes
  assertEquals(result.stepsCompleted.includes('normalization'), true);
  assertEquals(result.stepsCompleted.includes('classification'), true);
  assertEquals(result.stepsCompleted.includes('product_extraction'), true);
  
  // Vérifier classification
  assertEquals(result.classification.isProductPage, true);
  
  // Vérifier extraction
  assertExists(result.productData);
  assertEquals(result.productData.price?.amount, 120.00);
  
  // Vérifier analyse textuelle
  assert(result.textAnalysis.topTerms.length > 0);
});

Deno.test("analyzeDirectory - batch analysis", async () => {
  const [err, results] = await analyzeDirectory("./dataset", "*.html");
  
  assertEquals(err, null);
  assertEquals(results.size, 6);  // 6 fichiers HTML
  
  // Vérifier mix produit/non-produit
  let productPages = 0;
  let nonProductPages = 0;
  
  for (const [id, result] of results) {
    if (result.classification.isProductPage) {
      productPages++;
    } else {
      nonProductPages++;
    }
  }
  
  assert(productPages >= 2);  // Au moins 2 pages produit
  assert(nonProductPages >= 2);  // Au moins 2 pages non-produit
});
```

---

## Phase 4 : Amélioration et validation

### Objectif
Valider, mesurer et améliorer les performances du système.

### 4.1 Métriques et benchmarks

#### Fichier : `tests/benchmarks/classification_accuracy.ts`

```typescript
export interface ClassificationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  truePositives: number;
  trueNegatives: number;
  falsePositives: number;
  falseNegatives: number;
}

export interface LabeledExample {
  filepath: string;
  actualLabel: 'product' | 'non_product';
  predictedLabel?: 'product' | 'non_product';
  confidence?: number;
}

/**
 * Calcule les métriques de classification
 */
export function calculateMetrics(
  examples: LabeledExample[]
): ClassificationMetrics;

/**
 * Génère une matrice de confusion
 */
export function generateConfusionMatrix(
  examples: LabeledExample[]
): {
  matrix: number[][];
  labels: string[];
  visualization: string;
};

/**
 * Benchmark complet sur le dataset
 */
export async function benchmarkClassification(
  datasetPath: string,
  labels: Map<string, 'product' | 'non_product'>
): Promise<Result<ClassificationMetrics>>;
```

#### Fichier : `tests/benchmarks/extraction_precision.ts`

```typescript
export interface ExtractionMetrics {
  priceAccuracy: number;
  referenceAccuracy: number;
  overallPrecision: number;
  coverage: number;  // % de champs remplis
  errorRate: number;
}

export interface GroundTruth {
  filepath: string;
  expectedData: Partial<ProductData>;
}

/**
 * Compare données extraites vs ground truth
 */
export function compareExtraction(
  extracted: ProductData,
  expected: Partial<ProductData>
): {
  matches: string[];
  mismatches: string[];
  missing: string[];
  score: number;
};

/**
 * Benchmark extraction sur dataset
 */
export async function benchmarkExtraction(
  datasetPath: string,
  groundTruths: GroundTruth[]
): Promise<Result<ExtractionMetrics>>;
```

### 4.2 Outils d'analyse

#### Fichier : `tools/dataset_analyzer.ts`

```typescript
/**
 * Analyse complète du dataset
 * Génère un rapport détaillé
 */
export async function analyzeDataset(
  datasetPath: string,
  outputPath?: string
): Promise<void>;

/**
 * Exemple de sortie :
 * 
 * DATASET ANALYSIS REPORT
 * =======================
 * 
 * Total files: 6
 * Product pages: 3 (50%)
 * Non-product pages: 3 (50%)
 * 
 * CLASSIFICATION PERFORMANCE:
 * - Accuracy: 100%
 * - Confidence avg: 0.85
 * 
 * EXTRACTION PERFORMANCE:
 * - Price extracted: 3/3 (100%)
 * - Reference extracted: 2/3 (67%)
 * - Dimensions extracted: 0/3 (0%)
 * 
 * TOP EXTRACTED DATA:
 * 1. pieceoccasion-1.html: 8/12 fields (67%)
 * 2. zero-motorcycles-1.html: 6/12 fields (50%)
 * ...
 */
```

#### Fichier : `tools/validation_report.ts`

```typescript
/**
 * Génère un rapport de validation interactif
 */
export async function generateValidationReport(
  results: Map<string, AnalysisResult>,
  groundTruths?: Map<string, GroundTruth>
): Promise<string>;

/**
 * Compare deux analyses (avant/après amélioration)
 */
export function compareAnalyses(
  before: Map<string, AnalysisResult>,
  after: Map<string, AnalysisResult>
): {
  improvements: string[];
  regressions: string[];
  unchanged: string[];
  summary: string;
};
```

### 4.3 Documentation

#### `documentations/classification/CLASSIFICATION_GUIDE.md`

**Contenu :**
- Introduction à la classification
- Architecture du classificateur
- Features engineering expliqué
- Guide de tuning des règles
- Exemples d'utilisation
- FAQ et troubleshooting

#### `documentations/classification/FEATURES_REFERENCE.md`

**Contenu :**
- Liste complète des features
- Explication de chaque feature
- Impact sur le scoring
- Exemples de valeurs typiques

#### `documentations/extraction/EXTRACTION_GUIDE.md`

**Contenu :**
- Stratégies d'extraction
- Formats supportés (Schema.org, Open Graph, JSON-LD)
- Patterns regex disponibles
- Guide d'extension pour nouveaux formats
- Résolution de problèmes

#### `documentations/extraction/PATTERNS_REFERENCE.md`

**Contenu :**
- Catalogue complet des patterns
- Regex expliqués
- Exemples de matching
- Guide d'ajout de nouveaux patterns

---

## Roadmap et priorités

### Sprint 1 : Extraction de base (2-3 jours)

**Objectifs :**
- ✅ Parser HTML structuré
- ✅ Extraction Schema.org, Open Graph, JSON-LD
- ✅ Patterns regex (prix, référence)
- ✅ Tests sur dataset

**Livrables :**
- `src/html/parser.ts`
- `src/extraction/schema_parser.ts`
- `src/extraction/pattern_matcher.ts`
- `src/extraction/product_extractor.ts`
- Tests unitaires

**Critères de succès :**
- [ ] Prix extrait correctement sur 3/3 pages produit
- [ ] Référence extraite sur 2/3 pages produit
- [ ] 0 erreur sur pages non-produit

---

### Sprint 2 : Classification simple (2-3 jours)

**Objectifs :**
- ✅ Feature engineering
- ✅ Classificateur basé sur règles
- ✅ Système de scoring
- ✅ Tests de classification

**Livrables :**
- `src/classification/features.ts`
- `src/classification/rule_classifier.ts`
- `src/classification/scoring.ts`
- Tests unitaires

**Critères de succès :**
- [ ] Accuracy ≥ 90% sur dataset (6 fichiers)
- [ ] Confiance moyenne ≥ 0.7
- [ ] Aucun faux négatif sur pages produit

---

### Sprint 3 : Pipeline complet (2-3 jours)

**Objectifs :**
- ✅ Pipeline unifié
- ✅ Analyse batch
- ✅ Formatters (JSON, text, markdown)
- ✅ CLI / scripts d'analyse

**Livrables :**
- `src/pipeline/analyzer.ts`
- `src/pipeline/formatters.ts`
- `tools/dataset_analyzer.ts`
- Documentation utilisateur

**Critères de succès :**
- [ ] Pipeline fonctionne sur tout le dataset
- [ ] Analyse batch en < 5 secondes (6 fichiers)
- [ ] Rapport lisible et actionnable

---

### Sprint 4 : Amélioration & ML (optionnel, 3-5 jours)

**Objectifs :**
- ✅ Extraction avancée (dimensions, poids, specs)
- ✅ Classificateur ML
- ✅ Optimisation des features
- ✅ Documentation complète

**Livrables :**
- `src/extraction/semantic_extractor.ts`
- `src/classification/ml_classifier.ts`
- Benchmarks et métriques
- Documentation complète

**Critères de succès :**
- [ ] Accuracy ML ≥ 95%
- [ ] Extraction avancée fonctionnelle
- [ ] Documentation à jour

---

## Stack technique

### Runtime & Langage
- **Deno 1.x** avec TypeScript
- Modules natifs Deno (fs, path, etc.)

### Parsing HTML
- **Option 1 :** DOMParser natif (si disponible dans Deno)
- **Option 2 :** [linkedom](https://github.com/WebReflection/linkedom) - Parser DOM léger
- **Option 3 :** Parser regex custom (moins robuste)

### Tests
- **Framework :** Deno test natif
- **Assertions :** `@std/assert`

### ML (Optionnel - Sprint 4)
- **Option 1 :** Implémenter régression logistique from scratch
- **Option 2 :** [TensorFlow.js](https://www.tensorflow.org/js)
- **Option 3 :** [ml-regression](https://github.com/mljs/regression)

### Formats de sortie
- JSON
- Markdown
- CSV
- Texte formaté

---

## Métriques de succès

### Classification
| Métrique | Objectif Sprint 2 | Objectif Sprint 4 |
|----------|-------------------|-------------------|
| Accuracy | ≥ 90% | ≥ 95% |
| Précision | ≥ 85% | ≥ 90% |
| Rappel | ≥ 90% | ≥ 95% |
| F1-Score | ≥ 0.87 | ≥ 0.92 |
| Confiance moy. | ≥ 0.70 | ≥ 0.80 |

### Extraction
| Donnée | Objectif Sprint 1 | Objectif Sprint 4 |
|--------|-------------------|-------------------|
| Prix | 100% | 100% |
| Référence | 67% | 90% |
| Nom produit | 80% | 95% |
| Dimensions | 0% | 60% |
| Poids | 0% | 60% |
| Description | 50% | 80% |

### Performance
| Métrique | Objectif |
|----------|----------|
| Temps analyse 1 page | < 500ms |
| Temps batch 6 pages | < 5s |
| Temps batch 100 pages | < 30s |
| Mémoire max | < 500MB |

---

## Prochaines étapes immédiates

### 1. Validation du plan ✅
- [x] Relecture du plan
- [ ] Ajustements si nécessaire
- [ ] Validation des priorités

### 2. Préparation Sprint 1
- [ ] Créer la structure de dossiers
- [ ] Installer dépendances nécessaires (linkedom)
- [ ] Créer les fichiers de types
- [ ] Écrire les premiers tests

### 3. Démarrage développement
- [ ] Implémenter `src/html/parser.ts`
- [ ] Implémenter `src/extraction/schema_parser.ts`
- [ ] Tests sur `pieceoccasion-1.html`

---

## Annexes

### A. Exemples de données extraites attendues

**pieceoccasion-1.html :**
```json
{
  "name": "Compresseur air conditionné pour PEUGEOT 307",
  "reference": "23572714",
  "price": {
    "amount": 120.00,
    "currency": "EUR",
    "confidence": 0.95
  },
  "brand": "PEUGEOT",
  "condition": "used",
  "availability": "in_stock",
  "extractionMethod": ["structured", "pattern"],
  "confidence": 0.90
}
```

**zero-motorcycles-1.html :**
```json
{
  "name": "Zero Motorcycles SR/F",
  "brand": "Zero Motorcycles",
  "category": "Moto électrique",
  "description": "...",
  "extractionMethod": ["semantic", "context"],
  "confidence": 0.75
}
```

### B. Structure de fichiers complète finale

```
thirdshop-text-analyzer/
├── src/
│   ├── html/
│   │   ├── parser.ts
│   │   ├── parser_types.ts
│   │   └── parser_test.ts
│   ├── extraction/
│   │   ├── product_extractor.ts
│   │   ├── schema_parser.ts
│   │   ├── pattern_matcher.ts
│   │   ├── semantic_extractor.ts
│   │   ├── patterns.ts
│   │   ├── extraction_types.ts
│   │   └── extraction_test.ts
│   ├── classification/
│   │   ├── features.ts
│   │   ├── rule_classifier.ts
│   │   ├── scoring.ts
│   │   ├── ml_classifier.ts (optionnel)
│   │   ├── classification_types.ts
│   │   └── classification_test.ts
│   ├── pipeline/
│   │   ├── analyzer.ts
│   │   ├── formatters.ts
│   │   ├── analyzer_types.ts
│   │   └── analyzer_test.ts
│   ├── text/ (existant)
│   ├── stats/ (existant)
│   ├── math/ (existant)
│   └── types/ (existant)
│
├── tests/
│   ├── integration/
│   │   ├── full_pipeline_test.ts
│   │   └── dataset_analysis_test.ts
│   └── benchmarks/
│       ├── classification_accuracy.ts
│       └── extraction_precision.ts
│
├── tools/
│   ├── dataset_analyzer.ts
│   ├── classification_report.ts
│   └── validation_report.ts
│
├── documentations/
│   ├── classification/
│   │   ├── CLASSIFICATION_GUIDE.md
│   │   ├── FEATURES_REFERENCE.md
│   │   └── QUICKSTART.md
│   ├── extraction/
│   │   ├── EXTRACTION_GUIDE.md
│   │   ├── PATTERNS_REFERENCE.md
│   │   └── SCHEMA_SUPPORT.md
│   └── pipeline/
│       └── PIPELINE_GUIDE.md
│
├── dataset/ (existant)
├── examples/
│   ├── analyze_single_page.ts
│   ├── analyze_batch.ts
│   └── custom_classifier.ts
│
├── main.ts (à adapter)
├── deno.json
├── PLAN_DEVELOPPEMENT.md (ce fichier)
└── README.md
```

### C. Commandes utiles

```bash
# Tests
deno test --allow-read

# Tests avec couverture
deno test --allow-read --coverage=coverage/

# Analyse d'une page
deno run --allow-read tools/dataset_analyzer.ts dataset/pieceoccasion-1.html

# Analyse batch du dataset
deno run --allow-read tools/dataset_analyzer.ts dataset/

# Benchmark classification
deno run --allow-read tests/benchmarks/classification_accuracy.ts

# Générer rapport
deno run --allow-read --allow-write tools/validation_report.ts
```

---

**Fin du plan de développement**

*Document vivant : à mettre à jour au fur et à mesure de l'avancement du projet.*

