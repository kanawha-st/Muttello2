import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { queryInfo, readOptions } from '../scripts/tello-info.mjs'

function fixture(replies) {
  const socket = new EventEmitter()
  const sent = []
  let closed = false
  socket.close = () => { closed = true }
  socket.send = (data, port, address, callback) => {
    sent.push(data.toString())
    callback()
    const reply = replies[sent.length - 1]
    if (reply) queueMicrotask(() => socket.emit('message', Buffer.from(reply), { address, port }))
  }
  return { socket, sent, get closed() { return closed } }
}

test('IP comes from an explicit argument, falling back to TELLO_IP', () => {
  assert.equal(readOptions([], { TELLO_IP: '192.168.11.12' }).ip, '192.168.11.12')
  assert.equal(readOptions(['--tello-ip', '192.168.11.13'], { TELLO_IP: '192.168.11.12' }).ip, '192.168.11.13')
  assert.throws(() => readOptions([], {}), /IPv4/)
  assert.throws(() => readOptions(['--tello-ip', 'invalid'], {}), /IPv4/)
  assert.deepEqual(readOptions(['--help'], {}), { help: true })
})

test('queries sdk and serial number after entering SDK mode, then closes the socket', async () => {
  const f = fixture(['ok', '30', '0TQZH8EED00123'])
  const result = await queryInfo({ ip: '192.168.11.12' }, { socket: f.socket, timeoutMs: 30 })
  assert.deepEqual(result, { sdk: '30', sn: '0TQZH8EED00123' })
  assert.deepEqual(f.sent, ['command', 'sdk?', 'sn?'])
  assert.equal(f.closed, true)
})

test('a missing reply rejects with a Japanese timeout message and closes the socket', async () => {
  const f = fixture(['ok', null])
  await assert.rejects(
    queryInfo({ ip: '192.168.11.12' }, { socket: f.socket, timeoutMs: 20 }),
    /sdk\?.*応答がありません/,
  )
  assert.equal(f.closed, true)
})
