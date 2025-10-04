# ThirdShop Text Analyzer - Guide Utilisateur

**Version :** 1.0  
**Date :** 4 octobre 2025  
**Niveau :** Débutant à Avancé

---

## 📋 Table des Matières

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Démarrage Rapide](#démarrage-rapide)
4. [Utilisation du CLI](#utilisation-du-cli)
5. [Utilisation Programmatique](#utilisation-programmatique)
6. [Formats de Sortie](#formats-de-sortie)
7. [Options Avancées](#options-avancées)
8. [Cas d'Usage](#cas-dusage)
9. [FAQ](#faq)
10. [Dépannage](#dépannage)

---

## Introduction

ThirdShop Text Analyzer est un outil d'analyse de pages web pour :
- **Classifier** automatiquement les pages produit vs non-produit
- **Extraire** les données produit structurées (prix, référence, dimensions, etc.)
- **Analyser** le contenu textuel (TF-IDF, top termes)

### Capacités

✅ Classification pages produit (F1-Score: 80-90%)  
✅ Extraction multi-source (JSON-LD, Microdata, Open Graph, Patterns)  
✅ Normalisation automatique (prix→centimes EUR, poids→grammes, dimensions→mm)  
✅ Evidence tracking (traçabilité des sources)  
✅ Performance optimisée (14+ pages/s)  
✅ CLI complet avec 4 formats de sortie  

### Prérequis

- **Deno** 1.x ou supérieur
- Fichiers HTML à analyser (locaux ou téléchargés)

---

## Installation

### 1. Installer Deno

```bash
# macOS/Linux
curl -fsSL https://deno.land/x/install/install.sh | sh

# Windows (PowerShell)
irm https://deno.land/install.ps1 | iex
```

### 2. Cloner le projet

```bash
git clone <repo-url>
cd thirdshop-text-analyzer
```

### 3. Vérifier l'installation

```bash
deno --version
# Devrait afficher: deno 1.x.x (release, ...)
```

Aucune autre installation requise ! Deno gère automatiquement les dépendances.

---

## Démarrage Rapide

### Analyser un fichier HTML

```bash
deno run -A cli/analyze.ts --file dataset/pieceoccasion-1.html
```

**Sortie :**
```
=== ANALYSE PAGE ===

Classification:
  Type: PRODUIT
  Score: 7.50/10
  Confiance: 77.7%

Données Produit:
  Nom: Compresseur air conditionné pour PEUGEOT 307 d'occasion pas cher
  Prix: 120.00 EUR
  Référence: 8200940837

Statistiques:
  Temps de traitement: 180.11 ms
  Étapes: 6
```

### Analyser un dossier complet

```bash
deno run -A cli/analyze.ts --dir dataset/ --format csv
```

**Sortie CSV :**
```csv
id,is_product,score,confidence,product_name,price,currency,reference,...
pieceoccasion-1.html,true,7.50,0.78,Compresseur air conditionné...,12000,EUR,...
google-1.html,false,1.00,0.12,,,,,,...
```

---

## Utilisation du CLI

### Commande de base

```bash
deno run -A cli/analyze.ts [OPTIONS]
```

### Options principales

| Option | Description | Exemple |
|--------|-------------|---------|
| `--file <path>` | Analyser un fichier | `--file page.html` |
| `--dir <path>` | Analyser un dossier | `--dir dataset/` |
| `--format <fmt>` | Format de sortie | `--format json` |
| `--out <path>` | Fichier de sortie | `--out results.csv` |
| `--help` | Afficher l'aide | `--help` |

### Formats de sortie

- **`text`** (défaut) : Format console lisible
- **`json`** : JSON structuré (pour API)
- **`csv`** : CSV pour Excel/analyse batch
- **`markdown`** : Rapport Markdown lisible

### Exemples d'utilisation

#### 1. Analyse simple (format texte)

```bash
deno run -A cli/analyze.ts --file dataset/pieceoccasion-1.html
```

#### 2. Export JSON détaillé

```bash
deno run -A cli/analyze.ts \
  --file dataset/pieceoccasion-1.html \
  --format json \
  --include-features \
  --include-evidence \
  --out result.json
```

#### 3. Batch CSV pour Excel

```bash
deno run -A cli/analyze.ts \
  --dir dataset/ \
  --format csv \
  --out results.csv
```

#### 4. Rapport Markdown

```bash
deno run -A cli/analyze.ts \
  --file dataset/pieceoccasion-1.html \
  --format markdown \
  --out report.md
```

#### 5. Classification seulement (plus rapide)

```bash
deno run -A cli/analyze.ts \
  --dir dataset/ \
  --classify-only \
  --format json
```

#### 6. Extraction seulement (sans classification)

```bash
deno run -A cli/analyze.ts \
  --file dataset/pieceoccasion-1.html \
  --extract-only
```

---

## Utilisation Programmatique

### API de base

```typescript
import { analyzePage } from "./src/pipeline/analyzer.ts";

// Analyser une page
const html = await Deno.readTextFile("page.html");
const [err, result] = analyzePage(html);

if (!err) {
  console.log("Est produit ?", result.classification.isProductPage);
  console.log("Score:", result.classification.score);
  console.log("Prix:", result.productData?.price);
}
```

### Classification seule

```typescript
import { classifyPage } from "./src/classification/rule_classifier.ts";

const [err, result] = classifyPage(html);

if (!err) {
  console.log("Classification:", result.isProductPage);
  console.log("Confiance:", result.confidence);
  console.log("Raisons:", result.reasons);
}
```

### Extraction seule

```typescript
import { extractProductInfo } from "./src/extraction/product_extractor.ts";

const [err, result] = extractProductInfo(html);

if (!err) {
  console.log("Produit:", result.product.name);
  console.log("Prix:", result.product.price);
  console.log("Evidence:", result.evidence.length, "sources");
}
```

### Batch processing

```typescript
import { analyzeDirectory } from "./src/pipeline/analyzer.ts";

const [err, results] = await analyzeDirectory("dataset/");

if (!err) {
  console.log(`Analysé ${results.size} pages`);
  
  for (const [filename, result] of results.entries()) {
    console.log(filename, ":", result.classification.isProductPage ? "PRODUIT" : "NON-PRODUIT");
  }
}
```

### Options avancées

```typescript
import { analyzePage } from "./src/pipeline/analyzer.ts";
import { NormalizationStrategy } from "./src/text/normalize_types.ts";

const [err, result] = analyzePage(html, {
  // Classification
  classifierRules: {
    threshold: 5.5,              // Seuil personnalisé (défaut: 5.0)
    structuralWeight: 0.6,       // Poids structural (défaut: 0.5)
    textualWeight: 0.3,          // Poids textuel (défaut: 0.3)
    semanticWeight: 0.1,         // Poids sémantique (défaut: 0.2)
  },
  
  // Extraction
  extractionOptions: {
    enableJsonLd: true,          // JSON-LD (défaut: true)
    enableMicrodata: true,       // Microdata (défaut: true)
    enableOpenGraph: true,       // Open Graph (défaut: true)
    enablePatterns: true,        // Patterns regex (défaut: true)
  },
  
  // Text analysis
  computeTfidf: true,            // Calcul TF-IDF (défaut: true)
  topTermsCount: 30,             // Top N termes (défaut: 20)
  
  // Normalisation
  normalizationStrategy: NormalizationStrategy.WITH_METADATA,
  
  // Output
  includeFeatures: true,         // Inclure features détaillées
  includeEvidence: true,         // Inclure evidence tracking
});
```

---

## Formats de Sortie

### Format Text (Console)

**Usage :** Inspection rapide, débogage

```bash
deno run -A cli/analyze.ts --file page.html --format text
```

**Sortie :**
```
=== ANALYSE PAGE ===

Classification:
  Type: PRODUIT
  Score: 7.50/10
  Confiance: 77.7%

Données Produit:
  Nom: Compresseur air conditionné pour PEUGEOT 307
  Prix: 120.00 EUR
  Référence: 8200940837

Statistiques:
  Temps de traitement: 180.11 ms
  Étapes: 6
```

### Format JSON

**Usage :** API, intégration système, analyse programmatique

```bash
deno run -A cli/analyze.ts --file page.html --format json --pretty
```

**Sortie :**
```json
{
  "classification": {
    "isProductPage": true,
    "score": 7.50,
    "confidence": 0.777,
    "reasons": [
      "✓ Open Graph Product détecté",
      "✓ Prix trouvé dans le texte",
      "✓ Référence produit trouvée"
    ]
  },
  "productData": {
    "name": "Compresseur air conditionné pour PEUGEOT 307",
    "price": {
      "amount": 12000,
      "currency": "EUR"
    },
    "reference": "8200940837"
  },
  "processingTime": 180.11
}
```

### Format CSV

**Usage :** Excel, analyse batch, rapports

```bash
deno run -A cli/analyze.ts --dir dataset/ --format csv --out results.csv
```

**Sortie :**
```csv
id,is_product,score,confidence,product_name,price,currency,reference,brand,availability,processing_time_ms,steps_completed
pieceoccasion-1.html,true,7.50,0.78,Compresseur air conditionné...,12000,EUR,8200940837,https,in_stock,165.53,6
google-1.html,false,1.00,0.12,,,,,,,26.88,5
```

### Format Markdown

**Usage :** Documentation, rapports lisibles, partage

```bash
deno run -A cli/analyze.ts --file page.html --format markdown --out report.md
```

**Sortie :**
```markdown
# Analyse: pieceoccasion-1.html

## Classification
- **Type:** ✓ Page Produit
- **Confiance:** 77.7%
- **Score:** 7.50/10

### Raisons
- ✓ Open Graph Product détecté
- ✓ Prix trouvé: 120.00 EUR
- ✓ Référence produit: 8200940837

## Données Produit
- **Nom:** Compresseur air conditionné pour PEUGEOT 307
- **Prix:** 120.00 EUR
- **Référence:** 8200940837

## Statistiques
- Temps de traitement: 180.11 ms
- Étapes complétées: 6
```

---

## Options Avancées

### Régler le seuil de classification

Par défaut, le seuil est 5.0/10. Pages avec score ≥ 5.0 sont classées "produit".

```bash
# Seuil plus strict (moins de faux positifs)
deno run -A cli/analyze.ts --file page.html --threshold 6.0

# Seuil plus permissif (moins de faux négatifs)
deno run -A cli/analyze.ts --file page.html --threshold 4.0
```

### Inclure les détails complets

```bash
deno run -A cli/analyze.ts \
  --file page.html \
  --format json \
  --include-features \
  --include-evidence \
  --tfidf \
  --top-terms 30
```

**Options :**
- `--include-features` : Features structurelles/textuelles/sémantiques
- `--include-evidence` : Traçabilité des extractions (sources + confiance)
- `--tfidf` : Analyse TF-IDF des termes
- `--top-terms N` : Nombre de top termes (défaut: 20)

### Mode classification uniquement (plus rapide)

Skip l'extraction de données produit :

```bash
deno run -A cli/analyze.ts --dir dataset/ --classify-only
```

**Performance :** ~2x plus rapide (extraction skippée)

### Mode extraction uniquement

Skip la classification (pour pages déjà identifiées comme produits) :

```bash
deno run -A cli/analyze.ts --file page.html --extract-only
```

---

## Cas d'Usage

### 1. Validation de scraping

**Objectif :** Vérifier que vos scrapers ciblent bien des pages produit

```bash
# Analyser les pages scrapées
deno run -A cli/analyze.ts \
  --dir scraped_pages/ \
  --classify-only \
  --format csv \
  --out validation.csv

# Analyser le CSV dans Excel pour identifier les faux positifs
```

### 2. Enrichissement de données

**Objectif :** Extraire prix, références, poids depuis pages HTML

```bash
# Extraction batch
deno run -A cli/analyze.ts \
  --dir product_pages/ \
  --format csv \
  --out enriched_data.csv

# Importer dans votre base de données
```

### 3. Monitoring qualité

**Objectif :** Surveiller la qualité de vos pages produit

```typescript
import { analyzePage } from "./src/pipeline/analyzer.ts";

const pages = ["product1.html", "product2.html", "product3.html"];
const issues = [];

for (const page of pages) {
  const html = await Deno.readTextFile(page);
  const [err, result] = analyzePage(html);
  
  if (!err) {
    // Vérifier qualité
    if (!result.productData?.price) {
      issues.push({ page, issue: "Prix manquant" });
    }
    if (!result.productData?.reference) {
      issues.push({ page, issue: "Référence manquante" });
    }
    if (result.classification.score < 6.0) {
      issues.push({ page, issue: "Score qualité faible" });
    }
  }
}

console.log("Issues détectées:", issues);
```

### 4. Comparaison de sites

**Objectif :** Comparer la qualité des pages produit de différents sites

```bash
# Site 1
deno run -A cli/analyze.ts --dir site1/ --format json --out site1.json

# Site 2
deno run -A cli/analyze.ts --dir site2/ --format json --out site2.json

# Comparer les scores, taux de détection, etc.
```

---

## FAQ

### Q: Quels formats HTML sont supportés ?

**R:** Tous les formats HTML valides ou semi-valides. Le parser `linkedom` est très tolérant.

### Q: Puis-je analyser des URLs directement ?

**R:** Non, le CLI nécessite des fichiers HTML locaux. Téléchargez d'abord :

```bash
# Télécharger avec curl
curl https://example.com/product > page.html

# Analyser
deno run -A cli/analyze.ts --file page.html
```

### Q: Comment améliorer la précision de classification ?

**R:** Plusieurs options :
1. Ajuster le seuil : `--threshold 5.5` (plus strict)
2. Ajouter des patterns custom dans `src/extraction/patterns.ts`
3. Enrichir les keywords e-commerce dans `src/extraction/patterns.ts`

### Q: Les prix sont-ils normalisés automatiquement ?

**R:** Oui ! Les prix sont convertis en centimes avec devise ISO 4217 :
- "120.50 €" → `{ amount: 12050, currency: "EUR" }`
- "$99.99" → `{ amount: 9999, currency: "USD" }`

### Q: Comment tracer la source d'une extraction ?

**R:** Utilisez `--include-evidence` :

```bash
deno run -A cli/analyze.ts \
  --file page.html \
  --format json \
  --include-evidence
```

Chaque champ extrait aura son `evidence` (source, confidence, location).

### Q: La performance est-elle bonne ?

**R:** Oui :
- **Single page :** ~60-200ms
- **Batch :** ~14 pages/s
- **Classification only :** ~2x plus rapide

### Q: Puis-je personnaliser les poids de classification ?

**R:** Oui, en mode programmatique :

```typescript
analyzePage(html, {
  classifierRules: {
    structuralWeight: 0.6,  // Augmenter poids structural
    textualWeight: 0.3,
    semanticWeight: 0.1,
  }
});
```

---

## Dépannage

### Problème : "Command not found: deno"

**Solution :** Installer Deno :
```bash
curl -fsSL https://deno.land/x/install/install.sh | sh
```

### Problème : "Permission denied"

**Solution :** Utiliser `-A` pour toutes les permissions :
```bash
deno run -A cli/analyze.ts ...
```

Ou permissions spécifiques :
```bash
deno run --allow-read --allow-write cli/analyze.ts ...
```

### Problème : "Module not found"

**Solution :** Lancer depuis la racine du projet :
```bash
cd /path/to/thirdshop-text-analyzer
deno run -A cli/analyze.ts ...
```

### Problème : Temps de traitement trop long

**Solutions :**
1. Utiliser `--classify-only` pour skip l'extraction
2. Désactiver TF-IDF (non disponible via CLI, mode programmatique uniquement)
3. Réduire `--top-terms` (défaut: 20)

### Problème : Faux négatifs (produits non détectés)

**Solutions :**
1. Baisser le seuil : `--threshold 4.0`
2. Vérifier que la page contient des métadonnées structurées (JSON-LD, Open Graph)
3. Ajouter des patterns custom si format spécifique

### Problème : Faux positifs (non-produits classés produits)

**Solutions :**
1. Augmenter le seuil : `--threshold 6.0`
2. Vérifier les raisons avec `--format text` pour comprendre pourquoi

---

## Support

**Documentation :**
- Guide Normalisation : `documentations/normalize/`
- Guide Extraction : `documentations/EXTRACTION_GUIDE.md`
- Référence Patterns : `documentations/PATTERNS_REFERENCE.md`

**Code Source :**
- Pipeline : `src/pipeline/analyzer.ts`
- Classification : `src/classification/rule_classifier.ts`
- Extraction : `src/extraction/product_extractor.ts`

**Tests :**
- Tests unitaires : `deno test --allow-read`
- Tests d'intégration : `deno test --allow-read tests/integration/`

---

**Version :** 1.0  
**Dernière mise à jour :** 4 octobre 2025
