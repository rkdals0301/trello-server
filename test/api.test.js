const assert = require('node:assert/strict')
const { once } = require('node:events')
const { after, before, test } = require('node:test')

process.env.SQLITE_STORAGE = ':memory:'
const app = require('../app')
const models = require('../models')

const credentials = { email: 'board-owner@example.test', password: 'fixture-password' }
let server
let origin

before(async () => {
  models.sequelize.options.logging = false
  await models.sequelize.sync()
  await models.User.create({ ...credentials, name: 'Board owner' })
  server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  origin = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  if (server) await new Promise(resolve => server.close(resolve))
  await models.sequelize.close()
})

function request(path, { method = 'GET', token, json, body, headers } = {}) {
  const requestHeaders = new Headers(headers)
  if (token) requestHeaders.set('Authorization', `Bearer ${token}`)
  if (json !== undefined) {
    requestHeaders.set('Content-Type', 'application/json')
    body = JSON.stringify(json)
  }
  return fetch(origin + path, {
    method,
    headers: requestHeaders,
    body,
    signal: AbortSignal.timeout(5000)
  })
}

test('reports health and preserves HTTP statuses for auth and parser errors', async () => {
  const health = await request('/health')
  assert.equal(health.status, 200)
  assert.equal(typeof (await health.json()).time, 'number')

  assert.equal((await request('/boards')).status, 401)
  assert.equal((await request('/boards', { token: 'invalid' })).status, 401)
  assert.equal((await request('/missing')).status, 404)
  assert.equal((await request('/login', { method: 'POST' })).status, 401)
  const malformed = await request('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{'
  })
  assert.equal(malformed.status, 400)

  const formLogin = await request('/login', {
    method: 'POST',
    body: new URLSearchParams(credentials)
  })
  assert.equal(formLogin.status, 200)
  assert.equal(typeof (await formLogin.json()).accessToken, 'string')
})

test('authenticates and manages boards, lists, and cards in SQLite', async () => {
  const login = await request('/login', { method: 'POST', json: credentials })
  assert.equal(login.status, 200)
  const { accessToken: token } = await login.json()

  assert.equal((await request('/boards', { method: 'POST', token })).status, 400)
  const emptyBoards = await request('/boards', { token })
  assert.deepEqual((await emptyBoards.json()).list, [])

  const boardCreation = await request('/boards', {
    method: 'POST', token, json: { title: 'Roadmap' }
  })
  assert.equal(boardCreation.status, 201)
  const { item: board } = await boardCreation.json()
  const boardPath = `/boards/${board.id}`

  const listCreation = await request('/lists', {
    method: 'POST', token, json: { title: 'Review', boardId: board.id, pos: 32768 }
  })
  assert.equal(listCreation.status, 201)
  const { item: list } = await listCreation.json()

  const cardCreation = await request('/cards', {
    method: 'POST', token, json: { title: 'Check request', listId: list.id, pos: 65535 }
  })
  assert.equal(cardCreation.status, 201)
  const { item: card } = await cardCreation.json()
  const cardPath = `/cards/${card.id}`

  const boardResponse = await request(boardPath, { token })
  assert.equal(boardResponse.status, 200)
  const { item: loadedBoard } = await boardResponse.json()
  assert.deepEqual(loadedBoard.lists.map(item => item.title), ['Review', 'Todo', 'Doing', 'Done'])
  assert.equal(loadedBoard.lists[0].cards[0].id, card.id)

  const updated = await request(cardPath, {
    method: 'PUT', token, json: { description: 'Checked' }
  })
  assert.equal(updated.status, 200)
  assert.equal((await (await request(cardPath, { token })).json()).item.description, 'Checked')

  const deletedList = await request(`/lists/${list.id}`, { method: 'DELETE', token })
  assert.equal(deletedList.status, 204)
  assert.equal((await (await request(cardPath, { token })).json()).item, null)
  const afterDelete = await request(boardPath, { token })
  assert.deepEqual((await afterDelete.json()).item.lists.map(item => item.title), ['Todo', 'Doing', 'Done'])
})
