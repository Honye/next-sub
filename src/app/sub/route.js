import path from 'node:path'
import { Agent } from 'undici'
import ejs from 'ejs'
import { parseVmess, parseSS, parseSSR } from './parser'
import { genSingBoxConfig } from './sing-box'

const subscription = process.env.SUBSCRIPTION_URL
const confPath = path.resolve(process.cwd(), 'src/templates', 'config.ejs')
const compSelect = path.resolve(process.cwd(), 'src/templates', 'select.ejs')
console.log('Dont remove', typeof compSelect)

const agent = new Agent({
  connect: {
    rejectUnauthorized: false
  }
})

/**
 * @param {string} url
 */
const fetchProxies = async (url) => {
  const text = await fetch(url, { dispatcher: agent }).then((resp) => resp.text())
  const lines = atob(text).trim().split('\n')
  const countryEmoji = {
    US: '🇺🇸',
    JP: '🇯🇵',
    CA: '🇨🇦'
  }

  /** @type {string[]} */
  const servers = []
  /** @type {Record<string, number>} */
  const serversIndex = {}
  const proxies = lines.map((line, i) => {
    if (/^ss:\/\//.test(line)) {
      const proxy = parseSS(line)
      servers.push(proxy.server)
      serversIndex[proxy.server] = i
      return proxy
    } else if (/^vmess:\/\//.test(line)) {
      const proxy = parseVmess(line)
      servers.push(proxy.server)
      serversIndex[proxy.server] = i
      return proxy
    } else if (/^ssr:\/\//.test(line)) {
      const proxy = parseSSR(line)
      servers.push(proxy.server)
      serversIndex[proxy.server] = i
      return proxy
    } else {
      return { type: 'unkown' }
    }
  })
  const countries = await fetch('http://ip-api.com/batch?fields=countryCode', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(servers)
  }).then((resp) => resp.json())
  countries.forEach(({ countryCode }, i) => {
    const emoji = countryEmoji[countryCode]
    if (emoji) {
      const server = servers[i]
      const proxy = proxies[serversIndex[server]]
      proxy.name = `${emoji} ${proxy.name}`
    }
  })
  return proxies
}

/**
 * @param {import('next/server').NextRequest} request
 */
export async function GET(request) {
  const { searchParams } = request.nextUrl
  const url = searchParams.get('url') || subscription
  if (!url) {
    return new Response('No env, no subscription.', {
      status: 400,
      headers: {
        'Content-Type': 'text/html;charset=utf-8'
      }
    })
  }

  const proxies = await fetchProxies(url)
  const target = /** @type {'clash'|'sing'} */(searchParams.get('target') || 'clash')
  const include = searchParams.get('include')

  if (target === 'sing') {
    const singBox = genSingBoxConfig(proxies, { include })
    return Response.json(singBox, { status: 200 })
  }

  const result = await new Promise((resolve, reject) => {
    ejs.renderFile(
      confPath,
      { proxies },
      (err, str) => {
        if (err) {
          reject(err)
        } else {
          resolve(str)
        }
      }
    )
  })
  return new Response(result, { status: 200 })
}