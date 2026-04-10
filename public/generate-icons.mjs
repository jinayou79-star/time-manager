import sharp from 'sharp'

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="black" rx="80"/>
  <circle cx="256" cy="256" r="160" fill="none" stroke="white" stroke-width="24"/>
  <line x1="256" y1="256" x2="256" y2="140" stroke="white" stroke-width="20" stroke-linecap="round"/>
  <line x1="256" y1="256" x2="320" y2="290" stroke="white" stroke-width="16" stroke-linecap="round"/>
  <circle cx="256" cy="256" r="12" fill="white"/>
</svg>`

const buffer = Buffer.from(svg)

await sharp(buffer).resize(192, 192).png().toFile('public/pwa-192x192.png')
await sharp(buffer).resize(512, 512).png().toFile('public/pwa-512x512.png')

console.log('아이콘 생성 완료!')