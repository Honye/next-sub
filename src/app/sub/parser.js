import { getIfPresent, getIfNotBlank } from '@/utils/base'
import { decode } from 'js-base64'

/**
 * @typedef ClashVmess
 * @property {'vmess'} type
 * @property {string} name
 * @property {string} server
 * @property {number} port
 * @property {string} uuid
 * @property {number} alterId
 * @property {boolean} udp
 * @property {boolean} tls
 * @property {string} cipher
 */
/**
 * @param {string} str
 * @returns {ClashVmess}
 */
export function parseVmess(str) {
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
  const decry = JSON.parse(atob(str.substring(8)))
  let name = decry.ps
  name = name.match(/@(.*?)\./)[1]
  return {
    name,
    server: decry.add,
    port: Number(decry.port),
    type: 'vmess',
    uuid: decry.id,
    alterId: decry.aid,
    udp: true,
    tls: decry.tls === true,
    cipher: getIfPresent(decry.scy, 'auto')
  }
}

/**
 * @typedef {object} ClashSS
 * @property {'ss'} type
 * @property {string} name
 * @property {string} server
 * @property {number} port
 * @property {string} cipher
 * @property {string} password
 */
/**
 * @param {string} str
 * @returns {ClashSS}
 */
export function parseSS(str) {
  const i = str.indexOf('#')
  let name = str.substring(i + 1)
  name = name.match(/@(.*?)\./)?.[1] || name
  const decry = atob(str.substring(5, i))
  const regex = /^(.*?):(.*?)@(.*?):(\d+)$/
  const [_, cipher, password, server, port] = decry.match(regex)
  return { name, server, port: Number(port), cipher, password, type: 'ss' }
}

/**
 * @typedef {object} ClashSSR
 * @property {'ssr'} type
 * @property {string} server
 * @property {number} port
 * @property {string} protocol
 * @property {string} cipher
 * @property {string} obfs
 * @property {string} password
 * @property {string} obfs-param
 * @property {string} protocol-param
 * @property {string} name
 */
/**
 * @param {string} str
 */
export function parseSSR(str) {
  const [decry, search] = atob(str.substring(6)).split('/?')
  const regex = /^(\S+):(\d+?):(\S+?):(\S+?):(\S+?):(\S+)/
  const [_, server, port, protocol, cipher, obfs, password] = decry.match(regex)
  /** @type {ClashSSR} */
  const proxy = { type: 'ssr', server, port: Number(port), protocol, cipher, obfs, password: atob(password) }
  if (search) {
    const params = new URLSearchParams(search)
    proxy['obfs-param'] = atob(params.get('obfsparam'))
    proxy['protocol-param'] = atob(params.get('protoparam'))
    proxy.name = decode(params.get('remarks'))
    proxy.group = atob(params.get('group'))
    proxy.udpport = params.get('udpport')
    proxy.uot = params.get('uot')
  }
  return proxy
}

/**
 * @typedef {ClashSS|ClashSSR|ClashVmess} ClashConfig
 */