import dgram from 'node:dgram'
import { isIPv4 } from 'node:net'
import { parseArgs } from 'node:util'
import { pathToFileURL } from 'node:url'
import envConfig from '../shared/env.cjs'

const help = `Telloに接続し、SDKバージョンとシリアル番号を取得します。
npm run tello:info -- --tello-ip <IPv4>
カレントフォルダの.envと環境変数 TELLO_IP に対応。
--tello-ip <IPv4>  機体のIP（既定: .env の TELLO_IP）
--help             この説明を表示`

export function readOptions(args, env = process.env) {
  let values
  try {
    ;({ values } = parseArgs({ args, options: {
      'tello-ip': { type: 'string' },
      help: { type: 'boolean', default: false },
    } }))
  } catch {
    throw new Error('引数が不正です。--help を確認してください。')
  }
  if (values.help) return { help: true }
  const ip = values['tello-ip'] ?? env.TELLO_IP
  if (!ip || !isIPv4(ip)) throw new Error('--tello-ip または .env の TELLO_IP にIPv4を指定してください。')
  return { ip }
}

function send(socket, ip, port, command, timeoutMs) {
  return new Promise((resolve, reject) => {
    const onMessage = (message, remote) => {
      if (remote.address !== ip || remote.port !== port) return
      finish(null, message.toString('utf8').replace(/[\0\s]+$/u, '').trim())
    }
    const timer = setTimeout(() => finish(new Error(`「${command}」への応答がありません。機体のIPとWi-Fi接続を確認してください。`)), timeoutMs)
    const finish = (error, result) => {
      clearTimeout(timer)
      socket.off('message', onMessage)
      if (error) reject(error)
      else resolve(result)
    }
    socket.on('message', onMessage)
    socket.send(Buffer.from(command, 'utf8'), port, ip, error => { if (error) finish(error) })
  })
}

export async function queryInfo({ ip }, { socket = dgram.createSocket('udp4'), port = 8889, timeoutMs = 5000 } = {}) {
  try {
    await send(socket, ip, port, 'command', timeoutMs)
    const sdk = await send(socket, ip, port, 'sdk?', timeoutMs)
    const sn = await send(socket, ip, port, 'sn?', timeoutMs)
    return { sdk, sn }
  } finally {
    try { socket.close() } catch { /* Socket may not have bound after a send failure. */ }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const options = readOptions(process.argv.slice(2), envConfig.readTelloEnv())
    if (options.help) console.log(help)
    else {
      console.log(`Tello (${options.ip}:8889) に接続しています…`)
      const { sdk, sn } = await queryInfo(options)
      console.log(`SDKバージョン: ${sdk}`)
      console.log(`シリアル番号: ${sn}`)
    }
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
