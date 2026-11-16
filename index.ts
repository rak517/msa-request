import { createClient } from "./src/client.ts";
import { USER_BASE_URL, ORDER_BASE_URL } from "./mocks/handlers.ts";
import { ApiError } from "./src/ApiError.ts";

// 1. 서버별 인스턴스 생성 — 서버당 하나
// 서버마다 baseURL, 인증 방식, 응답/에러 파싱, 타임아웃이 다름.

const userClient = createClient({
  baseURL: USER_BASE_URL,
  authType: "bearer",
  auth: () => "test-token",
  unwrapData: (res) => res.data,
  unwrapError: (res) => res.message,
  timeout: 3000,
});

const orderClient = createClient({
  baseURL: ORDER_BASE_URL,
  authType: "apikey",
  auth: () => "test-key",
  unwrapData: (res) => res.result,
  unwrapError: (res) => res.msg,
  timeout: 5000,
});

// 2. 도메인 레이어 버전은 URL로 표현
// createClient가 반환하는 get/post를 감싸서 도메인 메서드를 정의

const userApi = {
  v1: {
    getUser: (id: string, options?: RequestOptions) => userClient.get(`/v1/users/${id}`, options),
  },
  v2: {
    getUser: (id: string, options?: RequestOptions) => userClient.get(`/v2/users/${id}`, options),
  },
};

const orderApi = {
  v1: {
    getOrder: (id: string, options?: RequestOptions) => orderClient.get(`/v1/orders/${id}`, options),
    getOrderList: (params: Record<string, unknown>, options?: RequestOptions) =>
      orderClient.get("/v1/orders", { ...options, params }),
    createOrder: (body: Record<string, unknown>, options?: RequestOptions) =>
      orderClient.post("/v1/orders", body, options),
    updateOrder: (id: string, body: Record<string, unknown>, options?: RequestOptions) =>
      orderClient.put(`/v1/orders/${id}`, body, options),
    deleteOrder: (id: string, options?: RequestOptions) => orderClient.delete(`/v1/orders/${id}`, options),
  },
};

// 사용처

// [1] 서버별로 다른 서버에 요청
const user = await userApi.v1.getUser("1");
const order = await orderApi.v1.getOrder("1");

// [2] 버전별 호출 (path 방식 — baseURL에 /v1, /v2 포함)
const userV1 = await userApi.v1.getUser("1");
const userV2 = await userApi.v2.getUser("1");

// [3] 쿼리파라미터를 객체로 전달
const orderList = await orderApi.v1.getOrderList({ page: 1, status: "sale" });

// [4] 공통 헤더 유지 + 커스텀 헤더 및 타임아웃 오버라이드
const orderWithCustom = await orderApi.v1.getOrder("1", {
  headers: { "X-Custom": "trace-id-123" },
  timeout: 1000,
});

// [5] 요청 취소
const controller = new AbortController();
orderApi.v1.getOrder("1", { signal: controller.signal });
controller.abort();

// [7] POST — body를 넘겨서 생성
const created = await orderApi.v1.createOrder({ item_id: "item-1", quantity: 2 });

// [8] PUT — body를 넘겨서 수정
const updated = await orderApi.v1.updateOrder("1", { total_price: 20000 });

// [9] DELETE — body 없이 삭제
await orderApi.v1.deleteOrder("1");

// [10] 에러 처리 — 서버별 에러 모양을 몰라도 ApiError 하나로 받는다
try {
  await userApi.v1.getUser("404");
} catch (err) {
  if (err instanceof ApiError) {
    console.log(err.status); // 404
    console.log(err.message); // 'User not found'
  }
}
