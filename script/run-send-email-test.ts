import handler from "../api/send-email";

// Minimal mock Request/Response for Vercel handler
class MockRes {
  statusCode = 200;
  headers: Record<string, string> = {};
  body: any = null;
  setHeader(k: string, v: string) { this.headers[k] = v; }
  status(code: number) { this.statusCode = code; return this; }
  json(obj: any) { this.body = obj; console.log("RESPONSE JSON:", JSON.stringify(obj, null, 2)); return this; }
  send(buf: any) { this.body = buf; console.log("RESPONSE SEND: buffer length", buf?.length); return this; }
  end() { return this; }
}

async function run() {
  // Ensure env to avoid pdf upload path: provide report_download_url so PDF generation/upload is skipped
  process.env.EMAILJS_SERVICE_ID = "test_service";
  process.env.EMAILJS_TEMPLATE_ID = "test_template";
  process.env.EMAILJS_PUBLIC_KEY = "test_public";
  process.env.EMAILJS_PRIVATE_KEY = "test_private";
  process.env.APP_BASE_URL = "http://localhost:3000";
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test_service_role_key";

  // Mock fetch to avoid real network calls
  // @ts-ignore globalThis.fetch
  globalThis.fetch = async (url: string, opts: any) => {
    console.log("Mock fetch called:", url);
    return {
      ok: true,
      text: async () => "ok",
    } as any;
  };

  const req: any = {
    method: "POST",
    body: {
      member_name: "Test User",
      member_email: "test@example.com",
      email_type: "settlement",
      settlement_data: {
        report_download_url: "https://example.com/report.pdf",
        society_id: "S1",
        member_name: "Test User",
        contribution_total: 100,
        deductions: [],
      },
    },
    query: {},
  };

  const res = new MockRes();

  try {
    await handler(req, res as any);
    console.log("Handler finished. Status:", res.statusCode);
  } catch (err: any) {
    console.error("Handler threw:", err && err.stack ? err.stack : err);
  }
}

run();
