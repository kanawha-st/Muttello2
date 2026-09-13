const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { stripTypeScriptTypes } = require('node:module')
const vm = require('node:vm')

const source = readFileSync(require.resolve('../src/App.tsx'), 'utf8')
const simulation = source.slice(source.indexOf('function simulateFlight('), source.indexOf('function pathToSvg('))
const simulateFlight = vm.runInNewContext(stripTypeScriptTypes(simulation) + '\nsimulateFlight')
const start = { x: 50, y: 50, altitude: 80, heading: 0 }

test('turn animation preserves direction across zero and full revolutions', () => {
  for (const direction of ['left', 'right']) {
    const states = simulateFlight(Array.from({ length: 5 }, () => ({ type: 'turn', direction, degrees: 90 })), start, 0.4)
    const sign = direction === 'left' ? -1 : 1
    states.forEach((state, index) => assert.equal(state.heading, sign * 90 * (index + 1)))
  }
})

test('forward movement after a left turn travels left', () => {
  const states = simulateFlight([
    { type: 'turn', direction: 'left', degrees: 90 },
    { type: 'move', direction: 'forward', distance: 50 },
  ], start, 0.4)
  assert.equal(states[1].x, 30)
  assert.ok(Math.abs(states[1].y - 50) < 1e-10)
})

test('selected initial heading controls forward movement and subsequent turns', () => {
  const states = simulateFlight([
    { type: 'move', direction: 'forward', distance: 50 },
    { type: 'turn', direction: 'left', degrees: 90 },
  ], { ...start, heading: 90 }, 0.4)
  assert.equal(states[0].x, 70)
  assert.ok(Math.abs(states[0].y - 50) < 1e-10)
  assert.equal(states[1].heading, 0)
})
