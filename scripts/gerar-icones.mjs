/**
 * Gera os PNGs da PWA (pwa-192, pwa-512, apple-touch-icon) sem dependências:
 * mesmo desenho do favicon.svg — duas "torres" sobre fundo escuro.
 * Substituir pelos ícones com a marca do escritório na Fase 9.
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const TABELA_CRC = (() => {
  const tabela = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    tabela[n] = c
  }
  return tabela
})()

function crc32(buf) {
  let c = -1
  for (let i = 0; i < buf.length; i++) {
    c = TABELA_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ -1) >>> 0
}

function chunk(tipo, dados) {
  const tamanho = Buffer.alloc(4)
  tamanho.writeUInt32BE(dados.length)
  const t = Buffer.from(tipo, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([t, dados])))
  return Buffer.concat([tamanho, t, dados, crc])
}

const FUNDO = [26, 26, 26] // #1a1a1a
const DESTAQUE = [224, 90, 51] // #e05a33
const OFFWHITE = [250, 248, 245] // #faf8f5

function pixel(x, y, tam) {
  const fx = x / tam
  const fy = y / tam
  // torre laranja
  if (fx >= 0.23 && fx < 0.47 && fy >= 0.28 && fy < 0.77) return DESTAQUE
  // torre off-white, mais baixa
  if (fx >= 0.55 && fx < 0.79 && fy >= 0.42 && fy < 0.77) return OFFWHITE
  return FUNDO
}

function gerarPng(tam) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(tam, 0)
  ihdr.writeUInt32BE(tam, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // truecolor RGB

  const linhas = []
  for (let y = 0; y < tam; y++) {
    const linha = Buffer.alloc(1 + tam * 3) // byte 0 = filtro None
    for (let x = 0; x < tam; x++) {
      const [r, g, b] = pixel(x, y, tam)
      linha[1 + x * 3] = r
      linha[2 + x * 3] = g
      linha[3 + x * 3] = b
    }
    linhas.push(linha)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(linhas))),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
mkdirSync(raiz, { recursive: true })

for (const [nome, tam] of [
  ['pwa-192.png', 192],
  ['pwa-512.png', 512],
  ['apple-touch-icon.png', 180],
]) {
  writeFileSync(join(raiz, nome), gerarPng(tam))
  console.log(`gerado public/${nome} (${tam}x${tam})`)
}
