# 🗺️ ROADMAP - Stack d'Observabilité

## 🎯 Objectif

Mise en place d'une stack d'observabilité complète pour le monitoring et le tracing de ThirdShop Text Analyzer :

- **GRAFANA** : Visualisation et dashboards
- **PROMETHEUS** : Métriques et monitoring
- **TEMPO** : Distributed tracing
- **LOKI** : Agrégation de logs

---
## 📊 Prochaines Étapes (Stack d'Observabilité)

Une fois l'environnement installé, les prochaines étapes incluront :

1. **Création du `docker-compose.yml`** pour orchestrer :
   - Grafana (port 3000)
   - Prometheus (port 9090)
   - Tempo (port 3200, 4317)
   - Loki (port 3100)

2. **Configuration des sources de données** :
   - Prometheus → Grafana
   - Loki → Grafana
   - Tempo → Grafana

3. **Instrumentation de l'application** :
   - Export de métriques vers Prometheus
   - Export de traces vers Tempo
   - Export de logs vers Loki

4. **Création des dashboards Grafana** :
   - Métriques de performance (temps/page, throughput)
   - Taux de classification
   - Santé des extracteurs
   - Traces détaillées des requêtes

---

## 📝 Notes Importantes

- **Port 3000** : Sera utilisé par Grafana (vérifier qu'il est libre)
- **Docker nécessite 4GB RAM minimum** pour faire tourner toute la stack
- **Volumes Docker** : Les données seront persistées dans des volumes Docker
- **Configuration initiale** : Les configurations seront dans `./observability/`

---

**Status :** 📦 **Environnement de base prêt à être installé**