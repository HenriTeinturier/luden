import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assertLocalRequest } from '../src/server/request'

test('Requêtes locales : origine, hôte et contexte navigateur contrôlés', () => {
  for (const host of ['localhost', '127.0.0.1', '[::1]'])
    assert.doesNotThrow(() => assertLocalRequest(new Request(`http://${host}:3000/`)))
  for (const request of [
    new Request('http://192.168.1.42:3000/'),
    new Request('http://127.0.0.1.attacker.example:3000/'),
    new Request('http://localhost:3000/', { headers: { origin: 'https://example.com' } }),
    new Request('http://localhost:3000/', { headers: { origin: 'null' } }),
    new Request('http://localhost:3000/', { headers: { 'sec-fetch-site': 'cross-site' } }),
  ])
    assert.throws(() => assertLocalRequest(request))
  assert.doesNotThrow(() =>
    assertLocalRequest(
      new Request('http://localhost:3000/', { headers: { origin: 'http://localhost:3000' } }),
    ),
  )
})
