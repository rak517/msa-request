const api = {
  user: createClient({
    baseURL: USER_BASE_URL,
    authType: "bearer",
    unwrapData: (res) => res.data,
    unwrapError: (res) => res.message,
    timeout: 3000,
  }),
  order: createClient({
    baseURL: ORDER_BASE_URL,
    authType: "apiKey",
    unwrapData: (res) => res.result,
    unwrapError: (res) => res.msg,
    timeout: 5000,
  }),
};

// [1] 다른 서버
const user = await api.user.v1.getUser("1");
const order = await api.order.v1.getOrder("0");

// [2] 다른 버전
const user = await api.user.v1.getUser("1");
const user = await api.user.v2.getUser("1");

// [3] 쿼리
const orderList = await api.order.v1.getOrderList({ page: 1, status: sale });

// [4] 커스텀 헤더
const order = await api.order.v1.getOrder("1", {
  headers: { "X-Custom": "trace-id-123" },
  timeout: 5000,
});

// [5] 요청 취소
const controller = new AbortController();
const order = await api.order.v1.getOrder("1", { signal: controller.signal });
controller.abort();

// [6] 에러 처리
try {
  const user = await api.user.v1.getUser("404");
} catch (err) {
  if (err instanceof ApiError) {
    console.log(err.status);
    console.log(err.message);
  }
}
