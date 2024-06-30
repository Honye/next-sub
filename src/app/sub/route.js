import path from 'node:path'
import { Agent } from 'undici'
import ejs from 'ejs'
import { parseVmess, parseSS, parseSSR } from './parser'
import base from './sing-box/base.json'

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
  return lines.map((line) => {
    if (/^ss:\/\//.test(line)) {
      return parseSS(line)
    } else if (/^vmess:\/\//.test(line)) {
      return parseVmess(line)
    } else if (/^ssr:\/\//.test(line)) {
      return parseSSR(line)
    } else {
      return { type: 'unkown' }
    }
  })
}

/**
 * @param {import('./parser').ClashConfig[]} proxies
 */
const genSingBoxConfig = (proxies) => {
  const tags = []
  const outbounds = []
  for (const proxy of proxies) {
    if (proxy.type === 'ss') {
      outbounds.push({
        type: 'shadowsocks',
        tag: proxy.name,
        server: proxy.server,
        server_port: proxy.port,
        method: proxy.cipher,
        password: proxy.password,
      })
      tags.push(proxy.name)
    } else if (proxy.type === 'ssr') {
      // outbounds.push({})
      // tags.push(proxy.name)
    } else if (proxy.type === 'vmess') {
      outbounds.push({
        type: 'vmess',
        tag: proxy.name,
        server: proxy.server,
        server_port: proxy.port,
        uuid: proxy.uuid,
        security: proxy.cipher,
        alter_id: proxy.alterId,
        global_padding: false,
        // "network": "tcp"
      })
      tags.push(proxy.name)
    }
  }
  outbounds.push(
    ...['Proxy', 'OpenAI', 'TikTok'].map((tag) => ({
      tag,
      type: 'selector',
      outbounds: tags,
      default: tags[0]
    })),
  )
  base.outbounds = [...base.outbounds, ...outbounds]
  return base
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
  /** @type {'clash'|'sing'} */
  const target = searchParams.get('target') || 'clash'

  if (target === 'sing') {
    const singBox = genSingBoxConfig(proxies)
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