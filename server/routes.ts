import type { Express } from "express";

export async function registerRoutes(app: Express) {
  // Auth endpoints
  const authLogin = (await import("../api/auth-login")).default;
  const authRegister = (await import("../api/auth-register")).default;

  // Member endpoints
  const approveMember = (await import("../api/approve-member")).default;
  const deleteMember = (await import("../api/delete-member")).default;

  // Settlement endpoint
  const calculateMemberSettlement = (await import("../api/calculate-member-settlement")).default;

  // Installment endpoints
  const submitInstalment = (await import("../api/submit-instalment")).default;
  const approveInstalment = (await import("../api/approve-instalment")).default;

  // Fixed Deposit endpoints
  const fixedDeposit = (await import("../api/fixed-deposit")).default;

  // Email endpoint
  const sendEmail = (await import("../api/send-email")).default;

  // Profile endpoint
  const updateProfile = (await import("../api/update-profile")).default;

  // Notice endpoint
  const manageNotice = (await import("../api/manage-notice")).default;

  // Transactions endpoint
  const transactions = (await import("../api/transactions")).default;

  // Register all routes
  app.post("/api/auth-login", authLogin);
  app.post("/api/auth-register", authRegister);

  app.post("/api/approve-member", approveMember);
  app.post("/api/delete-member", deleteMember);

  app.post("/api/calculate-member-settlement", calculateMemberSettlement);

  app.post("/api/submit-instalment", submitInstalment);
  app.post("/api/approve-instalment", approveInstalment);

  app.post("/api/fixed-deposit", fixedDeposit);

  app.post("/api/send-email", sendEmail);

  app.post("/api/update-profile", updateProfile);

  app.post("/api/manage-notice", manageNotice);

  app.post("/api/transactions", transactions);
}
