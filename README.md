# ThirdShop Text Analyzer

**Version:** 1.0  
**Date:** 4 octobre 2025  
**Runtime:** Deno + TypeScript

---

## 📋 Description

**ThirdShop Text Analyzer** est un système complet d'analyse et d'extraction de données produit depuis des pages web, avec classification automatique des pages produit vs. non-produit.

### 🎯 Capacités Principales

- ✅ **API REST** : 3 endpoints avec observabilité complète (logs, metrics, traces)
- ✅ **Classification Pages** : Distinction produit / non-produit (Précision: 100%, Rappel: 67%, F1: 80%)
- ✅ **Extraction Multi-Source** : 8 sources d'extraction complémentaires
- ✅ **Normalisation Rigoureuse** : SI + ISO 4217 (prix→centimes, poids→g, dimensions→mm)
- ✅ **Fusion Intelligente** : 5 stratégies de résolution de conflits
- ✅ **Evidence Tracking** : Traçabilité complète des extractions
- ✅ **CLI Complet** : 15+ options, 4 formats de sortie (JSON/CSV/Markdown/Text)
- ✅ **Performance** : 14.2 pages/s, ~63ms/page
- ✅ **Observabilité** : Stack Grafana/Prometheus/Loki/Tempo intégrée

---

## 🚀 Démarrage Rapide

### Installation

```bash
# Clone le repository
git clone https://github.com/votre-org/thirdshop-text-analyzer.git
cd thirdshop-text-analyzer

# Installer Deno (si pas déjà installé)
curl -fsSL https://deno.land/install.sh | sh
```

### 🌐 API REST (Recommandé)

```bash
# Démarrer l'API
./start-api.sh
# ou
deno run -A src/api/server.ts

# Test health check
curl http://localhost:8080/health

# Analyser un document HTML
curl -X POST http://localhost:8080/analyze \
  -F "file=@dataset/pieceoccasion-1.html" | jq .

# Voir les métriques Prometheus
curl http://localhost:8080/metrics
```

## 🤝 Bonnes Pratiques

1. **Gestion d'erreurs** : Utiliser `Result<T>` partout (`[Error, null] | [null, T]`)
2. **Modularité** : Fonctions claires et réutilisables
3. **Typage** : Types stricts, interfaces dédiées (`*_types.ts`)
4. **Tests** : Un fichier de test par module (`*_test.ts`)
5. **Documentation** : `documentations/` organisé par module

