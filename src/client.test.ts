import { describe, it, expect } from "vitest";
import { createClient } from "./client";
import { ApiError } from "./ApiError";
import { USER_BASE_URL } from "../mocks/user.handlers";
import { ORDER_BASE_URL } from "../mocks/order.handlers";

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
  it("user v1 정상 응답 — unwrap된 data만 반환", async () => {
    const data = await userClient.get("/v1/users/1");
    expect(data).toMatchObject({ id: "1", name: "Rak" });
  });

  it("user 404 → ApiError throw", async () => {
    await expect(userClient.get("/v1/users/404")).rejects.toThrow(ApiError);
  });

  it("order 정상 응답 — unwrap된 result만 반환", async () => {
    const data = await orderClient.get("/v1/orders/1");
    expect(data).toMatchObject({ order_id: "1", total_price: 15000 });
  });

  it("order 커스텀 헤더 전달", async () => {
    const data = await orderClient.get("/v1/orders/1", {
      headers: { "X-Custom": "trace" },
    });
    expect(data).toMatchObject({ order_id: "1" });
  });

  it("order slow → timeout으로 abort 에러 발생", async () => {
    await expect(orderClient.get("/v1/orders/slow", { timeout: 100 })).rejects.toThrow();
  });
});
