# ⚡ Guide de Démarrage Rapide

## Installation en 3 étapes

### 1️⃣ Démarrer la stack

```bash
cd observability
./start.sh
```

Ou manuellement :
```bash
docker-compose up -d
```

### 2️⃣ Accéder à Grafana

Ouvrez votre navigateur : http://localhost:3000

Les datasources sont déjà configurées automatiquement ! ✨

### 3️⃣ Vérifier que tout fonctionne

```bash
docker-compose ps
```

Tous les services devraient être `Up`.

---

## 🎯 Premiers Pas

### Explorer Prometheus

1. Aller sur http://localhost:9090
2. Cliquer sur **"Graph"**
3. Essayer cette requête :
   ```
   up
   ```
4. Voir quels services sont actifs

### Explorer Loki

1. Dans Grafana (http://localhost:3000)
2. Aller dans **"Explore"** (icône boussole)
3. Sélectionner **"Loki"** en datasource
4. Essayer cette requête :
   ```
   {job=~".+"}
   ```

### Tester l'envoi de logs

```bash
echo '{"timestamp":"'$(date -Iseconds)'","level":"info","message":"Test log"}' \
  >> observability/logs/test.json
```

Attendre 10 secondes et chercher dans Loki :
```
{job="thirdshop-json"}
```

### Tester l'envoi de traces

Exemple avec curl vers Tempo (OTLP HTTP) :
```bash
curl -X POST http://localhost:4318/v1/traces \
  -H "Content-Type: application/json" \
  -d '{
    "resourceSpans": [{
      "resource": {
        "attributes": [{
          "key": "service.name",
          "value": { "stringValue": "test-service" }
        }]
      },
      "scopeSpans": [{
        "spans": [{
          "traceId": "5b8aa5a2d2c872e8321cf37308d69df2",
          "spanId": "051581bf3cb55c13",
          "name": "test-span",
          "kind": 1,
          "startTimeUnixNano": "'$(date +%s%N)'",
          "endTimeUnixNano": "'$(date +%s%N)'",
          "attributes": []
        }]
      }]
    }]
  }'
```

Chercher la trace dans Grafana → Explore → Tempo → Trace ID : `5b8aa5a2d2c872e8321cf37308d69df2`

---

## 🛠️ Commandes Utiles

### Voir les logs en temps réel
```bash
docker-compose logs -f grafana
docker-compose logs -f prometheus
docker-compose logs -f tempo
docker-compose logs -f loki
```

### Redémarrer un service
```bash
docker-compose restart grafana
```

### Arrêter la stack
```bash
./stop.sh
# Ou manuellement :
docker-compose down
```

### Tout supprimer (conteneurs + données)
```bash
docker-compose down -v
```

---

## 🎨 Créer votre Premier Dashboard

1. Grafana → **"+"** → **"Dashboard"**
2. **"Add new panel"**
3. Choisir **Prometheus** comme datasource
4. Entrer une requête, par exemple : `up`
5. **"Apply"** → **"Save dashboard"**

---

## 📚 Besoin d'aide ?

- Documentation complète : [`README.md`](./README.md)
- Problèmes courants : Section "Troubleshooting" dans README.md

---

**Status** : ✅ Prêt à l'emploi !
