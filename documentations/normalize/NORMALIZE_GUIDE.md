# Guide de Normalisation HTML

Ce module fournit des fonctions robustes pour convertir du HTML en texte normalisé, avec plusieurs stratégies adaptées à différents cas d'usage.

## Table des matières

1. [Installation](#installation)
2. [Stratégies de normalisation](#stratégies-de-normalisation)
3. [Exemples d'utilisation](#exemples-dutilisation)
4. [API Reference](#api-reference)
5. [Cas d'usage recommandés](#cas-dusage-recommandés)
6. [Performance](#performance)

## Installation

Les fichiers sont déjà dans le projet :

```typescript
import { normalizeHtml, extractText } from "./src/text/normalize.ts";
import { NormalizationStrategy } from "./src/text/normalize_types.ts";
```

## Stratégies de normalisation

### 1. BASIC
Suppression simple des balises HTML.

**Quand l'utiliser :**
- Prototypage rapide
- HTML déjà propre sans scripts/styles
- Tests simples

**Exemple :**
```typescript
const [err, result] = normalizeHtml(html, {
  strategy: NormalizationStrategy.BASIC
});
```

### 2. CONTENT_ONLY (Recommandée par défaut)
Garde uniquement le contenu visible. Supprime :
- Scripts JavaScript
- Styles CSS
- Commentaires HTML
- Balises SVG
- Balises noscript

**Quand l'utiliser :**
- Usage général
- Extraction de contenu de pages web
- Prétraitement pour analyse textuelle
- Avec les fichiers du dataset

**Exemple :**
```typescript
const [err, result] = normalizeHtml(html, {
  strategy: NormalizationStrategy.CONTENT_ONLY
});
```

### 3. STRUCTURE_AWARE
Préserve la structure du document avec des sauts de ligne pour :
- Titres (h1-h6)
- Paragraphes (p)
- Listes (ul, ol, li)
- Divisions (div, section, article)
- Tableaux (table, tr, td)

**Quand l'utiliser :**
- Analyse de structure documentaire
- Extraction par sections
- Conservation de la hiérarchie du contenu

**Exemple :**
```typescript
const [err, result] = normalizeHtml(html, {
  strategy: NormalizationStrategy.STRUCTURE_AWARE,
  preserveLineBreaks: true
});
```

### 4. WITH_METADATA
Extrait le contenu ET les métadonnées :
- Titre (`<title>`)
- Description (`<meta name="description">`)
- Mots-clés (`<meta name="keywords">`)
- Langue (`<html lang="">`)

**Quand l'utiliser :**
- Analyse SEO
- Classification de documents
- Enrichissement contextuel
- Indexation de contenu

**Exemple :**
```typescript
const [err, result] = normalizeHtml(html, {
  strategy: NormalizationStrategy.WITH_METADATA
});

console.log(result.metadata?.title);
console.log(result.metadata?.description);
console.log(result.metadata?.keywords);
```

### 5. AGGRESSIVE
Nettoyage maximal pour obtenir uniquement du texte pur. Supprime :
- Tous les éléments non-visibles
- Caractères spéciaux non-textuels
- Garde uniquement lettres, chiffres, espaces et ponctuation de base

**Quand l'utiliser :**
- Analyse linguistique pure
- Comparaison de textes
- Maximum de nettoyage requis

**Exemple :**
```typescript
const [err, result] = normalizeHtml(html, {
  strategy: NormalizationStrategy.AGGRESSIVE
});
```

## Exemples d'utilisation

### Exemple simple : Extraction de texte

```typescript
import { extractText } from "./src/text/normalize.ts";

const html = "<p>Bonjour le <strong>monde</strong>!</p>";
const [err, text] = extractText(html);

if (err) {
  console.error("Erreur:", err.message);
} else {
  console.log(text); // "Bonjour le monde !"
}
```

### Exemple : Traitement de fichier du dataset

```typescript
import { normalizeHtml } from "./src/text/normalize.ts";
import { NormalizationStrategy } from "./src/text/normalize_types.ts";

// Lire le fichier HTML
const html = await Deno.readTextFile("dataset/pieceoccasion-1.html");

// Normaliser avec métadonnées
const [err, result] = normalizeHtml(html, {
  strategy: NormalizationStrategy.WITH_METADATA
});

if (err) {
  console.error("Erreur:", err.message);
  Deno.exit(1);
}

console.log("Titre:", result.metadata?.title);
console.log("Texte extrait:", result.text.substring(0, 500));
```

### Exemple : Comparaison de stratégies

```typescript
import { compareStrategies } from "./src/text/normalize.ts";

const html = await Deno.readTextFile("dataset/pieceoccasion-1.html");
const [err, results] = compareStrategies(html);

if (err) {
  console.error("Erreur:", err.message);
  Deno.exit(1);
}

for (const [strategy, text] of Object.entries(results)) {
  console.log(`${strategy}: ${text.length} caractères`);
}
```

### Exemple : Pipeline complet

```typescript
import { normalizeHtml } from "./src/text/normalize.ts";
import { tokenize } from "./src/text/tokenize.ts";
import { termFrequency } from "./src/text/tf.ts";
import { NormalizationStrategy } from "./src/text/normalize_types.ts";

// 1. Charger et normaliser
const html = await Deno.readTextFile("dataset/pieceoccasion-1.html");
const [normErr, normalized] = normalizeHtml(html, {
  strategy: NormalizationStrategy.CONTENT_ONLY
});

if (normErr) throw normErr;

// 2. Tokeniser
const [tokErr, tokens] = tokenize(normalized.text, {
  lowerCase: true,
  removeDigits: true,
  minTokenLength: 3
});

if (tokErr) throw tokErr;

// 3. Calculer les fréquences
const [tfErr, frequencies] = termFrequency(tokens, { relative: false });

if (tfErr) throw tfErr;

console.log("Analyse terminée!");
console.log("Tokens:", tokens.length);
console.log("Termes uniques:", Object.keys(frequencies).length);
```

## API Reference

### `normalizeHtml(html: string, options?: NormalizeOptions): Result<NormalizedContent>`

Fonction principale pour normaliser du HTML.

**Paramètres :**
- `html`: Le code HTML à normaliser
- `options`: Options de normalisation (optionnel)
  - `strategy`: Stratégie à utiliser (défaut: `CONTENT_ONLY`)
  - `decodeEntities`: Décoder les entités HTML (défaut: `true`)
  - `normalizeWhitespace`: Normaliser les espaces multiples (défaut: `true`)
  - `removeEmptyLines`: Supprimer les lignes vides (défaut: `true`)
  - `preserveLineBreaks`: Préserver les sauts de ligne (défaut: `false`)

**Retour :**
- `Result<NormalizedContent>`: Tuple `[Error, null] | [null, NormalizedContent]`

### `extractText(html: string, strategy?: NormalizationStrategy): Result<string>`

Helper pour extraire uniquement le texte sans métadonnées.

**Paramètres :**
- `html`: Le code HTML à normaliser
- `strategy`: Stratégie à utiliser (défaut: `CONTENT_ONLY`)

**Retour :**
- `Result<string>`: Tuple `[Error, null] | [null, string]`

### `compareStrategies(html: string): Result<Record<NormalizationStrategy, string>>`

Compare toutes les stratégies sur un même HTML.

**Paramètres :**
- `html`: Le code HTML à normaliser

**Retour :**
- `Result<Record<NormalizationStrategy, string>>`: Map stratégie → texte

## Cas d'usage recommandés

### Analyse de corpus e-commerce (fichiers dataset)

```typescript
// Recommandé: WITH_METADATA pour extraire titre/description produit
const [err, result] = normalizeHtml(html, {
  strategy: NormalizationStrategy.WITH_METADATA
});

// Utiliser metadata.title pour le nom du produit
// Utiliser metadata.description pour la description courte
// Utiliser result.text pour le contenu complet
```

### Analyse TF-IDF de plusieurs pages

```typescript
// Recommandé: CONTENT_ONLY pour un texte propre
const docs = [];
for (const file of htmlFiles) {
  const html = await Deno.readTextFile(file);
  const [err, result] = normalizeHtml(html, {
    strategy: NormalizationStrategy.CONTENT_ONLY
  });
  if (!err) docs.push(result.text);
}
```

### Extraction de sections spécifiques

```typescript
// Recommandé: STRUCTURE_AWARE pour préserver la hiérarchie
const [err, result] = normalizeHtml(html, {
  strategy: NormalizationStrategy.STRUCTURE_AWARE,
  preserveLineBreaks: true
});

// Analyser les lignes pour détecter les sections
const lines = result.text.split("\n");
```

### Comparaison de similarité textuelle

```typescript
// Recommandé: AGGRESSIVE pour maximum de nettoyage
const [err1, text1] = extractText(html1, NormalizationStrategy.AGGRESSIVE);
const [err2, text2] = extractText(html2, NormalizationStrategy.AGGRESSIVE);

// Comparer text1 et text2
```

## Performance

### Temps de traitement estimé

Sur un fichier HTML typique du dataset (~90K+ lignes) :

- **BASIC**: ~50ms
- **CONTENT_ONLY**: ~100ms (recommandée)
- **STRUCTURE_AWARE**: ~150ms
- **WITH_METADATA**: ~120ms
- **AGGRESSIVE**: ~80ms

### Recommandations

1. **Utiliser `CONTENT_ONLY` par défaut** : Bon compromis performance/qualité
2. **Mettre en cache** les résultats normalisés si possible
3. **Traiter en batch** pour les gros volumes
4. **Utiliser `extractText`** si les métadonnées ne sont pas nécessaires

## Gestion des erreurs

Toutes les fonctions retournent un `Result<T>` :

```typescript
const [err, result] = normalizeHtml(html);

if (err) {
  // Gérer l'erreur
  console.error("Erreur de normalisation:", err.message);
  return;
}

// Utiliser result
console.log(result.text);
```

## Support Unicode

Le module supporte pleinement Unicode :

```typescript
const html = "<p>Français: éàèùç</p><p>中文 日本語 العربية</p>";
const [err, result] = extractText(html);

// Tous les caractères Unicode sont préservés
console.log(result); // "Français: éàèùç 中文 日本語 العربية"
```

## Décodage des entités HTML

Entités supportées :
- **Nommées**: `&nbsp;`, `&amp;`, `&lt;`, `&gt;`, `&euro;`, etc.
- **Décimales**: `&#8364;` → €
- **Hexadécimales**: `&#x20AC;` → €

```typescript
const html = "<p>Prix: 100&euro; &ndash; Livraison&nbsp;gratuite</p>";
const [err, result] = extractText(html);

console.log(result); // "Prix: 100€ – Livraison gratuite"
```

## Tests

Lancer les tests :

```bash
deno test src/text/normalize_test.ts
```

30+ tests couvrent :
- Toutes les stratégies
- Décodage d'entités
- Gestion des erreurs
- Cas limites (HTML vide, malformé, etc.)
- Support Unicode

## Exemples complets

Voir le fichier `examples/normalize_example.ts` pour 8 exemples détaillés incluant :
1. Normalisation basique
2. Content-only
3. Structure-aware
4. With metadata
5. Aggressive
6. Comparaison de stratégies
7. Helper extractText
8. Pipeline complet d'analyse

Lancer les exemples :

```bash
deno run -A examples/normalize_example.ts
```

