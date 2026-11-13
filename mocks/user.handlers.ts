/**
 * user 서버 스펙
 * - 인증: Authorization: Bearer test-token (없으면 401 + { message: string })
 * - 성공 응답: { data: { ... } }
 * - 에러 응답: { message: string }
 * - 네이밍: camelCase
 */

import { http, HttpResponse } from 'msw'

export const USER_BASE_URL = 'https://user.api.test'

function checkAuth(request: Request): boolean {
  return request.headers.get('Authorization') === 'Bearer test-token'
}

export const userHandlers = [
  // GET /v1/users/:id — { data: { id, name, email } }
  http.get(`${USER_BASE_URL}/v1/users/:id`, ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params as { id: string }

    if (id === '404') {
      return HttpResponse.json({ message: 'User not found' }, { status: 404 })
    }

    return HttpResponse.json({
      data: {
        id,
        name: 'Rak',
        email: 'rak@test.com',
      },
    })
  }),

  // GET /v2/users/:id — { data: { userId, profile: { displayName }, contact: { email } } }
  http.get(`${USER_BASE_URL}/v2/users/:id`, ({ request, params }) => {
    if (!checkAuth(request)) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params as { id: string }

    if (id === '404') {
      return HttpResponse.json({ message: 'User not found' }, { status: 404 })
    }

    return HttpResponse.json({
      data: {
        userId: id,
        profile: { displayName: 'Rak' },
        contact: { email: 'rak@test.com' },
      },
    })
  }),
]
