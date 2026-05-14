'use strict'
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  console.log('Fixing Migroweb product data...')

  // 1. Fix unit: 'N Stk/Karton' → 'N Pz'
  const fixedUnits = await p.$executeRawUnsafe(`
    UPDATE products 
    SET unit = REGEXP_REPLACE(unit, '(\\d+) Stk/Karton', '\\1 Pz')
    WHERE "supplierSource" = 'migroweb' 
    AND unit LIKE '% Stk/Karton'
  `)
  console.log('Fixed Stk/Karton units:', fixedUnits)

  const fixed1 = await p.product.updateMany({
    where: { supplierSource: 'migroweb', unit: '1 Stk' },
    data: { unit: '1 Pz' },
  })
  console.log('Fixed 1 Stk → 1 Pz:', fixed1.count)

  // 2. Write basic details for products with empty details
  const basicDetails = await p.$executeRawUnsafe(`
    UPDATE products 
    SET details = jsonb_build_object(
      'Artikelnr.', "supplierSku",
      'VE', unit,
      'Lieferant', 'Cash & Carry'
    )
    WHERE "supplierSource" = 'migroweb' 
    AND "supplierSku" IS NOT NULL
    AND (details::text = '{}' OR details IS NULL)
  `)
  console.log('Basic details set:', basicDetails)

  // 3. Fix descriptions (currently = name for most products)
  const fixedDesc = await p.$executeRawUnsafe(`
    UPDATE products
    SET description = name || ' – VE: ' || unit || ' | Artikelnr. ' || "supplierSku"
    WHERE "supplierSource" = 'migroweb'
    AND "supplierSku" IS NOT NULL
    AND length(description) < 20
  `)
  console.log('Descriptions improved:', fixedDesc)

  // 4. Verify
  const sample = await p.product.findMany({
    where: { supplierSource: 'migroweb', supplierSku: { not: null } },
    select: { name: true, unit: true, details: true, description: true, images: true },
    take: 3,
  })
  console.log('\nSample after fix:')
  sample.forEach(s => {
    console.log(' -', s.name)
    console.log('   unit:', s.unit)
    console.log('   details:', JSON.stringify(s.details))
    console.log('   desc:', s.description?.slice(0, 80))
    console.log('   img:', s.images?.[0])
  })
}

main().catch(console.error).finally(() => p.$disconnect())
