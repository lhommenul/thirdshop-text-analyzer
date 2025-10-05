# 📊 Stack d'Observabilité - ThirdShop Text Analyzer

Stack complète d'observabilité basée sur Grafana, Prometheus, Tempo et Loki pour le monitoring et le tracing de ThirdShop Text Analyzer.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         GRAFANA                              │
│                    (Visualisation)                           │
│                      Port: 3000                              │
└────────────┬─────────────┬──────────────┬────────────────────┘
             │             │              │
    ┌────────▼────┐  ┌────▼─────┐  ┌────▼─────┐
    │ PROMETHEUS  │  │   LOKI   │  │  TEMPO   │
    │ (Métriques) │  │  (Logs)  │  │ (Traces) │
    │ Port: 9090  │  │Port: 3100│  │Port: 3200│
    └─────────────┘  └────┬─────┘  └──────────┘
                          │
                     ┌────▼─────┐
                     │ PROMTAIL │
                     │(Collecte)│
                     └──────────┘
```

## 🚀 Démarrage Rapide

### Prérequis

- **Docker** et **Docker Compose** installés
- **4GB RAM minimum** disponible pour Docker
- **Port 3000** libre (utilisé par Grafana)
- **Ports 9090, 3100, 3200, 4317, 4318** libres

### Installation

1. **Démarrer la stack complète** :
```bash
cd observability
docker-compose up -d
```

2. **Vérifier que tous les services sont démarrés** :
```bash
docker-compose ps
```

Vous devriez voir 5 services en cours d'exécution :
- thirdshop-grafana
- thirdshop-prometheus
- thirdshop-tempo
- thirdshop-loki
- thirdshop-promtail

3. **Accéder à Grafana** :
   - URL : http://localhost:3000
   - Les datasources (Prometheus, Loki, Tempo) sont automatiquement configurées

## 📊 Services & Ports

| Service    | Port(s)           | URL                              | Description                    |
|------------|-------------------|----------------------------------|--------------------------------|
| Grafana    | 3000              | http://localhost:3000            | Dashboards et visualisation    |
| Prometheus | 9090              | http://localhost:9090            | Métriques et alertes           |
| Tempo      | 3200, 4317, 4318  | http://localhost:3200            | Distributed tracing            |
| Loki       | 3100              | http://localhost:3100            | Agrégation de logs             |
| Promtail   | 9080              | -                                | Agent de collecte de logs      |

## 🔧 Configuration

### Prometheus

Configuration : `prometheus/prometheus.yml`

- **Scrape interval** : 15 secondes
- **Jobs configurés** :
  - Prometheus self-monitoring
  - ThirdShop Text Analyzer (port 8080)
  - Grafana, Tempo, Loki

Pour ajouter votre application :
```yaml
- job_name: 'mon-app'
  static_configs:
    - targets: ['host.docker.internal:PORT']
```

### Tempo

Configuration : `tempo/tempo.yml`

- **Protocoles supportés** : OTLP (HTTP/gRPC), Jaeger, Zipkin, OpenCensus
- **Ports OTLP** :
  - gRPC : 4317
  - HTTP : 4318
- **Rétention** : 1 heure (configurable)

### Loki

Configuration : `loki/loki.yml`

- **Schéma** : boltdb-shipper
- **Rétention** : 168 heures (7 jours)
- **Limites** :
  - Ingestion rate : 10 MB/s
  - Burst : 20 MB/s

### Promtail

Configuration : `loki/promtail.yml`

- **Chemins surveillés** :
  - `/logs/*.log` (logs de l'application)
  - `/logs/*.json` (logs JSON avec parsing automatique)
  - `/var/log/*.log` (logs système, optionnel)

## 📈 Instrumentation de l'Application

### 1. Export de Métriques vers Prometheus

Votre application doit exposer un endpoint `/metrics` sur le port 8080 (configurable dans `prometheus/prometheus.yml`).

Exemple avec Deno :
```typescript
import { serve } from "https://deno.land/std/http/server.ts";

// Compteur d'exemple
let requestCount = 0;

serve((req) => {
  if (req.url.endsWith('/metrics')) {
    requestCount++;
    return new Response(`# HELP requests_total Total requests
# TYPE requests_total counter
requests_total ${requestCount}
`, { headers: { "Content-Type": "text/plain" } });
  }
  // ... votre logique
}, { port: 8080 });
```

### 2. Export de Traces vers Tempo

Utilisez OTLP (OpenTelemetry Protocol) :

```typescript
import { trace } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

const exporter = new OTLPTraceExporter({
  url: 'http://localhost:4318/v1/traces',
});

// Créer un span
const tracer = trace.getTracer('thirdshop-text-analyzer');
const span = tracer.startSpan('process-text');
// ... votre logique
span.end();
```

### 3. Export de Logs vers Loki

Écrivez vos logs dans le dossier `./logs/` :

```typescript
// Logs au format JSON (recommandé)
const log = {
  timestamp: new Date().toISOString(),
  level: "info",
  message: "Processing document",
  trace_id: "abc123",
  span_id: "def456"
};

await Deno.writeTextFile(
  "./observability/logs/app.json",
  JSON.stringify(log) + "\n",
  { append: true }
);
```

## 📊 Dashboards Grafana

### Accès aux Dashboards

1. Ouvrir http://localhost:3000
2. Navigation : **Dashboards** → **Browse**
3. Folder : **ThirdShop**

### Création d'un Dashboard

Les dashboards peuvent être créés de deux façons :

1. **Via l'interface Grafana** (recommandé pour débuter)
   - Cliquer sur **"+" → Dashboard**
   - Ajouter des panels avec des requêtes Prometheus/Loki/Tempo
   - Sauvegarder

2. **Via provisioning** (recommandé pour la production)
   - Placer le fichier JSON dans `grafana/provisioning/dashboards/json/`
   - Redémarrer Grafana : `docker-compose restart grafana`

### Exemples de Requêtes

**Prometheus (Métriques)** :
```promql
# Taux de requêtes par seconde
rate(requests_total[5m])

# Latence moyenne
histogram_quantile(0.95, rate(request_duration_seconds_bucket[5m]))
```

**Loki (Logs)** :
```logql
# Tous les logs de l'app
{job="thirdshop-logs"}

# Logs d'erreur uniquement
{job="thirdshop-logs"} |= "error"

# Taux d'erreurs
rate({job="thirdshop-logs"} |= "error" [5m])
```

**Tempo (Traces)** :
- Utiliser le "Trace ID" depuis les logs ou métriques
- Visualiser le parcours complet d'une requête

## 🔍 Workflows d'Observabilité

### 1. Investigation d'un Problème de Performance

1. **Grafana** → Voir une métrique anormale (temps de réponse élevé)
2. **Cliquer sur le point de donnée** → "View traces"
3. **Tempo** → Analyser la trace pour trouver le span lent
4. **Cliquer sur "View logs"** → Voir les logs associés dans **Loki**

### 2. Debugging avec Correlation

Tous les logs doivent inclure le `trace_id` :
```json
{
  "trace_id": "abc123",
  "message": "Processing failed",
  "error": "..."
}
```

Cela permet de :
- Passer d'un log à la trace complète
- Passer d'une trace aux métriques
- Avoir une vue 360° d'une requête

## 🛠️ Commandes Utiles

### Gestion de la Stack

```bash
# Démarrer tous les services
docker-compose up -d

# Arrêter tous les services
docker-compose down

# Voir les logs d'un service
docker-compose logs -f grafana
docker-compose logs -f prometheus
docker-compose logs -f tempo
docker-compose logs -f loki

# Redémarrer un service
docker-compose restart grafana

# Vérifier l'état des services
docker-compose ps

# Voir l'utilisation des ressources
docker stats
```

### Nettoyage

```bash
# Arrêter et supprimer les conteneurs
docker-compose down

# Supprimer également les volumes (données)
docker-compose down -v

# Nettoyer tous les logs de l'application
rm -rf logs/*.log logs/*.json
```

### Vérification de Santé

```bash
# Prometheus
curl http://localhost:9090/-/healthy

# Loki
curl http://localhost:3100/ready

# Tempo
curl http://localhost:3200/ready

# Grafana
curl http://localhost:3000/api/health
```

## 📦 Volumes Docker

Les données sont persistées dans les volumes Docker suivants :

- `grafana-data` : Dashboards, utilisateurs, configurations
- `prometheus-data` : Métriques time-series
- `tempo-data` : Traces
- `loki-data` : Logs indexés

**Note** : Les volumes survivent à `docker-compose down`, utilisez `docker-compose down -v` pour les supprimer.

## 🔐 Sécurité

### Configuration actuelle (Développement)

- **Grafana** : Authentification désactivée (accès anonyme en Admin)
- **Tous les services** : Accessible sans authentification

### Pour la Production

Modifiez `docker-compose.yml` :

```yaml
grafana:
  environment:
    - GF_AUTH_ANONYMOUS_ENABLED=false
    - GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer
    - GF_AUTH_DISABLE_LOGIN_FORM=false
    - GF_SECURITY_ADMIN_USER=admin
    - GF_SECURITY_ADMIN_PASSWORD=changeme
```

## 🐛 Troubleshooting

### Grafana ne démarre pas

- Vérifier que le port 3000 est libre : `lsof -i :3000`
- Vérifier les logs : `docker-compose logs grafana`

### Prometheus ne scrape pas mon application

- Vérifier que l'application expose `/metrics`
- Vérifier la connectivité : `curl http://localhost:8080/metrics`
- Utiliser `host.docker.internal` au lieu de `localhost` dans la config

### Loki ne reçoit pas de logs

- Vérifier que Promtail tourne : `docker-compose logs promtail`
- Vérifier les permissions du dossier `logs/`
- Vérifier les chemins dans `loki/promtail.yml`

### Les traces n'apparaissent pas dans Tempo

- Vérifier que l'application envoie bien vers port 4318 (HTTP) ou 4317 (gRPC)
- Vérifier les logs de Tempo : `docker-compose logs tempo`
- Tester avec : `curl -X POST http://localhost:4318/v1/traces -d '{}'`

## 📚 Ressources

- [Documentation Grafana](https://grafana.com/docs/)
- [Documentation Prometheus](https://prometheus.io/docs/)
- [Documentation Tempo](https://grafana.com/docs/tempo/latest/)
- [Documentation Loki](https://grafana.com/docs/loki/latest/)
- [OpenTelemetry](https://opentelemetry.io/)

## 🎯 Prochaines Étapes

- [ ] Créer des dashboards personnalisés pour ThirdShop Text Analyzer
- [ ] Configurer des alertes dans Prometheus
- [ ] Instrumenter l'application avec OpenTelemetry
- [ ] Ajouter des règles de rétention personnalisées
- [ ] Configurer un Alertmanager pour les notifications

---

**Status** : ✅ **Stack complète et opérationnelle**
