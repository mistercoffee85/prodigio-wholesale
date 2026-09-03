import { put } from '@vercel/blob'
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'

// Load .env.local manually
const envRaw = readFileSync(new URL('../.env.local', import.meta.url), 'utf-8')
for (const line of envRaw.split('\n')) {
  const m = line.match(/^([^#=]+)=["']?(.+?)["']?\s*$/)
  if (m) process.env[m[1].trim()] = m[2].trim()
}

const p = new PrismaClient()

const IMG_DIR = '/Users/devitagionatan/Desktop/Tea Packs'

const MAPPING = [
  { slug: 'teaballs-earl-grey-12er',    file: '12er Sachetbox_Earl Grey.jpeg' },
  { slug: 'teaballs-gruener-tee-12er',  file: '12er Sachetbox_Grüner Tee.jpeg' },
  { slug: 'teaballs-pfefferminze-12er', file: '12er Sachetbox_Minze.jpeg' },
  { slug: 'teaballs-wildberry-12er',    file: '12er Sachetbox_Wildberry.jpeg' },
  { slug: 'teaballs-zitrone-12er',      file: '12er Sachetbox_Zitrone.jpeg' },
  { slug: 'teaballs-earl-grey-100er',   file: '100er Sachetbox_Earl Grey.jpeg' },
  { slug: 'teaballs-minze-100er',       file: '100er Sachetbox_Minze.jpeg' },
  { slug: 'teaballs-wildberry-100er',   file: '100er Sachetbox_Wildberry.jpeg' },
  { slug: 'teaballs-zitrone-100er',     file: '100er Sachetbox_Zitrone.jpeg' },
]

async function main() {
  for (const { slug, file } of MAPPING) {
    const filePath = `${IMG_DIR}/${file}`
    const buffer = readFileSync(filePath)
    const blobName = `products/teaballs/${slug}.jpeg`

    console.log(`⬆️  Uploading ${file}...`)
    const blob = await put(blobName, buffer, {
      access: 'public',
      contentType: 'image/jpeg',
      allowOverwrite: true,
    })

    await p.product.update({
      where: { slug },
      data: { images: [blob.url] },
    })
    console.log(`✓  ${slug} → ${blob.url}`)
  }

  console.log('\n✅ Alle Bilder hochgeladen und verknüpft.')
}

main().catch(console.error).finally(() => p.$disconnect())
