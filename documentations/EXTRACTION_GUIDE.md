# Extraction Guide - ThirdShop Text Analyzer

**Version:** 1.0  
**Date:** 4 octobre 2025  
**Niveau:** Avancé

---

## 📋 Table des Matières

1. [Introduction](#introduction)
2. [Architecture d'Extraction](#architecture-dextraction)
3. [Les 8 Sources d'Extraction](#les-8-sources-dextraction)
4. [Ordre de Priorité](#ordre-de-priorité)
5. [Extraction Multi-Source](#extraction-multi-source)
6. [Fusion et Résolution de Conflits](#fusion-et-résolution-de-conflits)
7. [Normalisation des Données](#normalisation-des-données)
8. [Evidence Tracking](#evidence-tracking)
9. [Exemples Pratiques](#exemples-pratiques)
10. [Best Practices](#best-practices)
11. [Dépannage](#dépannage)

---

## Introduction

Ce guide explique en détail le système d'extraction multi-source de ThirdShop Text Analyzer, qui combine **8 sources différentes** pour extraire les données produit avec une précision maximale.

### Capacités

- **8 sources d'extraction** complémentaires
- **Fusion intelligente** avec résolution de conflits
- **Normalisation automatique** (SI + ISO 4217)
- **Evidence tracking** complet
- **Confidence scoring** par source

### Architecture en Couches

```
┌─────────────────────────────────────────────┐
│  product_extractor.ts (Orchestration)       │
└──────────┬──────────────────────────────────┘
           │
     ┌─────┴──────┐
     │  Sources   │
     └─────┬──────┘
           │
    ┌──────┴──────────────────────────────────┐
    │  JSON-LD                                │
    │  Microdata                              │
    │  Open Graph                             │
    │  Pattern Matching                       │
    │  Context Extraction                     │
    │  Semantic Extraction                    │
    │  Content Extraction                     │
    │  Feature Engineering                    │
    └──────┬──────────────────────────────────┘
           │
     ┌─────┴──────┐
     │   Fusion   │
     └─────┬──────┘
           │
    ┌──────┴──────┐
    │ Normalizer  │
    └──────┬──────┘
           │
    ┌──────┴──────┐
    │   Output    │
    └─────────────┘
```

---

## Architecture d'Extraction

### Flux Principal

1. **Parse HTML** → DOM structuré
2. **Normalize HTML** → Texte nettoyé
3. **Extract Main Content** → Contenu principal isolé
4. **Multi-Source Extraction** → 8 sources en parallèle
5. **Fusion** → Résolution des conflits
6. **Normalization** → Unités standardisées
7. **Evidence Tracking** → Traçabilité complète

### Modules Clés

| Module | Rôle | Fichier |
|--------|------|---------|
| **Parser** | Parse HTML, extrait JSON-LD/OG/Microdata | `src/html/parser.ts` |
| **Schema Parser** | Extrait depuis métadonnées structurées | `src/extraction/schema_parser.ts` |
| **Pattern Matcher** | Extrait par regex (100+ patterns) | `src/extraction/pattern_matcher.ts` |
| **Context Extractor** | Extrait par proximité textuelle | `src/extraction/context_extractor.ts` |
| **Semantic Extractor** | Extrait depuis tables/listes HTML | `src/extraction/semantic_extractor.ts` |
| **Normalizer** | Normalise unités (SI + ISO 4217) | `src/extraction/normalizer.ts` |
| **Fusion** | Résout conflits multi-source | `src/extraction/fusion.ts` |
| **Product Extractor** | Orchestre tout | `src/extraction/product_extractor.ts` |

---

## Les 8 Sources d'Extraction

### 1. JSON-LD (Schema.org)

**Priorité:** 1.0 (la plus haute)  
**Format:** `<script type="application/ld+json">`

**Avantages:**
- ✅ Données structurées standardisées
- ✅ Très fiable (schéma strictement défini)
- ✅ Facile à parser (JSON valide)

**Champs supportés:**
```json
{
  "@type": "Product",
  "name": "...",
  "sku": "...",
  "brand": {...},
  "offers": {
    "price": "...",
    "priceCurrency": "...",
    "availability": "..."
  },
  "weight": {...},
  "image": "..."
}
```

**Exemple:**
```typescript
import { extractFromJsonLd } from "./src/extraction/schema_parser.ts";

const jsonLdData = {
  "@type": "Product",
  "name": "Compresseur air conditionné",
  "sku": "23572714",
  "offers": {
    "price": "120.00",
    "priceCurrency": "EUR"
  }
};

const [err, result] = extractFromJsonLd(jsonLdData);
// result.product.name === "Compresseur air conditionné"
// result.product.price.amount === 12000 (centimes)
```

### 2. Microdata (Schema.org)

**Priorité:** 0.8  
**Format:** Attributs HTML `itemscope`, `itemprop`, `itemtype`

**Avantages:**
- ✅ Données structurées intégrées dans HTML
- ✅ Assez fiable
- ✅ Standard W3C

**Exemple HTML:**
```html
<div itemscope itemtype="https://schema.org/Product">
  <span itemprop="name">Compresseur</span>
  <span itemprop="price">120.00</span>
  <span itemprop="priceCurrency">EUR</span>
</div>
```

**Extraction:**
```typescript
import { extractFromMicrodata } from "./src/extraction/schema_parser.ts";

const properties = {
  name: ["Compresseur"],
  price: ["120.00"],
  priceCurrency: ["EUR"]
};

const [err, result] = extractFromMicrodata(properties);
// result.product.name === "Compresseur"
```

### 3. Open Graph (Facebook)

**Priorité:** 0.6  
**Format:** Meta tags `<meta property="og:...">`

**Avantages:**
- ✅ Très répandu (Facebook, Twitter, etc.)
- ✅ Facile à parser
- ✅ Données de base disponibles

**Exemple HTML:**
```html
<meta property="og:type" content="product">
<meta property="product:price:amount" content="120.00">
<meta property="product:price:currency" content="EUR">
<meta property="product:retailer_item_id" content="23572714">
```

**Extraction:**
```typescript
import { extractFromOpenGraph } from "./src/extraction/schema_parser.ts";

const openGraph = {
  "og:type": "product",
  "product:price:amount": "120.00",
  "product:price:currency": "EUR",
  "product:retailer_item_id": "23572714"
};

const [err, result] = extractFromOpenGraph(openGraph);
// result.product.price.amount === 12000
```

### 4. Pattern Matching (Regex)

**Priorité:** 0.3  
**Patterns:** 100+ patterns FR/EN

**Avantages:**
- ✅ Fonctionne sur tout texte
- ✅ Très flexible
- ✅ Couvre formats variés

**Limitations:**
- ⚠️ Moins fiable (peut matcher faux positifs)
- ⚠️ Sensible au format texte

**Exemple:**
```typescript
import { extractPrice, extractReference } from "./src/extraction/pattern_matcher.ts";

const text = "Prix: 120.00 EUR, Référence: ABC123";

const [err1, price] = extractPrice(text);
// price.amount === 12000
// price.currency === "EUR"
// price.confidence === 0.7-0.9

const [err2, reference] = extractReference(text);
// reference === "ABC123"
```

### 5. Context Extraction (Proximité Textuelle)

**Priorité:** 0.5  
**Méthode:** Recherche par mots-clés + distance

**Avantages:**
- ✅ Gère texte non-structuré
- ✅ Confidence basée sur distance
- ✅ Robuste au bruit

**Exemple:**
```typescript
import { extractPriceByContext } from "./src/extraction/context_extractor.ts";

const text = "Le prix de vente est de 120.00 EUR pour ce produit.";

const [err, matches] = extractPriceByContext(text);
// matches[0].value === "120.00"
// matches[0].keyword === "prix"
// matches[0].distance === 5 tokens
// matches[0].confidence === 0.75
```

**Distance → Confidence:**
- 0-2 tokens: 0.9-1.0
- 3-5 tokens: 0.7-0.9
- 6-10 tokens: 0.4-0.7
- >10 tokens: 0.2-0.4

### 6. Semantic Extraction (Tables/Listes)

**Priorité:** 0.5  
**Sources:** `<table>`, `<dl>`, `<ul>`, `<ol>`

**Avantages:**
- ✅ Extrait depuis tableaux de specs
- ✅ Gère listes de caractéristiques
- ✅ Structure semi-structurée

**Exemple HTML:**
```html
<table>
  <tr><td>Poids</td><td>2.5 kg</td></tr>
  <tr><td>Dimensions</td><td>30 x 20 x 10 cm</td></tr>
</table>
```

**Extraction:**
```typescript
import { extractFromTable } from "./src/extraction/semantic_extractor.ts";

const [err, pairs] = extractFromTable(tableNode);
// pairs[0] = { key: "Poids", value: "2.5 kg", source: "table", confidence: 0.9 }
// pairs[1] = { key: "Dimensions", value: "30 x 20 x 10 cm", source: "table", confidence: 0.85 }
```

### 7. Content Extraction (Main Content)

**Priorité:** Support indirect  
**Méthode:** Heuristiques de densité

**Avantages:**
- ✅ Isole contenu principal
- ✅ Supprime nav/header/footer
- ✅ Améliore précision autres sources

### 8. Feature Engineering (Classification)

**Priorité:** Support indirect  
**Features:** 34 features (structural + textual + semantic)

**Avantages:**
- ✅ Aide à classifier pages
- ✅ Détecte patterns e-commerce
- ✅ Score de qualité page

---

## Ordre de Priorité

### Hiérarchie des Sources

```
1.0  JSON-LD          ████████████████████ (Priorité Max)
0.8  Microdata        ████████████████
0.6  Open Graph       ████████████
0.5  Context          ██████████
0.5  Semantic         ██████████
0.3  Pattern          ██████
```

### Règles de Priorité

1. **JSON-LD gagne toujours** (sauf si confiance très basse)
2. **Microdata > Open Graph** (plus structuré)
3. **Context ≈ Semantic** (dépend de la confiance)
4. **Pattern en dernier recours** (fallback)

### Exemple de Résolution

**Scénario:**
- JSON-LD: prix = 120.00 EUR (confiance: 0.95)
- Open Graph: prix = 120.50 EUR (confiance: 0.80)
- Pattern: prix = 119.99 EUR (confiance: 0.60)

**Résultat:**
```typescript
const fusedPrice = {
  value: 120.00,
  currency: "EUR",
  source: "jsonld",
  confidence: 0.95,
  hadConflict: true,
  resolution: "Selected jsonld (highest priority)"
};
```

---

## Extraction Multi-Source

### Orchestration

Le module `product_extractor.ts` orchestre toutes les sources :

```typescript
import { extractProductInfo } from "./src/extraction/product_extractor.ts";

const html = await Deno.readTextFile("page.html");

const [err, result] = extractProductInfo(html);

if (!err) {
  console.log("Product:", result.product.name);
  console.log("Confidence:", result.confidence);
  console.log("Sources:", result.product.extractionMethods);
  console.log("Evidence:", result.evidence.length, "items");
}
```

### Options d'Extraction

```typescript
const [err, result] = extractProductInfo(html, {
  enableJsonLd: true,      // Défaut: true
  enableMicrodata: true,   // Défaut: true
  enableOpenGraph: true,   // Défaut: true
  enablePatterns: true,    // Défaut: true
});
```

### Extraction Sélective

Pour désactiver certaines sources :

```typescript
// Seulement structured data (JSON-LD + Microdata + OG)
const [err, result] = extractProductInfo(html, {
  enablePatterns: false,
});

// Seulement JSON-LD (plus rapide)
const [err, result] = extractProductInfo(html, {
  enableMicrodata: false,
  enableOpenGraph: false,
  enablePatterns: false,
});
```

---

## Fusion et Résolution de Conflits

### Les 5 Stratégies

#### 1. Priority (Défaut)

Utilise la source avec la plus haute priorité.

```typescript
import { fuseCandidates } from "./src/extraction/fusion.ts";

const candidates = [
  { value: 120.00, source: "jsonld", confidence: 0.95 },
  { value: 120.50, source: "opengraph", confidence: 0.80 },
];

const [err, result] = fuseCandidates(candidates, { strategy: "priority" });
// result.value === 120.00 (jsonld wins)
```

#### 2. Confidence

Utilise la source avec la plus haute confiance.

```typescript
const candidates = [
  { value: 120.00, source: "pattern", confidence: 0.60 },
  { value: 120.50, source: "context", confidence: 0.85 },
];

const [err, result] = fuseCandidates(candidates, { strategy: "confidence" });
// result.value === 120.50 (context wins)
```

#### 3. Voting (Moyenne Pondérée)

Fait une moyenne pondérée des valeurs similaires.

```typescript
const candidates = [
  { value: 120.00, source: "jsonld", confidence: 0.95 },
  { value: 120.05, source: "opengraph", confidence: 0.80 },
  { value: 119.95, source: "pattern", confidence: 0.60 },
];

const [err, result] = fuseCandidates(candidates, { strategy: "voting" });
// result.value === 120.01 (weighted average)
// result.confidence === 0.88
```

#### 4. First

Utilise la première source disponible.

```typescript
const [err, result] = fuseCandidates(candidates, { strategy: "first" });
// result.value === candidates[0].value
```

#### 5. Consensus

Requiert accord entre N sources.

```typescript
const [err, result] = fuseCandidates(candidates, {
  strategy: "consensus",
  consensusCount: 2,  // Minimum 2 sources d'accord
});
```

### Tolérance Numérique

Pour les valeurs numériques, la fusion tolère des différences mineures (défaut: ±1%) :

```typescript
const [err, result] = fuseCandidates(candidates, {
  strategy: "voting",
  tolerance: 0.01,  // 1%
});
```

**Exemple:**
- 120.00 et 120.50 sont considérés "proches" (0.4% différence)
- 120.00 et 125.00 sont "différents" (4% différence)

---

## Normalisation des Données

### Prix → Centimes + ISO 4217

```typescript
import { normalizePrice } from "./src/extraction/normalizer.ts";

const [err, normalized] = normalizePrice("120.00 €");
// normalized = {
//   amount: 12000,
//   currency: "EUR",
//   originalValue: "120.00 €",
//   confidence: 0.9
// }
```

**Formats supportés:**
- `120.00 €` → 12000 EUR
- `$99.99` → 9999 USD
- `120,50 EUR` → 12050 EUR (virgule européenne)

### Poids → Grammes

```typescript
import { normalizeWeight } from "./src/extraction/normalizer.ts";

const [err, normalized] = normalizeWeight("2.5 kg", "kg");
// normalized = {
//   value: 2500,
//   unit: "g",
//   originalValue: "2.5",
//   originalUnit: "kg"
// }
```

**Unités supportées:**
- kg → g (× 1000)
- lb → g (× 454)
- oz → g (× 28.35)

### Dimensions → Millimètres

```typescript
import { normalizeDimension } from "./src/extraction/normalizer.ts";

const [err, normalized] = normalizeDimension("30 cm", "cm");
// normalized = 300 (mm)
```

**Unités supportées:**
- m → mm (× 1000)
- cm → mm (× 10)
- in → mm (× 25.4)

---

## Evidence Tracking

Chaque extraction enregistre sa source et confidence :

```typescript
export interface ExtractionEvidence {
  field: string;           // "price", "reference", etc.
  value: any;              // Valeur extraite
  source: ExtractionSource; // "jsonld", "pattern", etc.
  confidence: number;      // 0-1
  location?: string;       // XPath ou selector CSS
  rawText?: string;        // Texte original
}
```

### Exemple Complet

```typescript
const [err, result] = extractProductInfo(html, {
  includeEvidence: true,
});

if (!err) {
  for (const evidence of result.evidence) {
    console.log(`${evidence.field}:`);
    console.log(`  Value: ${JSON.stringify(evidence.value)}`);
    console.log(`  Source: ${evidence.source}`);
    console.log(`  Confidence: ${evidence.confidence}`);
  }
}
```

**Sortie:**
```
price:
  Value: {"amount":12000,"currency":"EUR"}
  Source: jsonld
  Confidence: 0.95

reference:
  Value: "23572714"
  Source: opengraph
  Confidence: 0.90
```

---

## Exemples Pratiques

### Exemple 1: Extraction Complète

```typescript
import { extractProductInfo } from "./src/extraction/product_extractor.ts";

const html = `
<script type="application/ld+json">
{
  "@type": "Product",
  "name": "Compresseur air conditionné",
  "sku": "23572714",
  "offers": {
    "price": "120.00",
    "priceCurrency": "EUR"
  }
}
</script>
<meta property="product:brand" content="PEUGEOT">
<p>Poids: 2.5 kg</p>
`;

const [err, result] = extractProductInfo(html);

console.log(result.product.name);        // "Compresseur air conditionné"
console.log(result.product.price.amount); // 12000
console.log(result.product.reference);   // "23572714"
console.log(result.product.brand);       // "PEUGEOT"
console.log(result.product.weight.value); // 2500
```

### Exemple 2: Context Extraction

```typescript
import { extractAllByContext } from "./src/extraction/context_extractor.ts";

const text = `
Le compresseur référence ABC123 est disponible.
Prix de vente: 120.00 EUR.
Poids net: 2.5 kg.
Dimensions: 30 x 20 x 10 cm.
`;

const [err, result] = extractAllByContext(text);

console.log(result.references[0].value);   // "ABC123"
console.log(result.prices[0].value);       // "120.00"
console.log(result.weights[0].value);      // "2.5 kg"
console.log(result.dimensions[0].value);   // "30 x 20 x 10 cm"
```

### Exemple 3: Semantic Extraction

```typescript
import { extractAllSemantic } from "./src/extraction/semantic_extractor.ts";
import { parseHtml } from "./src/html/parser.ts";

const html = `
<table>
  <tr><td>Référence</td><td>ABC123</td></tr>
  <tr><td>Poids</td><td>2.5 kg</td></tr>
  <tr><td>Dimensions</td><td>30 x 20 x 10 cm</td></tr>
</table>
`;

const [parseErr, parsed] = parseHtml(html);
const [err, pairs] = extractAllSemantic(parsed.document);

for (const pair of pairs) {
  console.log(`${pair.key}: ${pair.value} (${pair.source}, conf: ${pair.confidence})`);
}
// Référence: ABC123 (table, conf: 0.9)
// Poids: 2.5 kg (table, conf: 0.85)
// Dimensions: 30 x 20 x 10 cm (table, conf: 0.85)
```

---

## Best Practices

### 1. Toujours Utiliser product_extractor

❌ **Mauvais :**
```typescript
// Extraction manuelle depuis chaque source
const jsonLd = extractFromJsonLd(...);
const openGraph = extractFromOpenGraph(...);
// ... fusion manuelle
```

✅ **Bon :**
```typescript
// Orchestration automatique + fusion
const [err, result] = extractProductInfo(html);
```

### 2. Vérifier les Evidence

```typescript
const [err, result] = extractProductInfo(html);

if (!err && result.product.price) {
  // Vérifier confiance
  const priceEvidence = result.evidence.find(e => e.field === "price");
  
  if (priceEvidence.confidence < 0.7) {
    console.warn("Prix extrait avec faible confiance");
  }
}
```

### 3. Utiliser Fusion Voting pour Consensus

Pour des données critiques (prix, stock), utiliser voting :

```typescript
import { mergeProductData } from "./src/extraction/fusion.ts";

const sources = [
  { data: { price: { amount: 12000 } }, source: "jsonld", confidence: 0.95 },
  { data: { price: { amount: 12050 } }, source: "opengraph", confidence: 0.80 },
];

const [err, merged] = mergeProductData(sources, {
  strategy: "voting",
  tolerance: 0.01,
});
```

### 4. Logger les Conflits

```typescript
const [err, result] = extractProductInfo(html);

// Détecter conflits
const conflicts = result.evidence
  .reduce((acc, e) => {
    if (!acc[e.field]) acc[e.field] = [];
    acc[e.field].push(e);
    return acc;
  }, {});

for (const [field, evidences] of Object.entries(conflicts)) {
  if (evidences.length > 1) {
    console.log(`Conflict on ${field}: ${evidences.length} sources`);
  }
}
```

---

## Dépannage

### Problème: Extraction incomplète

**Symptôme :** Certains champs manquants

**Solutions :**
1. Vérifier que toutes les sources sont activées
2. Utiliser `includeEvidence: true` pour voir sources disponibles
3. Vérifier patterns dans `src/extraction/patterns.ts`

```typescript
const [err, result] = extractProductInfo(html, {
  enableJsonLd: true,
  enableMicrodata: true,
  enableOpenGraph: true,
  enablePatterns: true,
});

console.log("Sources utilisées:", result.product.extractionMethods);
```

### Problème: Valeurs incorrectes

**Symptôme :** Prix ou poids mal extrait

**Solutions :**
1. Vérifier normalisation
2. Examiner evidence pour trouver source
3. Ajuster patterns si nécessaire

```typescript
const priceEvidence = result.evidence.find(e => e.field === "price");
console.log("Source prix:", priceEvidence.source);
console.log("Raw text:", priceEvidence.rawText);
```

### Problème: Conflits non résolus

**Symptôme :** Fusion choisit mauvaise valeur

**Solutions :**
1. Changer stratégie de fusion
2. Ajuster poids des sources
3. Augmenter tolérance pour voting

```typescript
// Stratégie plus conservatrice
const [err, merged] = mergeProductData(sources, {
  strategy: "confidence",  // Au lieu de "priority"
});
```

---

**Version:** 1.0  
**Dernière mise à jour:** 4 octobre 2025  
**Documentation complète:** Voir aussi USER_GUIDE.md et PATTERNS_REFERENCE.md
