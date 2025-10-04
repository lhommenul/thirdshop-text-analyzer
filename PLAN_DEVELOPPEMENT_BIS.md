### Plan de développement BIS

## Contexte et vision
- **But**: exploiter des documents HTML pour 1) distinguer les pages produit des autres pages, 2) extraire des attributs clés produits (prix, devise, référence/SKU, marque, modèle, dimensions, poids, etc.).
- **Approche**: combiner parsing DOM (JSON‑LD, microdata, OpenGraph), heuristiques/règles linguistiques FR, signaux structurels, puis un classifieur léger. Priorité FR, extensible multi‑langues.

## Résultats attendus (KPI)
- **Classification (produit vs non-produit)**: F1 ≥ 0.90 sur dataset interne.
- **Extraction**:
  - Prix+devise: exactitude ≥ 0.98 (écart ≤ 0.01 unité monétaire).
  - Référence/SKU: exact-match ≥ 0.95.
  - Poids/dimensions: exactitude ≥ 0.90 avec normalisation d’unités (SI).
- **Couverture JSON‑LD Product**: détection ≥ 0.95 quand présent.
- **Perf**: ≥ 50 pages/s sur machine locale (I/O parallèle), mémoire stable.

## Livrables
- **Modules**: parsing DOM, extracteur d’attributs, classifieur produit, features.
- **CLI**: analyse d’un dossier et export JSON/CSV.
- **API**: fonctions `isProductPage(html)` et `extractProductInfo(html)`.
- **Datasets**: échantillons annotés + scripts d’évaluation (métriques, rapports).
- **Docs**: guide d’usage, schéma des sorties, critères de qualité.

## Architecture cible
- `src/html/`
  - `dom_parser.ts`: parse HTML (DOM), extraction `application/ld+json`, microdata, OpenGraph, meta.
  - `content_extractor.ts`: détection contenu principal (densité texte/lien, suppression header/footer/nav).
- `src/product/`
  - `schemas.ts`: types `ProductInfo`, `Dimension`, `Weight`, `Money`, `ExtractionEvidence`, `Features`.
  - `extract_product_info.ts`: agrégation JSON‑LD + microdata + texte (regex/heuristiques), normalisation.
  - `classify_product_page.ts`: score produit (règles + option ML léger), seuil calibré.
- `src/text/` (existant)
  - Extensions tokenizer: option pour conserver les chiffres, n‑grams, stopwords FR.
- `cli/`
  - `analyze.ts`: CLI pour fichiers/dossiers, export JSON/CSV, logs, filtres.
- `tests/`
  - Unitaires par attribut + intégration bout‑en‑bout, fixtures dans `dataset/`.
- `documentations/product/`
  - README, guide extraction, FAQ, rapports métriques.

## Spécification API
- `isProductPage(html: string, opts?): { score: number, label: boolean, features: Features, reasons: string[] }`
- `extractProductInfo(html: string, opts?): { product: ProductInfo, confidence: number, evidence: ExtractionEvidence[] }`
- `parseDom(html: string): { document: DomLike, jsonLd: any[], microdata: any[], openGraph: Record<string,string> }`

## Détails de mise en œuvre
### Parsing et contenu principal
- Intégrer un parseur DOM pour Deno. Objectif: accès fiable à `script[type="application/ld+json"]`, microdata (`itemtype`/`itemprop`), metas OpenGraph, titres, tableaux, listes.
- Implémenter un extracteur de contenu principal via heuristiques (densité texte vs liens, balises de navigation, sections répétitives).

### Extraction d’attributs (fusion multi-source)
- **Prix/Devise**: prioriser JSON‑LD (`offers.price`, `priceCurrency`), OpenGraph, fallback regex texte (formats FR/EN, séparateurs, multiples devises). Normaliser en centimes + `currency` ISO 4217.
- **Référence/SKU**: JSON‑LD (`sku`, `gtin13`, `gtin14`), microdata. Fallback regex voisinage de mots-clés: `SKU`, `Réf.`, `Référence`, `EAN`, `UPC`, `Part number`. Contraintes alphanum et longueur raisonnable, blacklist tokens communs.
- **Dimensions**: repérer motifs `L×l×h`, `longueur`, `largeur`, `hauteur`, `diamètre`, unités `mm/cm/m`. Normaliser en millimètres.
- **Poids/Capacités**: motifs `poids`, `masse`, `capacité`, unités `g/kg`, `mAh/Ah`, `W/kW`, `V`. Normaliser en unités SI.
- **Marque/Modèle/Nom**: JSON‑LD (`brand`, `name`, `model`). Fallback: `<title>`, `<h1>`, breadcrumbs. Nettoyage marketing.
- **Images**: compter images de produit (≥ résolution seuil), alt/title pertinents.
- **Fusion**: pondérer sources (JSON‑LD > microdata > OpenGraph > texte), dédupliquer, calculer `confidence` et `evidence`.

### Classification produit vs non-produit
- **Features**: présence JSON‑LD Product, existence de prix normalisé, présence SKU, nombre d’images produit, densité chiffres, ratio tableaux specs, tokens clés ("acheter", "ajouter au panier", "prix", "garantie").
- **Baseline règles**: label produit si (JSON‑LD Product) OU (prix + ≥1 attribut clé) OU (score heuristique ≥ seuil).
- **Option ML**: régression logistique légère avec normalisation min‑max sur features; sauvegarde seuil calibré sur validation (AUPRC + F1).

### NLP et tokenisation
- Ajouter `removeDigits: false` pour pipelines d’extraction; activer n‑grams (2‑3) pour cooccurrence; liste de stopwords FR.
- Maintenir versions existantes pour TF/IDF avec options explicites.

### Évaluation et datasets
- Annotation binaire (produit/non-produit) + attributs cibles sur échantillon `dataset/` et nouvelles pages.
- Métriques classification: precision/recall/F1, AUPRC. Extraction: exact-match, tolérance pour prix/units (±1%).
- Rapports automatiques (JSON + tableau Markdown) par run.

### CLI et formats de sortie
- `deno run -A cli/analyze.ts --in dataset/ --out results.json --format json`.
- Sortie par page: `{ file, isProduct: {score,label}, product: {price,currency,sku,brand,model,weight,dimensions,...}, evidence, errors }`.
- Option `--csv` pour un sous-ensemble d’attributs à plat.

## Roadmap (phases et jalons)
### Phase 0 — Socle (2–3 jours)
- DOM parser + extraction JSON‑LD/microdata/OpenGraph.
- Option tokenizer pour conserver les chiffres. Tests unitaires de base.

### Phase 1 — Extraction attributs (5–7 jours)
- Prix/devise (toutes variations FR/EN), SKU, dimensions/poids, marque/modèle.
- Fusion multi-source + `confidence`/`evidence`. Tests d’intégration sur `dataset/`.

### Phase 2 — Classification (3–5 jours)
- Features + baseline règles. Calibrage seuil. Évaluation F1/AUPRC.
- Option ML (logReg) si besoin pour sites variés.

### Phase 3 — CLI/Docs (2–3 jours)
- CLI d’analyse en lot, export JSON/CSV. Guide d’utilisation et schéma de sortie.

### Phase 4 — Durcissement/i18n (continu)
- Optimisations perf (I/O parallèles, cache normalisation). Support multi-langues/devises. Tests edge cases.

## Risques et mitigations
- **HTML hétérogène / anti-scraping**: privilégier JSON‑LD, tolérance erreurs DOM; backoff heuristique.
- **Formats prix/units variés**: bibliothèque de patterns extensible + tests exhaustifs.
- **Performance DOM**: limiter parse sur sections utiles; paralléliser; profiling.
- **Qualité dataset**: mise à jour continue, revues d’annotation, équilibrage classes.

## Critères d’acceptation (Phase 1–2)
- `isProductPage` atteint F1 ≥ 0.90 sur validation interne.
- Extraction renvoie prix/devise/SKU/poids/dimensions/brand pour ≥ 90% des pages produit testées; normalisation d’unités cohérente.
- CLI produit un `results.json` exploitable et un rapport métrique.

## Suivi et documentation
- Dossier `documentations/product/` avec: README, guide d’extraction, rapports métriques, exemples CLI.
- Rapport automatique après chaque run d’évaluation (timestamp, paramètres, scores).

## Non-objectifs (court terme)
- Vision multilingue avancée (lemmatisation/NER complète); modèles lourds.
- Intégration web temps-réel. Hébergement/infra.
