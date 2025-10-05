# 📁 Structure du Dossier Observability

```
observability/
├── docker-compose.yml              # Orchestration de tous les services
│
├── prometheus/
│   └── prometheus.yml              # Configuration Prometheus
│
├── tempo/
│   └── tempo.yml                   # Configuration Tempo
│
├── loki/
│   ├── loki.yml                    # Configuration Loki
│   └── promtail.yml                # Configuration Promtail (collecteur)
│
├── grafana/
│   └── provisioning/
│       ├── datasources/
│       │   └── datasources.yml     # Auto-configuration des datasources
│       └── dashboards/
│           ├── dashboards.yml      # Configuration des dashboards
│           └── json/               # Dashboards personnalisés (à créer)
│
├── logs/                           # Dossier pour les logs de l'application
│   └── .gitkeep
│
├── README.md                       # Documentation complète
├── QUICKSTART.md                   # Guide de démarrage rapide
├── STRUCTURE.md                    # Ce fichier
│
├── start.sh                        # Script de démarrage automatique
├── stop.sh                         # Script d'arrêt
│
├── .gitignore                      # Ignore les logs et données temporaires
└── .env.example                    # Variables d'environnement (template)
```

## 📦 Services Docker

| Service    | Image                    | Ports              |
|------------|--------------------------|--------------------| 
| Grafana    | grafana/grafana:latest   | 3000               |
| Prometheus | prom/prometheus:latest   | 9090               |
| Tempo      | grafana/tempo:latest     | 3200, 4317, 4318   |
| Loki       | grafana/loki:latest      | 3100               |
| Promtail   | grafana/promtail:latest  | 9080               |

## 🔧 Fichiers de Configuration

### docker-compose.yml
Définit et orchestre tous les services avec :
- Volumes persistants pour les données
- Réseau bridge `observability`
- Variables d'environnement
- Dépendances entre services

### prometheus/prometheus.yml
Configuration du scraping des métriques :
- Intervalle de scraping : 15s
- Jobs : Prometheus, ThirdShop Text Analyzer, Grafana, Tempo, Loki
- Support des exemplars pour la corrélation

### tempo/tempo.yml
Configuration du tracing distribué :
- Récepteurs : OTLP (HTTP/gRPC), Jaeger, Zipkin
- Générateur de métriques activé
- Intégration avec Prometheus

### loki/loki.yml
Configuration de l'agrégation de logs :
- Schéma : boltdb-shipper
- Rétention : 168h (7 jours)
- Compacteur activé

### loki/promtail.yml
Configuration de la collecte de logs :
- Surveillance des fichiers `./logs/*.log` et `./logs/*.json`
- Pipeline pour parser les logs JSON
- Labels automatiques

### grafana/provisioning/datasources/datasources.yml
Auto-configuration des datasources :
- Prometheus (défaut)
- Loki avec corrélation vers Tempo
- Tempo avec corrélation vers Loki et Prometheus

## 📝 Fichiers Utilitaires

### start.sh
Script bash pour :
- Vérifier les prérequis (Docker, Docker Compose)
- Vérifier la disponibilité des ports
- Démarrer la stack
- Vérifier l'état des services

### stop.sh
Script bash pour arrêter proprement la stack

### README.md
Documentation complète incluant :
- Architecture
- Installation
- Configuration détaillée
- Instrumentation de l'application
- Création de dashboards
- Troubleshooting

### QUICKSTART.md
Guide de démarrage rapide en 3 étapes

## 🎯 Fichiers à Créer (Prochaines Étapes)

### Dashboards Grafana
À placer dans `grafana/provisioning/dashboards/json/` :
- `thirdshop-overview.json` : Vue d'ensemble
- `thirdshop-extraction.json` : Métriques d'extraction
- `thirdshop-classification.json` : Métriques de classification
- `thirdshop-performance.json` : Performance et latence

### Variables d'Environnement
Créer un fichier `.env` basé sur `.env.example` pour personnaliser les ports et configurations

---

**Total de fichiers créés** : 15 fichiers + 7 dossiers
