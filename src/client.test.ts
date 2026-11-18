import { describe, it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { createClient } from "./client";
import { ApiError } from "./ApiError";
import { USER_BASE_URL } from "../mocks/user.handlers";
import { ORDER_BASE_URL } from "../mocks/order.handlers";
import { server } from "../mocks/server";

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

describe("createClient", () => {
  // 2. 버전 path 표현 — v1/v2 응답 구조가 다름
  it("user v1 — { id, name, email } 구조", async () => {
    const data = await userClient.get("/v1/users/1");
    expect(data).toMatchObject({ id: "1", name: "Rak", email: "rak@test.com" });
    expect(data).not.toHaveProperty("userId");
  });

  it("user v2 — { userId, profile, contact } 구조 (v1과 다름)", async () => {
    const data = await userClient.get("/v2/users/1");
    expect(data).toMatchObject({
      userId: "1",
      profile: { displayName: "Rak" },
      contact: { email: "rak@test.com" },
    });
    expect(data).not.toHaveProperty("name");
  });

  // 3. 쿼리파라미터 인코딩
  it("params 객체를 쿼리스트링으로 인코딩해서 요청", async () => {
    let receivedURL = "";
    server.use(
      http.get(`${ORDER_BASE_URL}/v1/orders`, ({ request }) => {
        receivedURL = request.url;
        return HttpResponse.json({ code: 0, result: [] });
      })
    );
    await orderClient.get("/v1/orders", { params: { page: 1, status: "sale" } });
    expect(receivedURL).toContain("page=1");
    expect(receivedURL).toContain("status=sale");
  });

  // 4. 기본 타임아웃 — clientOptions.timeout으로 abort
  it("clientOptions timeout 초과 시 abort 에러 발생", async () => {
    const slowClient = createClient({
      baseURL: ORDER_BASE_URL,
      authType: "apikey",
      auth: () => "test-key",
      unwrapData: (res) => res.result,
      unwrapError: (res) => res.msg,
      timeout: 100, // 100ms — slow는 3000ms 대기
    });
    await expect(slowClient.get("/v1/orders/slow")).rejects.toThrow();
  });

  // 5. 공통 헤더 유지 + 커스텀 헤더 오버라이드
  it("인증 헤더 유지된 채 X-Custom 헤더 추가 → X-Echo-Custom 응답 확인", async () => {
    let authHeader = "";
    server.use(
      http.get(`${ORDER_BASE_URL}/v1/orders/custom-check`, ({ request }) => {
        authHeader = request.headers.get("X-Api-Key") ?? "";
        const custom = request.headers.get("X-Custom");
        return HttpResponse.json(
          { code: 0, result: { order_id: "custom-check" } },
          { headers: custom ? { "X-Echo-Custom": custom } : {} }
        );
      })
    );
    const res = await orderClient.get("/v1/orders/custom-check", {
      headers: { "X-Custom": "trace-123" },
    });
    expect(authHeader).toBe("test-key"); // 공통 인증 헤더 유지
    expect(res).toMatchObject({ order_id: "custom-check" });
  });

  // 6. 인증 헤더 자동 주입 — 잘못된 토큰이면 401 → ApiError
  it("인증 헤더 없거나 잘못되면 401 → ApiError throw", async () => {
    const noAuthClient = createClient({
      baseURL: USER_BASE_URL,
      authType: "bearer",
      auth: () => "wrong-token",
      unwrapData: (res) => res.data,
      unwrapError: (res) => res.message,
    });
    await expect(noAuthClient.get("/v1/users/1")).rejects.toThrow(ApiError);
  });

  // 7. 요청 시점 최신 토큰 사용
  it("auth 함수는 요청마다 호출되어 최신값을 주입", async () => {
    let token = "wrong-token";
    const dynamicClient = createClient({
      baseURL: USER_BASE_URL,
      authType: "bearer",
      auth: () => token,
      unwrapData: (res) => res.data,
      unwrapError: (res) => res.message,
    });

    // 잘못된 토큰 → 실패
    await expect(dynamicClient.get("/v1/users/1")).rejects.toThrow(ApiError);

    // 토큰 변경 후 → 성공
    token = "test-token";
    const data = await dynamicClient.get("/v1/users/1");
    expect(data).toMatchObject({ id: "1" });
  });

  // 8. unwrap — 래핑 제거 후 데이터만 반환
  it("user — { data: {...} } 래핑 제거 후 data만 반환", async () => {
    const data = await userClient.get("/v1/users/1");
    expect(data).not.toHaveProperty("data");
    expect(data).toMatchObject({ id: "1", name: "Rak" });
  });

  it("order — { code, result: {...} } 래핑 제거 후 result만 반환", async () => {
    const data = await orderClient.get("/v1/orders/1");
    expect(data).not.toHaveProperty("code");
    expect(data).not.toHaveProperty("result");
    expect(data).toMatchObject({ order_id: "1", total_price: 15000 });
  });

  // 9. ApiError 정규화 — status, message 값 확인
  it("user 404 → ApiError { status: 404, message: 'User not found' }", async () => {
    try {
      await userClient.get("/v1/users/404");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      if (err instanceof ApiError) {
        expect(err.status).toBe(404);
        expect(err.message).toBe("User not found");
      }
    }
  });

  it("order 404 → ApiError { status: 404, message: 'Order not found' }", async () => {
    try {
      await orderClient.get("/v1/orders/404");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      if (err instanceof ApiError) {
        expect(err.status).toBe(404);
        expect(err.message).toBe("Order not found");
      }
    }
  });

  // 10. 빈 body 처리 — 204 No Content
  it("204 빈 body 응답도 에러 없이 처리", async () => {
    server.use(
      http.delete(`${ORDER_BASE_URL}/v1/orders/1`, () => {
        return new HttpResponse(null, { status: 204 });
      })
    );
    const data = await orderClient.delete("/v1/orders/1");
    expect(data).toBeNull();
  });

  // 11. AbortSignal — signal 직접 전달
  it("controller.signal로 진행 중인 요청 취소 → abort 에러 발생", async () => {
    const controller = new AbortController();
    const promise = orderClient.get("/v1/orders/slow", { signal: controller.signal });
    controller.abort();
    await expect(promise).rejects.toThrow();
  });
});
