import path from 'node:path'
import ejs from 'ejs'

const subscription = process.env.SUBSCRIPTION_URL
const confPath = path.resolve(process.cwd(), 'src/templates', 'config.ejs')

/**
 * 是否存在值
 * @template T
 * @param {T} value
 * @returns {value is NonNullable<T>}
 */
const isPresent = (value) => typeof value !== 'undefined' && value !== null

/**
 * @template T
 * @param {T} value
 * @param {NonNullable<T>} defaultValue
 */
const getIfPresent = (value, defaultValue) => {
  return isPresent(value) ? value : defaultValue
}

/**
 * @param {string} url
 */
const fetchProxies = async (url) => {
  const text = await fetch(url).then((resp) => resp.text())
  const lines = atob(text).split('\n')
  return lines.map((line) => {
    if (/^ss:\/\//.test(line)) {
      const i = line.indexOf('#')
      let name = line.substring(i + 1)
      name = name.match(/@(.*?)\./)[1]
      const decry = atob(line.substring(5, i))
      const regex = /^(.*?):(.*?)@(.*?):(\d+)$/
      const [_, cipher, password, server, port] = decry.match(regex)
      return { name, server, port, cipher, password, type: 'ss' }
    } else if (/^vmess:\/\//.test(line)) {
      /**
       * @typedef {object} Vmess
       * @property {string} ps
       * @property {string} port
       * @property {string} id
       * @property {number} aid
       * @property {string} net
       * @property {string} type
       * @property {'none'|boolean} tls
       * @property {string} add
       * @property {string} [scy]
       */
      /** @type {Vmess} */
      const decry = JSON.parse(atob(line.substring(8)))
      let name = decry.ps
      name = name.match(/@(.*?)\./)[1]
      return {
        name,
        server: decry.add,
        port: decry.port,
        type: 'vmess',
        uuid: decry.id,
        alterId: decry.aid,
        udp: true,
        tls: decry.tls === true,
        cipher: getIfPresent(decry.scy, 'auto')
      }
    }
  })
}

/**
 * @param {import('next/server').NextRequest} request
 */
export async function GET(request) {
  const { searchParams } = request.nextUrl
  const url = searchParams.get('url') || subscription
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