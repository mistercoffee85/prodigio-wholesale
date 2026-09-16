import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Weights in grams from teaballs.ch Shopify API
const WEIGHTS = {
  // === TEABALLS Glasflaschen — 80g each ===
  'TEABALLS Apfel – Glasflasche': 80,
  'TEABALLS Earl Grey – Glasflasche': 80,
  'TEABALLS Energy – Glasflasche': 80,
  'TEABALLS Erdbeere – Glasflasche': 80,
  'TEABALLS Grüner Tee – Glasflasche': 80,
  'TEABALLS Hibiskus – Glasflasche': 80,
  'TEABALLS Himbeere – Glasflasche': 80,
  'TEABALLS Kirsch – Glasflasche': 80,
  'TEABALLS Minze – Glasflasche': 80,
  'TEABALLS Orange – Glasflasche 150er': 80,
  'TEABALLS Pfirsich – Glasflasche': 80,
  'TEABALLS Wildberry – Glasflasche': 80,
  'TEABALLS Zitrone Vitamin C – Glasflasche': 80,

  // === TEABALLS Bio Glasflaschen — 80g each ===
  'Bio Ingwer Teaballs 75 Tassen': 80,
  'Chai Latte Teaballs – zuckerfrei': 80,
  'Guten Abend Tee Presslinge Bio': 80,
  'Ingwer Kurkuma Orangentee TEABALLS': 80,
  'Jasmin Grüner Tee Bio | Naturtrüb': 80,
  'TEABALLS Bio – Zimt Orange': 80,
  'Teaballs Bio Pflaume Zimt': 80,
  'Teaballs Guten Morgen Tee Bio': 80,

  // === 100g Vorratsgläser — 100g each, sold as 6er Pack ===
  'TEABALLS Himbeere – 100g Vorratsglas': 600,   // 6 × 100g
  'TEABALLS Minze – 100g Vorratsglas': 600,
  'TEABALLS Pfirsich – 100g Vorratsglas': 600,
  'TEABALLS Wildberry – 100g Vorratsglas': 600,
  'TEABALLS Zitrone – 100g Vorratsglas': 600,

  // === 500g Vorratsgläser — 510g each, sold as 6er Pack ===
  'TEABALLS Minze – 500g Vorratsglas': 3060,     // 6 × 510g
  'TEABALLS Wildberry – 500g Vorratsglas': 3060,
  'TEABALLS Zitrone – 500g Vorratsglas': 3060,

  // === Tea-Packs 100er Gastrobox ===
  // 100 sachets, 180g per box (confirmed)
  'TEABALLS heiß & kalt – Earl Grey 100er Gastrobox': 180,
  'TEABALLS heiß & kalt – Minze 100er Gastrobox': 180,
  'TEABALLS heiß & kalt – Wildberry 100er Gastrobox': 180,
  'TEABALLS heiß & kalt – Zitrone 100er Gastrobox': 180,

  // === Tea-Packs 12er Box ===
  // 12 sachets, 20g per box (confirmed)
  'TEABALLS heiß & kalt – Earl Grey 12er Box': 20,
  'TEABALLS heiß & kalt – Grüner Tee 12er Box': 20,
  'TEABALLS heiß & kalt – Pfefferminze 12er Box': 20,
  'TEABALLS heiß & kalt – Wildberry 12er Box': 20,
  'TEABALLS heiß & kalt – Zitrone 12er Box': 20,

  // === Probier-Teebox (B2B: 6er Pack · Box) ===
  'Teaballs Naturtrüb Probier-Teebox | 20 Sorten': 750, // 6 × 125g

  // === Bubble Tea Fruchtperlen 240g ===
  'Bubble Tea Fruchtperlen Aprikose – 240g': 340,     // 240g + Glas ~100g
  'Bubble Tea Fruchtperlen Blutorangen – 240g': 340,
  'Bubble Tea Fruchtperlen Himbeere – 240g': 340,
  'Bubble Tea Fruchtperlen Litschi – 240g': 340,
  'Bubble Tea Fruchtperlen Mango – 240g': 340,
  'Bubble Tea Fruchtperlen Passionsfrucht – 240g': 340,
  'Bubble Tea Fruchtperlen Pfirsich – 240g': 340,
  'Bubble Tea Fruchtperlen Piña Colada – 240g': 340,
  'Bubble Tea Fruchtperlen Walderdbeere – 240g': 340,
  'Karamell Popping Boba – Salted Caramel 240g': 340,

  // === Bubble Tea Fruchtperlen 1.5kg ===
  'Bubble Tea Fruchtperlen Himbeere – 1.5kg': 1700,   // 1500g + Eimer ~200g
  'Bubble Tea Fruchtperlen Litschi – 1.5kg': 1700,
  'Bubble Tea Fruchtperlen Mango – 1.5kg': 1700,
  'Bubble Tea Fruchtperlen Passionsfrucht – 1.5kg': 1700,
  'Bubble Tea Fruchtperlen Waldbeeren-Erdbeer – 1.5kg': 1700,

  // === Bubble Tea Tapiokaperlen ===
  'Bubble Tea Tapiokaperlen Schwarz – 250g': 280,

  // === Bubble Tea Sets (6 Portionen) ===
  'Bubble Tea Set Mango – 6 Portionen': 500,
  'Bubble Tea Set Matcha Latte – 6 Portionen': 500,
  'Bubble Tea Set Passionsfrucht – 6 Portionen': 500,
  'Bubble Tea Set Passionsfrucht & Himbeere – 6 Portionen': 500,

  // === Bubble Tea Zubehör ===
  'Bubble Tea Becher aus Glas': 300,
  'Bubble Tea Löffel': 20,
  'Bubble Tea Strohhalme aus Zuckerrohr – 100 Stück': 200,
  'Bubble Tea Strohhalme aus Zuckerrohr – 50 Stk': 100,
  'Bubble Tea Trinkhalm aus Edelstahl': 30,
  'Bubble Tea Trinkhalmset aus Edelstahl': 60,

  // === BobaJoy Ready-to-Drink (6er Tray, 330ml Glasflaschen) ===
  'BobaJoy Ready-to-Drink Green Apple Smile': 3000,   // 6 × ~500g (330ml + Glasflasche)
  'BobaJoy Ready-to-Drink Passion Vibe': 3000,
  'BobaJoy Ready-to-Drink Strawberry Glow': 3000,

  // === Schokolade / Süsswaren (Gewicht im Unit-String) ===
  "Angel's Hair White Chocolate Cotton Candy Pistachio Cream, 180g": 200,
  "Angel's Hair White Chocolate Cotton Candy Pistachio Cream, 90g": 100,
  'Berry Mix Chocolate Coated Freeze Dried Dragee,60g': 70,
  'Dark Chocolate Cherry Stick,80g': 90,
  'Dark Chocolate Lemon Stick,80g': 90,
  'Dark Chocolate Orange Stick,80g': 90,
  'Freeze Dried Dark Chocolate Strawberry Dragee,80g': 90,
  'Freeze Dried Mango Dragées – Milch & Weisse Schokolade 27% K': 70,
  'Freeze Dried Milk Chocolate Strawberry Dragee,80g': 90,
  'Freeze Dried White Chocolate Strawberry Dragee,80g': 90,
  'Glazed Full Covered Dark Chocolate Orange Slice,80g': 90,
  'Milk Chocolate Cookie with Pistachio and Kadayif Filling, 60': 70,
  'Patislove Orange Gummy – Milk Chocolate Covered': 50,
  'Patislove Pistazien Creme – 200g': 220,
  'Pistachio & Kadayif Milk Chocolate, 100G': 110,
  'Pistachio & Kadayif Milk Chocolate, 30G': 40,
  'Pistachio Cream and Baklava Crumbs Filled Milk Chocolate, 10': 110,
  'Pistachio Cream and Knafeh Filled Milk Chocolate Truffle, 10': 110,
  'Pistachio White Chocolate Covered Freeze-Dried Strawberry,60': 70,
  'White Chocolate Pistachio Cream & Baklava Crumbs,100G': 110,
  'THE GOURMET MALLOWS GIFT BOX': 150,
  'THE MALLOWS BLACKCURRANT & WHITE CHOC - CHOC COATED MARSHMAL': 100,
  'THE MALLOWS COFFEE & CARAMEL + SALT & WHITE CHOC 90g': 100,
  'THE MALLOWS FLAKED SALT + BELGIAN DARK CHOC 90g': 100,
  'THE MALLOWS MALLOW HEARTS - RASPBERRY + WHITE CHOC 90g ♥': 100,
  'THE MALLOWS SALTED CARAMEL + BELGIAN MILK CHOC 90g': 100,
  'THE MALLOWS SOUR LEMON + VANILLA 80g': 90,
  'THE MALLOWS STRAWBERRY FILLED MALLOWS + RICH RASPBERRY BOX': 30,

  // === Haushalt ===
  'WhiteBear ET-2P250 – Zellstoff-Küchenpapier 2-lagig': 800,  // 6 Rollen
}

async function main() {
  const products = await prisma.product.findMany({ where: { active: true }, select: { id: true, name: true, weight: true } })
  
  let updated = 0
  let skipped = 0
  const missing = []
  
  for (const p of products) {
    // Try exact match first, then partial
    let grams = WEIGHTS[p.name]
    
    if (grams == null) {
      // Try matching by trimming the name (some names are truncated in DB)
      for (const [key, val] of Object.entries(WEIGHTS)) {
        if (key.startsWith(p.name.substring(0, 30)) && p.name.substring(0, 30).length > 10) {
          grams = val
          break
        }
      }
    }
    
    if (grams != null) {
      const kg = grams / 1000
      await prisma.product.update({ where: { id: p.id }, data: { weight: kg } })
      console.log(`✓ ${p.name.substring(0,55).padEnd(57)} → ${kg} kg (${grams}g)`)
      updated++
    } else {
      console.log(`✗ ${p.name.substring(0,55).padEnd(57)} — KEIN GEWICHT`)
      missing.push(p.name)
      skipped++
    }
  }
  
  console.log(`\n${updated} aktualisiert, ${skipped} ohne Gewicht`)
  if (missing.length) {
    console.log('\nFehlende Produkte:')
    missing.forEach(n => console.log('  -', n))
  }
}

main().then(() => prisma.$disconnect())
