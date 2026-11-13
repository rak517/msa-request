/**
 * order 서버 스펙
 * - 인증: X-Api-Key: test-key (없으면 401 + { code: 401, msg: string })
 * - 성공 응답: { code: 0, result: { ... } }
 * - 에러 응답: { code: number, msg: string }
 * - 네이밍: snake_case, 날짜는 ISO 문자열
 */

import { http, HttpResponse, delay } from 'msw'

export const ORDER_BASE_URL = 'https://order.api.test'

function checkAuth(request: Request): boolean {
  return request.headers.get('X-Api-Key') === 'test-key'
}

export const orderHandlers = [
  // GET /v1/orders/:id — { code: 0, result: { order_id, total_price, created_at } }
  http.get(`${ORDER_BASE_URL}/v1/orders/:id`, async ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json(
        { code: 401, msg: 'Invalid api key' },
        { status: 401 },
      )
    }

    const { id } = params as { id: string }
    const customHeader = request.headers.get('X-Custom')

    if (id === '404') {
      return HttpResponse.json(
        { code: 1001, msg: 'Order not found' },
        { status: 404 },
      )
    }

    if (id === '500') {
      return HttpResponse.json(
        { code: 9999, msg: 'Internal error' },
        { status: 500 },
      )
    }

    if (id === 'slow') {
      await delay(3000)
    }

    const responseHeaders: Record<string, string> = {}
    if (customHeader !== null) {
      responseHeaders['X-Echo-Custom'] = customHeader
    }

    return HttpResponse.json(
      {
        code: 0,
        result: {
          order_id: id,
          total_price: 15000,
          created_at: '2026-11-13T00:00:00.000Z',
        },
      },
      { headers: responseHeaders },
    )
  }),
]
