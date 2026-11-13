import { describe, it, expect } from 'vitest'
import { USER_BASE_URL } from './user.handlers.js'
import { ORDER_BASE_URL } from './order.handlers.js'

const userAuth = { Authorization: 'Bearer test-token' }
const orderAuth = { 'X-Api-Key': 'test-key' }

describe('user 서버', () => {
  it('1. v1 정상 응답 — { data: { id, name, email } }', async () => {
    const res = await fetch(`${USER_BASE_URL}/v1/users/1`, {
      headers: userAuth,
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({
      data: { id: '1', name: 'Rak', email: 'rak@test.com' },
    })
  })

  it('2. v2 정상 응답 — { data: { userId, profile, contact } } (v1과 구조 다름)', async () => {
    const res = await fetch(`${USER_BASE_URL}/v2/users/1`, {
      headers: userAuth,
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({
      data: {
        userId: '1',
        profile: { displayName: 'Rak' },
        contact: { email: 'rak@test.com' },
      },
    })
    expect(body.data).not.toHaveProperty('name')
  })

  it('3. 인증 헤더 없으면 401', async () => {
    const res = await fetch(`${USER_BASE_URL}/v1/users/1`)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toEqual({ message: 'Unauthorized' })
  })

  it('4. id가 404이면 404 + { message }', async () => {
    const res = await fetch(`${USER_BASE_URL}/v1/users/404`, {
      headers: userAuth,
    })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body).toEqual({ message: 'User not found' })
  })
})

describe('order 서버', () => {
  it('5. v1 정상 응답 — { code: 0, result: { order_id, total_price, created_at } }', async () => {
    const res = await fetch(`${ORDER_BASE_URL}/v1/orders/1`, {
      headers: orderAuth,
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({
      code: 0,
      result: {
        order_id: '1',
        total_price: 15000,
        created_at: '2026-11-13T00:00:00.000Z',
      },
    })
  })

  it('6. 인증 헤더 없으면 401 + { code, msg } 포맷', async () => {
    const res = await fetch(`${ORDER_BASE_URL}/v1/orders/1`)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toEqual({ code: 401, msg: 'Invalid api key' })
  })

  it('7. id가 404이면 404 + { code: 1001, msg }', async () => {
    const res = await fetch(`${ORDER_BASE_URL}/v1/orders/404`, {
      headers: orderAuth,
    })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body).toEqual({ code: 1001, msg: 'Order not found' })
  })

  it('8. X-Custom 헤더 → 응답 헤더 X-Echo-Custom에 같은 값 반환', async () => {
    const res = await fetch(`${ORDER_BASE_URL}/v1/orders/1`, {
      headers: { ...orderAuth, 'X-Custom': 'hello-echo' },
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('X-Echo-Custom')).toBe('hello-echo')
  })

  it('9. id가 slow이면 AbortSignal.timeout(100)으로 abort 에러 발생', async () => {
    await expect(
      fetch(`${ORDER_BASE_URL}/v1/orders/slow`, {
        headers: orderAuth,
        signal: AbortSignal.timeout(100),
      }),
    ).rejects.toThrow()
  })

  it('10. id가 500이면 500 + { code: 9999, msg }', async () => {
    const res = await fetch(`${ORDER_BASE_URL}/v1/orders/500`, {
      headers: orderAuth,
    })
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toEqual({ code: 9999, msg: 'Internal error' })
  })
})
