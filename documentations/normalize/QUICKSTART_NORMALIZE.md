# Démarrage Rapide : Normalisation HTML

Guide ultra-rapide pour utiliser le module de normalisation HTML.

## ⚡ Installation (0 dépendance externe)

```typescript
import { normalizeHtml, extractText } from "./src/text/normalize.ts";
import { NormalizationStrategy } from "./src/text/normalize_types.ts";
```

## 🎯 Utilisation en 30 secondes

### Cas 1 : Extraction simple de texte

```typescript
const html = await Deno.readTextFile("dataset/pieceoccasion-1.html");
const [err, text] = extractText(html);

if (!err) {
  console.log(text);
}
```

### Cas 2 : Avec métadonnées (titre, description, keywords)

```typescript
const html = await Deno.readTextFile("dataset/pieceoccasion-1.html");

const [err, result] = normalizeHtml(html, {
  strategy: NormalizationStrategy.WITH_METADATA
});

if (!err) {
  console.log("Titre:", result.metadata?.title);
  console.log("Description:", result.metadata?.description);
  console.log("Texte:", result.text);
}
```

### Cas 3 : Pipeline complet (HTML → Tokens → TF-IDF)

```typescript
import { tokenize } from "./src/text/tokenize.ts";
import { tfidfFromDocs } from "./src/text/tfidf.ts";

// 1. Normaliser
const html = await Deno.readTextFile("dataset/pieceoccasion-1.html");
const [err1, result] = normalizeHtml(html);

// 2. Tokeniser
const [err2, tokens] = tokenize(result.text, {
  lowerCase: true,
  minTokenLength: 3
});

// 3. TF-IDF
const [err3, tfidf] = tfidfFromDocs([tokens]);

// 4. Top termes
const top10 = Object.entries(tfidf[0])
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

console.log("Top 10 termes:", top10);
```

## 📋 Les 5 stratégies expliquées en 1 ligne

| Stratégie | Usage |
|-----------|-------|
| `BASIC` | Simple suppression de balises |
| `CONTENT_ONLY` ⭐ | **Usage général (recommandé)** |
| `STRUCTURE_AWARE` | Garde la structure (titres, paragraphes) |
| `WITH_METADATA` | Extrait titre + description + keywords |
| `AGGRESSIVE` | Nettoyage maximal pour analyse pure |

## 🚀 Tester maintenant

```bash
# Démo rapide avec dataset
deno run -A demo_normalize.ts

# Pipeline complet HTML → TF-IDF
deno run -A integration_normalize.ts

# Tous les exemples
deno run -A examples/normalize_example.ts

# Tests unitaires
deno test src/text/normalize_test.ts
```

## 📖 Documentation complète

- **README**: `src/text/NORMALIZE_README.md`
- **Guide complet**: `src/text/NORMALIZE_GUIDE.md`
- **Code source**: `src/text/normalize.ts`
- **Types**: `src/text/normalize_types.ts`

## 💡 Exemple réel avec les fichiers dataset

```typescript
// Analyser les deux fichiers du dataset
const files = [
  "dataset/pieceoccasion-1.html",
  "dataset/pieceoccasion-2.html"
];

for (const file of files) {
  const html = await Deno.readTextFile(file);
  
  const [err, result] = normalizeHtml(html, {
    strategy: NormalizationStrategy.WITH_METADATA
  });
  
  if (!err) {
    console.log(`\nFichier: ${file}`);
    console.log(`Titre: ${result.metadata?.title}`);
    console.log(`Longueur: ${result.text.length} caractères`);
    
    // Compter les mots
    const mots = result.text.split(/\s+/).filter(m => m.length >= 3);
    console.log(`Mots: ${mots.length}`);
  }
}
```

## ✅ Bonnes pratiques respectées

- ✅ Gestion des erreurs avec `Result<T>`
- ✅ Modularité (petites fonctions)
- ✅ Types isolés dans fichiers dédiés
- ✅ Tests unitaires complets (30+ tests)
- ✅ Documentation détaillée
- ✅ Exemples pratiques

## 🎓 Prochain pas

1. Lire le guide complet : `src/text/NORMALIZE_GUIDE.md`
2. Explorer les exemples : `examples/normalize_example.ts`
3. Tester avec vos propres fichiers HTML

## 🆘 Besoin d'aide ?

- Documentation : `NORMALIZE_GUIDE.md`
- Exemples : `examples/normalize_example.ts`
- Tests : `normalize_test.ts` (pour voir tous les cas d'usage)

---

**Temps de lecture : 2 minutes | Temps pour être opérationnel : 5 minutes**

