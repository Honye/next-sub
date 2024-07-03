// @ts-check
import fs from 'node:fs'
import base from './sing-box/base.json'

/**
 * @param {import('./parser').ClashConfig[]} proxies
 * @param {object} options
 * @param {string} [options.include] include other config filepath
 */
export const genSingBoxConfig = (proxies, { include }) => {
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
      // sing-box not support
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
  if (include) {
    if (fs.existsSync(include)) {
      const buffter = fs.readFileSync(include)
      const extra = JSON.parse(buffter.toString('utf8'))
      for (const outbound of extra.outbounds) {
        outbounds.push(outbound)
        tags.push(outbound.tag)
      }
    }
  }
  outbounds.push(
    {
      tag: 'Wechat',
      type: 'selector',
      outbounds: ['Proxy', ...tags, 'DIRECT'],
      default: 'DIRECT'
    },
    {
      tag: 'Proxy',
      type: 'selector',
      outbounds: [...tags, 'DIRECT'],
      default: tags[0] || 'DIRECT'
    },
    ...['OpenAI', 'TikTok'].map((tag) => ({
      tag,
      type: 'selector',
      outbounds: ['Proxy', ...tags, 'DIRECT'],
      default: 'Proxy'
    })),
  )
  const result = JSON.parse(JSON.stringify(base))
  result.outbounds = [...result.outbounds, ...outbounds]
  return result
}