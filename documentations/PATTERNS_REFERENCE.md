# Patterns Reference - ThirdShop Text Analyzer

**Version:** 1.0  
**Date:** 4 octobre 2025  
**Total Patterns:** 100+

---

## 📋 Table des Matières

1. [Introduction](#introduction)
2. [Prix (18 patterns)](#prix)
3. [Références / SKU (12 patterns)](#références--sku)
4. [Poids (8 patterns)](#poids)
5. [Dimensions (14 patterns)](#dimensions)
6. [Batterie (6 patterns)](#batterie)
7. [Disponibilité (9 patterns)](#disponibilité)
8. [Marque (4 patterns)](#marque)
9. [Modèle (2 patterns)](#modèle)
10. [Condition (6 patterns)](#condition)
11. [Livraison (4 patterns)](#livraison)
12. [Garantie (4 patterns)](#garantie)
13. [Keywords Classification (40 mots-clés)](#keywords-classification)
14. [Utilisation](#utilisation)

---

## Introduction

Cette référence documente tous les patterns regex disponibles dans `src/extraction/patterns.ts`.

### Organisation

Les patterns sont organisés par catégorie :
- **PRICE_PATTERNS** : Prix (multi-devises, multi-formats)
- **REFERENCE_PATTERNS** : Références, SKU, EAN, GTIN, etc.
- **WEIGHT_PATTERNS** : Poids (kg, g, lb, oz)
- **DIMENSION_PATTERNS** : Dimensions (mm, cm, m, in)
- **BATTERY_PATTERNS** : Batteries (mAh, Ah, V, W)
- **AVAILABILITY_PATTERNS** : Disponibilité et stock
- **BRAND_PATTERNS** : Marques
- **MODEL_PATTERNS** : Modèles
- **CONDITION_PATTERNS** : État (neuf, occasion, reconditionné)
- **SHIPPING_PATTERNS** : Livraison
- **WARRANTY_PATTERNS** : Garantie

### Normalisation Automatique

Les valeurs extraites sont automatiquement normalisées :
- **Prix** → centimes + ISO 4217 (EUR, USD, GBP)
- **Poids** → grammes (g)
- **Dimensions** → millimètres (mm)
- **Batterie** → mAh

---

## Prix

**Total :** 18 patterns  
**Langues :** FR, EN  
**Devises :** EUR, USD, GBP, CHF

### Symboles de Devises

#### `EUR_SYMBOL`
```regex
/(\d+(?:[.,]\d{2})?)\s*€/g
```
**Exemples :**
- `120.00 €` → 120.00
- `99€` → 99
- `1 250,50 €` → 1 250,50

#### `EUR_SYMBOL_BEFORE`
```regex
/€\s*(\d+(?:[.,]\d{2})?)/g
```
**Exemples :**
- `€ 120.00` → 120.00
- `€99` → 99

#### `USD_SYMBOL`
```regex
/\$\s*(\d+(?:[.,]\d{2})?)/g
```
**Exemples :**
- `$ 99.99` → 99.99
- `$120.00` → 120.00

#### `GBP_SYMBOL`
```regex
/£\s*(\d+(?:[.,]\d{2})?)/g
```
**Exemples :**
- `£ 85.50` → 85.50
- `£99` → 99

### Codes de Devises (ISO 4217)

#### `EUR_CODE`, `USD_CODE`, `GBP_CODE`, `CHF_CODE`
```regex
/(\d+(?:[.,]\d{2})?)\s*EUR/gi
/(\d+(?:[.,]\d{2})?)\s*USD/gi
/(\d+(?:[.,]\d{2})?)\s*GBP/gi
/(\d+(?:[.,]\d{2})?)\s*CHF/gi
```
**Exemples :**
- `120.00 EUR` → 120.00 EUR
- `99.99 USD` → 99.99 USD
- `85 GBP` → 85 GBP
- `150 CHF` → 150 CHF

### Prix Labellisés (Français)

#### `PRICE_LABELED_FR`
```regex
/prix[\s:]+(\d+[.,]\d{2})/gi
```
**Exemples :**
- `Prix: 120.00` → 120.00
- `Prix 99,99` → 99,99

#### `PRICE_TTC_FR`
```regex
/(\d+[.,]\d{2})\s*€?\s*TTC/gi
```
**Exemples :**
- `120.00 € TTC` → 120.00
- `99,99 TTC` → 99,99

#### `PRICE_HT_FR`
```regex
/(\d+[.,]\d{2})\s*€?\s*HT/gi
```
**Exemples :**
- `100.00 € HT` → 100.00
- `85,50 HT` → 85,50

### Prix Labellisés (Anglais)

#### `PRICE_LABELED_EN`
```regex
/price[\s:]+(\d+[.,]\d{2})/gi
```
**Exemples :**
- `Price: 120.00` → 120.00
- `Price 99.99` → 99.99

### Prix avec Séparateurs de Milliers

#### `PRICE_WITH_THOUSANDS`
```regex
/(\d{1,3}(?:[.,\s]\d{3})*[.,]\d{2})\s*€?/g
```
**Exemples :**
- `1 250,50 €` → 1 250,50
- `1.250,50` → 1.250,50
- `1,250.50` → 1,250.50

---

## Références / SKU

**Total :** 12 patterns  
**Langues :** FR, EN  
**Types :** Référence, SKU, EAN, GTIN, UPC, Part Number

### Références (Français)

#### `REF_LABELED_FR`
```regex
/réf(?:érence)?[\s:.]+([A-Z0-9-_]{4,20})/gi
```
**Exemples :**
- `Référence: ABC12345` → ABC12345
- `Réf. 23572714` → 23572714
- `réf: XYZ-789` → XYZ-789

#### `REF_SHORT_FR`
```regex
/réf[\s:.]+([A-Z0-9-_]{4,20})/gi
```
**Exemples :**
- `Réf: ABC123` → ABC123

### Références (Anglais)

#### `REF_LABELED_EN`
```regex
/ref(?:erence)?[\s:.]+([A-Z0-9-_]{4,20})/gi
```
**Exemples :**
- `Reference: ABC123` → ABC123
- `Ref. XYZ789` → XYZ789

### SKU

#### `SKU_LABELED`
```regex
/SKU[\s:.]+([A-Z0-9-_]{4,20})/gi
```
**Exemples :**
- `SKU: ABC123456` → ABC123456
- `SKU XYZ-789` → XYZ-789

### Codes-Barres

#### `EAN_13`
```regex
/EAN[\s:.]*(\d{13})/gi
```
**Exemples :**
- `EAN: 1234567890123` → 1234567890123
- `EAN 9876543210987` → 9876543210987

#### `EAN_8`
```regex
/EAN[\s:.]*(\d{8})/gi
```
**Exemples :**
- `EAN: 12345678` → 12345678

#### `GTIN_13`, `GTIN_14`
```regex
/GTIN[\s:.]*(\d{13})/gi
/GTIN[\s:.]*(\d{14})/gi
```
**Exemples :**
- `GTIN: 1234567890123` → 1234567890123
- `GTIN-14: 12345678901234` → 12345678901234

#### `UPC`
```regex
/UPC[\s:.]*(\d{12})/gi
```
**Exemples :**
- `UPC: 123456789012` → 123456789012

### Part Numbers

#### `PART_NUMBER`
```regex
/(?:part|p\/n|partnumber)[\s:.]+([A-Z0-9-_]{4,20})/gi
```
**Exemples :**
- `Part Number: ABC-123` → ABC-123
- `P/N: XYZ789` → XYZ789

### Codes Produit

#### `CODE_PRODUIT_FR`
```regex
/code\s+produit[\s:.]+([A-Z0-9-_]{4,20})/gi
```
**Exemples :**
- `Code produit: ABC123` → ABC123

#### `PRODUCT_CODE_EN`
```regex
/product\s+code[\s:.]+([A-Z0-9-_]{4,20})/gi
```
**Exemples :**
- `Product code: XYZ789` → XYZ789

---

## Poids

**Total :** 8 patterns  
**Langues :** FR, EN  
**Unités :** kg, g, lb, oz  
**Normalisation :** → grammes (g)

### Kilogrammes

#### `WEIGHT_KG`
```regex
/(\d+(?:[.,]\d+)?)\s*kg/gi
```
**Exemples :**
- `2.5 kg` → 2.5 kg → **2500 g**
- `1,5 kg` → 1,5 kg → **1500 g**

#### `WEIGHT_KG_LABELED_FR`
```regex
/poids[\s:]+(\d+(?:[.,]\d+)?)\s*kg/gi
```
**Exemples :**
- `Poids: 2.5 kg` → 2.5 kg → **2500 g**

#### `WEIGHT_KG_LABELED_EN`
```regex
/weight[\s:]+(\d+(?:[.,]\d+)?)\s*kg/gi
```
**Exemples :**
- `Weight: 2.5 kg` → 2.5 kg → **2500 g**

### Grammes

#### `WEIGHT_G`
```regex
/(\d+)\s*g(?:rammes?)?(?:\s|$)/gi
```
**Exemples :**
- `500 g` → 500 g → **500 g**
- `250 grammes` → 250 g → **250 g**

#### `WEIGHT_G_LABELED_FR`
```regex
/poids[\s:]+(\d+)\s*g/gi
```
**Exemples :**
- `Poids: 500 g` → 500 g → **500 g**

#### `WEIGHT_G_LABELED_EN`
```regex
/weight[\s:]+(\d+)\s*g/gi
```
**Exemples :**
- `Weight: 500 g` → 500 g → **500 g**

### Livres (US)

#### `WEIGHT_LB`
```regex
/(\d+(?:[.,]\d+)?)\s*lbs?/gi
```
**Exemples :**
- `2.5 lbs` → 2.5 lb → **1134 g** (approximativement)
- `1 lb` → 1 lb → **454 g**

### Onces

#### `WEIGHT_OZ`
```regex
/(\d+(?:[.,]\d+)?)\s*oz/gi
```
**Exemples :**
- `16 oz` → 16 oz → **454 g** (approximativement)

---

## Dimensions

**Total :** 14 patterns  
**Langues :** FR, EN  
**Unités :** mm, cm, m, in  
**Normalisation :** → millimètres (mm)

### Dimensions 3D (L × W × H)

#### `DIMENSIONS_3D_CM`
```regex
/(\d+)\s*[x×]\s*(\d+)\s*[x×]\s*(\d+)\s*cm/gi
```
**Exemples :**
- `30 x 20 x 10 cm` → 30×20×10 cm → **300×200×100 mm**
- `50×40×30 cm` → 50×40×30 cm → **500×400×300 mm**

#### `DIMENSIONS_3D_MM`
```regex
/(\d+)\s*[x×]\s*(\d+)\s*[x×]\s*(\d+)\s*mm/gi
```
**Exemples :**
- `300 x 200 x 100 mm` → **300×200×100 mm**

#### `DIMENSIONS_3D_M`
```regex
/(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*m(?:\s|$)/gi
```
**Exemples :**
- `1.5 x 1.0 x 0.8 m` → 1.5×1.0×0.8 m → **1500×1000×800 mm**

### Dimensions 2D (L × W)

#### `DIMENSIONS_2D_CM`, `DIMENSIONS_2D_MM`
```regex
/(\d+)\s*[x×]\s*(\d+)\s*cm/gi
/(\d+)\s*[x×]\s*(\d+)\s*mm/gi
```
**Exemples :**
- `30 x 20 cm` → **300×200 mm**
- `500 x 300 mm` → **500×300 mm**

### Dimensions Labellisées (Français)

#### `LENGTH_FR`, `WIDTH_FR`, `HEIGHT_FR`, `DEPTH_FR`, `DIAMETER_FR`
```regex
/longueur[\s:]+(\d+(?:[.,]\d+)?)\s*(mm|cm|m)/gi
/largeur[\s:]+(\d+(?:[.,]\d+)?)\s*(mm|cm|m)/gi
/hauteur[\s:]+(\d+(?:[.,]\d+)?)\s*(mm|cm|m)/gi
/profondeur[\s:]+(\d+(?:[.,]\d+)?)\s*(mm|cm|m)/gi
/diamètre[\s:]+(\d+(?:[.,]\d+)?)\s*(mm|cm|m)/gi
```
**Exemples :**
- `Longueur: 30 cm` → 30 cm → **300 mm**
- `Largeur: 20 cm` → 20 cm → **200 mm**
- `Hauteur: 10 cm` → 10 cm → **100 mm**
- `Profondeur: 15 cm` → 15 cm → **150 mm**
- `Diamètre: 5 cm` → 5 cm → **50 mm**

### Dimensions Labellisées (Anglais)

#### `LENGTH_EN`, `WIDTH_EN`, `HEIGHT_EN`, `DEPTH_EN`, `DIAMETER_EN`
```regex
/length[\s:]+(\d+(?:[.,]\d+)?)\s*(mm|cm|m|in)/gi
/width[\s:]+(\d+(?:[.,]\d+)?)\s*(mm|cm|m|in)/gi
/height[\s:]+(\d+(?:[.,]\d+)?)\s*(mm|cm|m|in)/gi
/depth[\s:]+(\d+(?:[.,]\d+)?)\s*(mm|cm|m|in)/gi
/diameter[\s:]+(\d+(?:[.,]\d+)?)\s*(mm|cm|m|in)/gi
```
**Exemples :**
- `Length: 12 in` → 12 in → **305 mm** (approximativement)
- `Width: 8 in` → 8 in → **203 mm**

### Pouces (US)

#### `DIMENSIONS_INCHES`
```regex
/(\d+(?:[.,]\d+)?)\s*(?:in|inch|inches|")/gi
```
**Exemples :**
- `12 in` → 12 in → **305 mm**
- `15.5 inches` → 15.5 in → **394 mm**
- `24"` → 24 in → **610 mm**

---

## Batterie

**Total :** 6 patterns  
**Types :** Capacité (mAh, Ah), Voltage (V), Power (W, kW), Type  
**Normalisation :** → mAh

### Capacité

#### `CAPACITY_MAH`
```regex
/(\d+)\s*mAh/gi
```
**Exemples :**
- `3000 mAh` → **3000 mAh**
- `5000mAh` → **5000 mAh**

#### `CAPACITY_AH`
```regex
/(\d+(?:[.,]\d+)?)\s*Ah/gi
```
**Exemples :**
- `3 Ah` → 3 Ah → **3000 mAh**
- `5.5 Ah` → 5.5 Ah → **5500 mAh**

### Voltage

#### `VOLTAGE`
```regex
/(\d+(?:[.,]\d+)?)\s*V(?:olts?)?/gi
```
**Exemples :**
- `12 V` → 12 V
- `3.7 Volts` → 3.7 V

### Puissance

#### `POWER_W`
```regex
/(\d+(?:[.,]\d+)?)\s*W(?:atts?)?/gi
```
**Exemples :**
- `60 W` → 60 W
- `100 Watts` → 100 W

#### `POWER_KW`
```regex
/(\d+(?:[.,]\d+)?)\s*kW/gi
```
**Exemples :**
- `5.5 kW` → 5.5 kW → **5500 W**

### Type de Batterie

#### `BATTERY_TYPE`
```regex
/(?:Li-?ion|Lithium|NiMH|NiCd|Lead-?acid)/gi
```
**Exemples :**
- `Li-ion`
- `Lithium`
- `NiMH`
- `Lead-acid`

---

## Disponibilité

**Total :** 9 patterns  
**Langues :** FR, EN  
**États :** En stock, Rupture, Précommande

### En Stock (Français)

#### `IN_STOCK_FR`
```regex
/(?:en\s+stock|disponible|dispo)/gi
```
**Exemples :**
- `En stock`
- `Disponible`
- `Dispo`

#### `OUT_OF_STOCK_FR`
```regex
/(?:rupture|indisponible|épuisé|hors\s+stock)/gi
```
**Exemples :**
- `Rupture de stock`
- `Indisponible`
- `Épuisé`

#### `PREORDER_FR`
```regex
/(?:précommande|pré-?commande)/gi
```
**Exemples :**
- `Précommande`
- `Pré-commande`

### En Stock (Anglais)

#### `IN_STOCK_EN`
```regex
/(?:in\s+stock|available)/gi
```
**Exemples :**
- `In stock`
- `Available`

#### `OUT_OF_STOCK_EN`
```regex
/(?:out\s+of\s+stock|unavailable|sold\s+out)/gi
```
**Exemples :**
- `Out of stock`
- `Unavailable`
- `Sold out`

#### `PREORDER_EN`
```regex
/(?:pre-?order|backorder)/gi
```
**Exemples :**
- `Pre-order`
- `Backorder`

### Quantité en Stock

#### `STOCK_QUANTITY`
```regex
/(\d+)\s+(?:en|disponible|in)\s+stock/gi
```
**Exemples :**
- `15 en stock` → 15
- `5 disponible` → 5
- `20 in stock` → 20

#### `STOCK_UNIT_FR`
```regex
/(\d+)\s+(?:pièce|unité)s?\s+disponible/gi
```
**Exemples :**
- `10 pièces disponibles` → 10
- `5 unités disponibles` → 5

#### `STOCK_UNIT_EN`
```regex
/(\d+)\s+(?:piece|unit)s?\s+available/gi
```
**Exemples :**
- `10 pieces available` → 10
- `5 units available` → 5

---

## Marque

**Total :** 4 patterns  
**Langues :** FR, EN

#### `BRAND_LABELED_FR`
```regex
/marque[\s:]+([A-Z][A-Za-z0-9\s-]{2,30})/gi
```
**Exemples :**
- `Marque: PEUGEOT` → PEUGEOT
- `Marque Sony` → Sony

#### `BRAND_LABELED_EN`
```regex
/brand[\s:]+([A-Z][A-Za-z0-9\s-]{2,30})/gi
```
**Exemples :**
- `Brand: Apple` → Apple
- `Brand Samsung` → Samsung

#### `FABRICANT_FR`
```regex
/fabricant[\s:]+([A-Z][A-Za-z0-9\s-]{2,30})/gi
```
**Exemples :**
- `Fabricant: Renault` → Renault

#### `MANUFACTURER_EN`
```regex
/manufacturer[\s:]+([A-Z][A-Za-z0-9\s-]{2,30})/gi
```
**Exemples :**
- `Manufacturer: Dell` → Dell

---

## Modèle

**Total :** 2 patterns  
**Langues :** FR, EN

#### `MODEL_LABELED_FR`
```regex
/modèle[\s:]+([A-Z0-9][A-Za-z0-9\s-]{2,30})/gi
```
**Exemples :**
- `Modèle: 307` → 307
- `Modèle XPS-15` → XPS-15

#### `MODEL_LABELED_EN`
```regex
/model[\s:]+([A-Z0-9][A-Za-z0-9\s-]{2,30})/gi
```
**Exemples :**
- `Model: iPhone 13` → iPhone 13
- `Model A1234` → A1234

---

## Condition

**Total :** 6 patterns  
**Langues :** FR, EN  
**États :** Neuf, Occasion, Reconditionné

### Français

#### `NEW_FR`
```regex
/(?:neuf|nouveau)/gi
```
**Exemples :**
- `Neuf`
- `Nouveau`

#### `USED_FR`
```regex
/(?:occasion|usagé|d'occasion)/gi
```
**Exemples :**
- `Occasion`
- `D'occasion`
- `Usagé`

#### `REFURBISHED_FR`
```regex
/(?:reconditionné|rénové)/gi
```
**Exemples :**
- `Reconditionné`
- `Rénové`

### Anglais

#### `NEW_EN`
```regex
/(?:new|brand\s+new)/gi
```
**Exemples :**
- `New`
- `Brand new`

#### `USED_EN`
```regex
/(?:used|pre-?owned|second-?hand)/gi
```
**Exemples :**
- `Used`
- `Pre-owned`
- `Second-hand`

#### `REFURBISHED_EN`
```regex
/(?:refurbished|renewed|reconditioned)/gi
```
**Exemples :**
- `Refurbished`
- `Renewed`

---

## Livraison

**Total :** 4 patterns  
**Langues :** FR, EN

### Français

#### `FREE_SHIPPING_FR`
```regex
/(?:livraison\s+gratuite|frais\s+de\s+port\s+offerts?)/gi
```
**Exemples :**
- `Livraison gratuite`
- `Frais de port offerts`

#### `SHIPPING_COST_FR`
```regex
/(?:livraison|frais\s+de\s+port)[\s:]+(\d+[.,]\d{2})\s*€?/gi
```
**Exemples :**
- `Livraison: 5.90 €` → 5.90
- `Frais de port 10.00` → 10.00

### Anglais

#### `FREE_SHIPPING_EN`
```regex
/(?:free\s+shipping|free\s+delivery)/gi
```
**Exemples :**
- `Free shipping`
- `Free delivery`

#### `SHIPPING_COST_EN`
```regex
/(?:shipping|delivery)[\s:]+\$?(\d+[.,]\d{2})/gi
```
**Exemples :**
- `Shipping: $5.99` → 5.99
- `Delivery 10.00` → 10.00

---

## Garantie

**Total :** 4 patterns  
**Langues :** FR, EN  
**Unités :** Années, Mois

### Français

#### `WARRANTY_YEARS_FR`
```regex
/garantie[\s:]+(\d+)\s+ans?/gi
```
**Exemples :**
- `Garantie: 2 ans` → 2 ans
- `Garantie 1 an` → 1 an

#### `WARRANTY_MONTHS_FR`
```regex
/garantie[\s:]+(\d+)\s+mois/gi
```
**Exemples :**
- `Garantie: 6 mois` → 6 mois
- `Garantie 24 mois` → 24 mois

### Anglais

#### `WARRANTY_YEARS_EN`
```regex
/warranty[\s:]+(\d+)\s+years?/gi
```
**Exemples :**
- `Warranty: 2 years` → 2 years
- `Warranty 1 year` → 1 year

#### `WARRANTY_MONTHS_EN`
```regex
/warranty[\s:]+(\d+)\s+months?/gi
```
**Exemples :**
- `Warranty: 6 months` → 6 months
- `Warranty 12 months` → 12 months

---

## Keywords Classification

**Total :** 40 mots-clés (20 FR + 20 EN)

### E-commerce Keywords (30)

Utilisés pour identifier les pages e-commerce :

**Français :**
- prix, acheter, ajouter, panier, commander, commande
- livraison, stock, disponible, garantie, retour
- remboursement, paiement, achat, boutique

**Anglais :**
- price, buy, purchase, add, cart, order
- shipping, delivery, stock, available, warranty
- return, refund, payment, checkout, shop

### Product Keywords (30)

Utilisés pour identifier les pages produit :

**Français :**
- référence, réf, sku, ean, modèle, marque
- dimensions, poids, taille, couleur, caractéristiques
- spécifications, description, fiche, technique

**Anglais :**
- reference, ref, sku, ean, model, brand
- dimensions, weight, size, color, features
- specifications, specs, description, details

---

## Utilisation

### Import des Patterns

```typescript
import {
  PRICE_PATTERNS,
  REFERENCE_PATTERNS,
  WEIGHT_PATTERNS,
  DIMENSION_PATTERNS,
  ALL_PATTERNS,
} from "./src/extraction/patterns.ts";
```

### Utilisation Directe

```typescript
const text = "Prix: 120.00 EUR, Référence: ABC123";

// Prix
const priceMatch = text.match(PRICE_PATTERNS.EUR_CODE);
// priceMatch[1] === "120.00"

// Référence
const refMatch = text.match(REFERENCE_PATTERNS.REF_LABELED_FR);
// refMatch[1] === "ABC123"
```

### Via Pattern Matcher

```typescript
import { extractPrice, extractReference } from "./src/extraction/pattern_matcher.ts";

const text = "Prix: 120.00 EUR, Référence: ABC123";

const [err1, price] = extractPrice(text);
// price.amount === 12000 (centimes)
// price.currency === "EUR"

const [err2, reference] = extractReference(text);
// reference === "ABC123"
```

### Avec Context Extractor

```typescript
import { extractPriceByContext } from "./src/extraction/context_extractor.ts";

const text = "Le prix de vente est de 120.00 EUR pour ce produit.";

const [err, matches] = extractPriceByContext(text);
// matches[0].value === "120.00"
// matches[0].keyword === "prix"
// matches[0].confidence === 0.9
```

---

## Notes Techniques

### Format Décimal

Les patterns acceptent :
- Point comme séparateur décimal : `120.00`
- Virgule comme séparateur décimal : `120,00` (format européen)

### Séparateurs de Milliers

Les patterns gèrent :
- Point : `1.250,50` (format européen)
- Virgule : `1,250.50` (format US)
- Espace : `1 250,50` (format français)

### Case Insensitive

La plupart des patterns utilisent le flag `i` (case insensitive) :
- `Prix`, `PRIX`, `prix` → tous acceptés
- `EUR`, `eur`, `Eur` → tous acceptés

### Groupes de Capture

Les patterns utilisent des groupes de capture `()` pour extraire les valeurs :
```regex
/prix[\s:]+(\d+[.,]\d{2})/gi
         ^-- groupe 1 capturé
```

### Normalisation Automatique

Toutes les fonctions d'extraction (`extractPrice`, `extractWeight`, etc.) normalisent automatiquement les valeurs :
- `extractPrice("120.00 €")` → `{ amount: 12000, currency: "EUR" }`
- `extractWeight("2.5 kg")` → `{ value: 2500, unit: "g" }`

---

**Version :** 1.0  
**Dernière mise à jour :** 4 octobre 2025  
**Total Patterns :** 100+
