import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types";

export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data, status }, { status });
}

export function createdResponse<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data, status: 201 }, { status: 201 });
}

export function errorResponse(error: string, status = 500): NextResponse<ApiResponse> {
  return NextResponse.json({ error, status }, { status });
}

export function badRequest(error: string): NextResponse<ApiResponse> {
  return NextResponse.json({ error, status: 400 }, { status: 400 });
}

export function unauthorized(error = "Unauthorized"): NextResponse<ApiResponse> {
  return NextResponse.json({ error, status: 401 }, { status: 401 });
}

export function forbidden(error = "Forbidden"): NextResponse<ApiResponse> {
  return NextResponse.json({ error, status: 403 }, { status: 403 });
}

export function notFound(error = "Not found"): NextResponse<ApiResponse> {
  return NextResponse.json({ error, status: 404 }, { status: 404 });
}
