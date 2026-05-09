import handler from "./api/set-member-status.ts";

async function test() {
  process.env.VITE_SUPABASE_URL = "https://mock.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-key";

  // Mock global fetch
  (global as any).fetch = async (url: string, init: any) => {
    console.log(`Mock fetch: ${url}`);
    return {
      ok: true,
      status: 200,
      text: async () => ""
    };
  };

  const req = new Request("http://localhost/api/set-member-status", {
    method: "POST",
    body: JSON.stringify({ member_id: 10, status: "deactivated" }),
    headers: { "Content-Type": "application/json" }
  });

  const res = await handler(req);
  const data = await res.json();
  console.log("Response:", JSON.stringify(data));
  
  if (data.success === true) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
