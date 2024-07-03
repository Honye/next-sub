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