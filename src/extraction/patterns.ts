/**
 * Regex Patterns Library
 * 
 * Comprehensive collection of regex patterns for extracting product data
 * from text in French and English.
 */

/**
 * Price patterns (multi-currency, multi-format)
 */
export const PRICE_PATTERNS = {
  // European format with € symbol
  EUR_SYMBOL: /(\d+(?:[.,]\d{2})?)\s*€/g,
  EUR_SYMBOL_BEFORE: /€\s*(\d+(?:[.,]\d{2})?)/g,
  
  // Currency codes
  EUR_CODE: /(\d+(?:[.,]\d{2})?)\s*EUR/gi,
  USD_CODE: /(\d+(?:[.,]\d{2})?)\s*USD/gi,
  GBP_CODE: /(\d+(?:[.,]\d{2})?)\s*GBP/gi,
  CHF_CODE: /(\d+(?:[.,]\d{2})?)\s*CHF/gi,
  
  // Currency symbols
  USD_SYMBOL: /\$\s*(\d+(?:[.,]\d{2})?)/g,
  GBP_SYMBOL: /£\s*(\d+(?:[.,]\d{2})?)/g,
  
  // Labeled prices (French)
  PRICE_LABELED_FR: /prix[\s:]+(\d+[.,]\d{2})/gi,
  PRICE_TTC_FR: /(\d+[.,]\d{2})\s*€?\s*TTC/gi,
  PRICE_HT_FR: /(\d+[.,]\d{2})\s*€?\s*HT/gi,
  
  // Labeled prices (English)
  PRICE_LABELED_EN: /price[\s:]+(\d+[.,]\d{2})/gi,
  
  // Generic price with thousand separators
  PRICE_WITH_THOUSANDS: /(\d{1,3}(?:[.,\s]\d{3})*[.,]\d{2})\s*€?/g,
} as const;

/**
 * Reference/SKU patterns
 */
export const REFERENCE_PATTERNS = {
  // French
  REF_LABELED_FR: /réf(?:érence)?[\s:.]+([A-Z0-9-_]{4,20})/gi,
  REF_SHORT_FR: /réf[\s:.]+([A-Z0-9-_]{4,20})/gi,
  
  // English
  REF_LABELED_EN: /ref(?:erence)?[\s:.]+([A-Z0-9-_]{4,20})/gi,
  
  // SKU
  SKU_LABELED: /SKU[\s:.]+([A-Z0-9-_]{4,20})/gi,
  
  // Barcodes
  EAN_13: /EAN[\s:.]*(\d{13})/gi,
  EAN_8: /EAN[\s:.]*(\d{8})/gi,
  GTIN_13: /GTIN[\s:.]*(\d{13})/gi,
  GTIN_14: /GTIN[\s:.]*(\d{14})/gi,
  UPC: /UPC[\s:.]*(\d{12})/gi,
  
  // Part numbers
  PART_NUMBER: /(?:part|p\/n|partnumber)[\s:.]+([A-Z0-9-_]{4,20})/gi,
  
  // Product code (generic)
  CODE_PRODUIT_FR: /code\s+produit[\s:.]+([A-Z0-9-_]{4,20})/gi,
  PRODUCT_CODE_EN: /product\s+code[\s:.]+([A-Z0-9-_]{4,20})/gi,
} as const;

/**
 * Weight patterns (with normalization to grams)
 */
export const WEIGHT_PATTERNS = {
  // Kilograms
  WEIGHT_KG: /(\d+(?:[.,]\d+)?)\s*kg/gi,
  WEIGHT_KG_LABELED_FR: /poids[\s:]+(\d+(?:[.,]\d+)?)\s*kg/gi,
  WEIGHT_KG_LABELED_EN: /weight[\s:]+(\d+(?:[.,]\d+)?)\s*kg/gi,
  
  // Grams
  WEIGHT_G: /(\d+)\s*g(?:rammes?)?(?:\s|$)/gi,
  WEIGHT_G_LABELED_FR: /poids[\s:]+(\d+)\s*g/gi,
  WEIGHT_G_LABELED_EN: /weight[\s:]+(\d+)\s*g/gi,
  
  // Pounds (US)
  WEIGHT_LB: /(\d+(?:[.,]\d+)?)\s*lbs?/gi,
  
  // Ounces
  WEIGHT_OZ: /(\d+(?:[.,]\d+)?)\s*oz/gi,
} as const;

/**
 * Dimension patterns (with normalization to millimeters)
 */
export const DIMENSION_PATTERNS = {
  // 3D dimensions: L x W x H
  DIMENSIONS_3D_CM: /(\d+)\s*[x×]\s*(\d+)\s*[x×]\s*(\d+)\s*cm/gi,
  DIMENSIONS_3D_MM: /(\d+)\s*[x×]\s*(\d+)\s*[x×]\s*(\d+)\s*mm/gi,
  DIMENSIONS_3D_M: /(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*m(?:\s|$)/gi,
  
  // 2D dimensions: L x W
  DIMENSIONS_2D_CM: /(\d+)\s*[x×]\s*(\d+)\s*cm/gi,
  DIMENSIONS_2D_MM: /(\d+)\s*[x×]\s*(\d+)\s*mm/gi,
  
  // Labeled dimensions (French)
  LENGTH_FR: /longueur[\s:]+(\d+(?:[.,]\d+)?)\s*(mm|cm|m)/gi,
  WIDTH_FR: /largeur[\s:]+(\d+(?:[.,]\d+)?)\s*(mm|cm|m)/gi,
  HEIGHT_FR: /hauteur[\s:]+(\d+(?:[.,]\d+)?)\s*(mm|cm|m)/gi,
  DEPTH_FR: /profondeur[\s:]+(\d+(?:[.,]\d+)?)\s*(mm|cm|m)/gi,
  DIAMETER_FR: /diamètre[\s:]+(\d+(?:[.,]\d+)?)\s*(mm|cm|m)/gi,
  
  // Labeled dimensions (English)
  LENGTH_EN: /length[\s:]+(\d+(?:[.,]\d+)?)\s*(mm|cm|m|in)/gi,
  WIDTH_EN: /width[\s:]+(\d+(?:[.,]\d+)?)\s*(mm|cm|m|in)/gi,
  HEIGHT_EN: /height[\s:]+(\d+(?:[.,]\d+)?)\s*(mm|cm|m|in)/gi,
  DEPTH_EN: /depth[\s:]+(\d+(?:[.,]\d+)?)\s*(mm|cm|m|in)/gi,
  DIAMETER_EN: /diameter[\s:]+(\d+(?:[.,]\d+)?)\s*(mm|cm|m|in)/gi,
  
  // Inches (US)
  DIMENSIONS_INCHES: /(\d+(?:[.,]\d+)?)\s*(?:in|inch|inches|")/gi,
} as const;

/**
 * Battery capacity patterns
 */
export const BATTERY_PATTERNS = {
  // Capacity in mAh
  CAPACITY_MAH: /(\d+)\s*mAh/gi,
  CAPACITY_AH: /(\d+(?:[.,]\d+)?)\s*Ah/gi,
  
  // Voltage
  VOLTAGE: /(\d+(?:[.,]\d+)?)\s*V(?:olts?)?/gi,
  
  // Power
  POWER_W: /(\d+(?:[.,]\d+)?)\s*W(?:atts?)?/gi,
  POWER_KW: /(\d+(?:[.,]\d+)?)\s*kW/gi,
  
  // Battery type
  BATTERY_TYPE: /(?:Li-?ion|Lithium|NiMH|NiCd|Lead-?acid)/gi,
} as const;

/**
 * Availability/Stock patterns
 */
export const AVAILABILITY_PATTERNS = {
  // In stock (French)
  IN_STOCK_FR: /(?:en\s+stock|disponible|dispo)/gi,
  OUT_OF_STOCK_FR: /(?:rupture|indisponible|épuisé|hors\s+stock)/gi,
  PREORDER_FR: /(?:précommande|pré-?commande)/gi,
  
  // In stock (English)
  IN_STOCK_EN: /(?:in\s+stock|available)/gi,
  OUT_OF_STOCK_EN: /(?:out\s+of\s+stock|unavailable|sold\s+out)/gi,
  PREORDER_EN: /(?:pre-?order|backorder)/gi,
  
  // Stock quantity
  STOCK_QUANTITY: /(\d+)\s+(?:en|disponible|in)\s+stock/gi,
  STOCK_UNIT_FR: /(\d+)\s+(?:pièce|unité)s?\s+disponible/gi,
  STOCK_UNIT_EN: /(\d+)\s+(?:piece|unit)s?\s+available/gi,
} as const;

/**
 * Brand patterns
 */
export const BRAND_PATTERNS = {
  BRAND_LABELED_FR: /marque[\s:]+([A-Z][A-Za-z0-9\s-]{2,30})/gi,
  BRAND_LABELED_EN: /brand[\s:]+([A-Z][A-Za-z0-9\s-]{2,30})/gi,
  FABRICANT_FR: /fabricant[\s:]+([A-Z][A-Za-z0-9\s-]{2,30})/gi,
  MANUFACTURER_EN: /manufacturer[\s:]+([A-Z][A-Za-z0-9\s-]{2,30})/gi,
} as const;

/**
 * Model patterns
 */
export const MODEL_PATTERNS = {
  MODEL_LABELED_FR: /modèle[\s:]+([A-Z0-9][A-Za-z0-9\s-]{2,30})/gi,
  MODEL_LABELED_EN: /model[\s:]+([A-Z0-9][A-Za-z0-9\s-]{2,30})/gi,
} as const;

/**
 * Condition patterns
 */
export const CONDITION_PATTERNS = {
  NEW_FR: /(?:neuf|nouveau)/gi,
  USED_FR: /(?:occasion|usagé|d'occasion)/gi,
  REFURBISHED_FR: /(?:reconditionné|rénové)/gi,
  
  NEW_EN: /(?:new|brand\s+new)/gi,
  USED_EN: /(?:used|pre-?owned|second-?hand)/gi,
  REFURBISHED_EN: /(?:refurbished|renewed|reconditioned)/gi,
} as const;

/**
 * Shipping patterns
 */
export const SHIPPING_PATTERNS = {
  FREE_SHIPPING_FR: /(?:livraison\s+gratuite|frais\s+de\s+port\s+offerts?)/gi,
  SHIPPING_COST_FR: /(?:livraison|frais\s+de\s+port)[\s:]+(\d+[.,]\d{2})\s*€?/gi,
  
  FREE_SHIPPING_EN: /(?:free\s+shipping|free\s+delivery)/gi,
  SHIPPING_COST_EN: /(?:shipping|delivery)[\s:]+\$?(\d+[.,]\d{2})/gi,
} as const;

/**
 * Warranty patterns
 */
export const WARRANTY_PATTERNS = {
  WARRANTY_YEARS_FR: /garantie[\s:]+(\d+)\s+ans?/gi,
  WARRANTY_MONTHS_FR: /garantie[\s:]+(\d+)\s+mois/gi,
  
  WARRANTY_YEARS_EN: /warranty[\s:]+(\d+)\s+years?/gi,
  WARRANTY_MONTHS_EN: /warranty[\s:]+(\d+)\s+months?/gi,
} as const;

/**
 * Combined patterns for convenience
 */
export const ALL_PATTERNS = {
  ...PRICE_PATTERNS,
  ...REFERENCE_PATTERNS,
  ...WEIGHT_PATTERNS,
  ...DIMENSION_PATTERNS,
  ...BATTERY_PATTERNS,
  ...AVAILABILITY_PATTERNS,
  ...BRAND_PATTERNS,
  ...MODEL_PATTERNS,
  ...CONDITION_PATTERNS,
  ...SHIPPING_PATTERNS,
  ...WARRANTY_PATTERNS,
} as const;

/**
 * E-commerce keywords (for classification)
 */
export const ECOMMERCE_KEYWORDS = [
  // French
  "prix", "acheter", "ajouter", "panier", "commander", "commande",
  "livraison", "stock", "disponible", "garantie", "retour",
  "remboursement", "paiement", "achat", "boutique",
  
  // English
  "price", "buy", "purchase", "add", "cart", "order",
  "shipping", "delivery", "stock", "available", "warranty",
  "return", "refund", "payment", "checkout", "shop",
] as const;

/**
 * Product keywords (for classification)
 */
export const PRODUCT_KEYWORDS = [
  // French
  "référence", "réf", "sku", "ean", "modèle", "marque",
  "dimensions", "poids", "taille", "couleur", "caractéristiques",
  "spécifications", "description", "fiche", "technique",
  
  // English
  "reference", "ref", "sku", "ean", "model", "brand",
  "dimensions", "weight", "size", "color", "features",
  "specifications", "specs", "description", "details",
] as const;
