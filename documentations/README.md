# Documentation du Projet

Bienvenue dans la documentation complète du projet **thirdshop-text-analyzer**.

---

## 📚 Organisation de la Documentation

Ce dossier contient la documentation organisée par module/fonctionnalité. Chaque sous-dossier regroupe toute la documentation relative à un module spécifique.

---

## 📁 Modules Documentés

### 🔤 Normalisation HTML
**Dossier**: [`normalize/`](./normalize/)

Module de normalisation et d'extraction de texte depuis HTML.

**Contenu**:
- 📖 Guide complet et démarrage rapide
- 🧪 Rapports de tests (75 tests, 100% réussite)
- 💡 Exemples et cas d'usage
- ⚙️ Documentation technique des 5 stratégies

**Démarrage rapide**: [normalize/QUICKSTART_NORMALIZE.md](./normalize/QUICKSTART_NORMALIZE.md)

---

## 🎯 Structure d'un Dossier de Documentation

Chaque sous-dossier suit cette organisation :

```
documentations/
└── nom_module/
    ├── README.md                    # Index de la documentation
    ├── QUICKSTART_NOM_MODULE.md     # Démarrage rapide
    ├── NOM_MODULE_README.md         # Documentation complète
    ├── NOM_MODULE_GUIDE.md          # Guide technique approfondi
    ├── TEST_REPORT.md               # Rapport des tests
    └── TESTING_SUMMARY.md           # Résumé des tests
```

---

## 📋 Bonnes Pratiques

### Pour Créer une Nouvelle Documentation :

1. **Créer un sous-dossier** dans `documentations/`
   ```bash
   mkdir documentations/nom_module
   ```

2. **Créer les fichiers de base** :
   - `README.md` - Index de navigation
   - `QUICKSTART_*.md` - Démarrage rapide (5 min)
   - `*_README.md` - Documentation complète
   - `*_GUIDE.md` - Guide technique approfondi
   - `TEST_REPORT.md` - Rapport de tests

3. **Suivre la structure** :
   - Vue d'ensemble
   - Installation/Utilisation
   - Exemples pratiques
   - API/Référence
   - Tests et validation

4. **Mettre à jour** :
   - Ce README (ajouter le module à la liste)
   - Le README principal du projet
   - Les liens entre documents

---

## 🔗 Liens Utiles

### Racine du Projet :
- [README.md](../README.md) - Bonnes pratiques du projet
- [PROGRESS.md](../PROGRESS.md) - Suivi de l'avancement
- [STRUCTURE.md](../STRUCTURE.md) - Structure du projet

### Code Source :
- [src/](../src/) - Code source des modules
- [dataset/](../dataset/) - Jeux de données pour tests

### Scripts :
- [demo_normalize.ts](../demo_normalize.ts) - Démo normalisation
- [integration_normalize.ts](../integration_normalize.ts) - Pipeline complet
- [test_normalize_all.ts](../test_normalize_all.ts) - Suite de tests

---

## 🎓 Pour les Nouveaux Contributeurs

### Lecture Recommandée :

1. **README principal** - Comprendre les bonnes pratiques
2. **STRUCTURE.md** - Comprendre l'architecture
3. **Documentation des modules** - Comprendre chaque fonctionnalité
4. **Code source** - Explorer l'implémentation

### Contribuer à la Documentation :

1. Suivre les bonnes pratiques établies
2. Utiliser un langage clair et concis
3. Inclure des exemples pratiques
4. Documenter les tests
5. Maintenir les liens à jour

---

## 📊 Statistiques

| Module | Docs | Tests | Statut |
|--------|------|-------|--------|
| Normalisation HTML | 5 fichiers | 75 tests | ✅ Production Ready |

---

## 🚀 Prochains Modules

À documenter selon l'avancement du projet :
- Analyse TF-IDF
- Analyse statistique
- Matrices et calculs
- Pipeline complet

---

**Dernière mise à jour** : 4 octobre 2025  
**Mainteneur** : Équipe de développement

