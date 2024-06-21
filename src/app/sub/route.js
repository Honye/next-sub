import path from 'node:path'
import ejs from 'ejs'
import { parseVmess, parseSS, parseSSR } from './parser'

const subscription = process.env.SUBSCRIPTION_URL
const confPath = path.resolve(process.cwd(), 'src/templates', 'config.ejs')

/**
 * @param {string} url
 */
const fetchProxies = async (url) => {
  const text = await fetch(url).then((resp) => resp.text())
  const lines = atob(text).split('\n')
  return lines.map((line) => {
    if (/^ss:\/\//.test(line)) {
      return parseSS(line)
    } else if (/^vmess:\/\//.test(line)) {
      return parseVmess(line)
    } else if (/^ssr:\/\//.test(line)) {
      return parseSSR(line)
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