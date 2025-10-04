# Documentation - Module de Normalisation HTML

Bienvenue dans la documentation complète du module de normalisation HTML.

---

## 📚 Guide de Documentation

### 🚀 Pour Commencer
- **[QUICKSTART_NORMALIZE.md](./QUICKSTART_NORMALIZE.md)** - Démarrage rapide en 5 minutes
  - Installation (0 dépendance)
  - Utilisation en 30 secondes
  - Les 5 stratégies expliquées
  - Exemples pratiques

### 📖 Documentation Complète
- **[NORMALIZE_README.md](./NORMALIZE_README.md)** - Documentation complète du module
  - Vue d'ensemble
  - Guide d'utilisation détaillé
  - Options de configuration
  - Exemples avancés

- **[NORMALIZE_GUIDE.md](./NORMALIZE_GUIDE.md)** - Guide technique approfondi
  - Architecture du module
  - Détails des stratégies
  - Cas d'usage avancés
  - Bonnes pratiques

### 🧪 Rapports de Tests
- **[TEST_REPORT.md](./TEST_REPORT.md)** - Rapport détaillé des tests
  - 75 tests (100% de réussite)
  - Couverture complète
  - Métriques de performance
  - Validation des bonnes pratiques

- **[TESTING_SUMMARY.md](./TESTING_SUMMARY.md)** - Résumé des tests
  - Vue d'ensemble des tests
  - Résultats globaux
  - Statistiques de performance
  - Commandes de test

---

## 🎯 Ordre de Lecture Recommandé

### Pour les Débutants:
1. **QUICKSTART_NORMALIZE.md** - Commencer ici
2. **NORMALIZE_README.md** - Approfondir
3. Tester avec les exemples

### Pour les Développeurs:
1. **NORMALIZE_README.md** - Comprendre l'API
2. **NORMALIZE_GUIDE.md** - Architecture détaillée
3. **TEST_REPORT.md** - Validation et tests

### Pour les Testeurs:
1. **TESTING_SUMMARY.md** - Vue d'ensemble des tests
2. **TEST_REPORT.md** - Détails complets
3. Exécuter: `deno run -A test_normalize_all.ts`

---

## 📊 Aperçu du Module

### Stratégies Disponibles:
- **BASIC** - Suppression simple des balises HTML
- **CONTENT_ONLY** ⭐ - Extraction du contenu visible (recommandé)
- **STRUCTURE_AWARE** - Préservation de la structure
- **WITH_METADATA** - Extraction avec métadonnées (SEO)
- **AGGRESSIVE** - Nettoyage maximal

### Performance:
- ✅ 380 KB: <5ms
- ✅ 1 MB: <50ms
- ✅ 10,000 balises: <200ms

### Tests:
- ✅ 75 tests (100% réussite)
- ✅ Tests unitaires (29)
- ✅ Tests d'intégration (13)
- ✅ Tests cas limites (33)

---

## 🚀 Exemples Rapides

### Extraction Simple:
```typescript
import { extractText } from "../../src/text/normalize.ts";

const html = await Deno.readTextFile("dataset/pieceoccasion-1.html");
const [err, text] = extractText(html);

if (!err) {
  console.log(text);
}
```

### Avec Métadonnées:
```typescript
import { normalizeHtml } from "../../src/text/normalize.ts";
import { NormalizationStrategy } from "../../src/text/normalize_types.ts";

const [err, result] = normalizeHtml(html, {
  strategy: NormalizationStrategy.WITH_METADATA
});

if (!err) {
  console.log("Titre:", result.metadata?.title);
  console.log("Texte:", result.text);
}
```

---

## 🔗 Liens Utiles

### Code Source:
- `src/text/normalize.ts` - Code principal
- `src/text/normalize_types.ts` - Définitions de types
- `src/text/normalize_test.ts` - Tests unitaires

### Scripts de Démonstration:
- `demo_normalize.ts` - Démo basique
- `integration_normalize.ts` - Pipeline complet
- `examples/normalize_example.ts` - Exemples variés

### Scripts de Test:
- `test_normalize_all.ts` - Tous les tests
- `validate_normalize.ts` - Validation visuelle

---

## 📝 Commandes Utiles

### Exécuter les démos:
```bash
deno run -A demo_normalize.ts
deno run -A integration_normalize.ts
deno run -A examples/normalize_example.ts
```

### Exécuter les tests:
```bash
deno run -A test_normalize_all.ts
```

### Validation complète:
```bash
deno run -A validate_normalize.ts
```

---

## 🏆 Statut du Module

**Version**: 1.0  
**Statut**: ✅ **PRODUCTION READY**  
**Tests**: ✅ 75/75 (100%)  
**Performance**: ✅ Excellente  
**Documentation**: ✅ Complète  

---

**Dernière mise à jour**: 4 octobre 2025

