import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const CONFIG_PATH = path.join(process.cwd(), "workspace-config.json");

interface WorkspaceConfig {
  accessToken: string | null;
  refreshToken: string | null;
  clientId: string | null;
  clientSecret: string | null;
  adminEmail: string | null;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  folderId: string | null;
  folderUrl: string | null;
  sheetsSyncActive: boolean;
  gmailAlertsActive: boolean;
  consolePasskey: string | null;
}

function getWorkspaceConfig(): WorkspaceConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, "utf-8");
      const parsed = JSON.parse(data);
      
      let folderId = parsed.folderId ?? null;
      if (!folderId && parsed.folderUrl) {
        const match = parsed.folderUrl.match(/\/folders\/([a-zA-Z0-9-_]+)/);
        if (match) {
          folderId = match[1];
        }
      }

      return {
        accessToken: parsed.accessToken ?? null,
        refreshToken: parsed.refreshToken ?? null,
        clientId: parsed.clientId ?? null,
        clientSecret: parsed.clientSecret ?? null,
        adminEmail: parsed.adminEmail ?? null,
        spreadsheetId: parsed.spreadsheetId ?? null,
        spreadsheetUrl: parsed.spreadsheetUrl ?? null,
        folderId: folderId,
        folderUrl: parsed.folderUrl ?? null,
        sheetsSyncActive: !!parsed.sheetsSyncActive,
        gmailAlertsActive: !!parsed.gmailAlertsActive,
        consolePasskey: parsed.consolePasskey ?? null
      };
    }
  } catch (err) {
    console.error("[SERVER] Error reading workspace config:", err);
  }
  return {
    accessToken: null,
    refreshToken: null,
    clientId: null,
    clientSecret: null,
    adminEmail: null,
    spreadsheetId: null,
    spreadsheetUrl: null,
    folderId: null,
    folderUrl: null,
    sheetsSyncActive: false,
    gmailAlertsActive: false,
    consolePasskey: null
  };
}

function saveWorkspaceConfig(config: WorkspaceConfig): boolean {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("[SERVER] Error writing workspace config:", err);
    return false;
  }
}

const SUBMISSIONS_PATH = path.join(process.cwd(), "workspace-leads-submitted.json");
const ABANDONED_PATH = path.join(process.cwd(), "workspace-leads-abandoned.json");

function getLocalSubmissions(): any[] {
  try {
    if (fs.existsSync(SUBMISSIONS_PATH)) {
      return JSON.parse(fs.readFileSync(SUBMISSIONS_PATH, "utf-8"));
    }
  } catch (err) {
    console.error("[SERVER] Error reading local submissions:", err);
  }
  return [];
}

function saveLocalSubmissions(subs: any[]): boolean {
  try {
    fs.writeFileSync(SUBMISSIONS_PATH, JSON.stringify(subs, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("[SERVER] Error writing local submissions:", err);
    return false;
  }
}

function getLocalAbandoned(): any[] {
  try {
    if (fs.existsSync(ABANDONED_PATH)) {
      return JSON.parse(fs.readFileSync(ABANDONED_PATH, "utf-8"));
    }
  } catch (err) {
    console.error("[SERVER] Error reading local abandoned leads:", err);
  }
  return [];
}

function saveLocalAbandoned(abans: any[]): boolean {
  try {
    fs.writeFileSync(ABANDONED_PATH, JSON.stringify(abans, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("[SERVER] Error writing local abandoned leads:", err);
    return false;
  }
}

async function refreshWorkspaceTokenIfNeeded(config: WorkspaceConfig): Promise<boolean> {
  if (!config.accessToken) return false;
  if (!config.refreshToken || !config.clientId || !config.clientSecret) return false;

  // Check token validity
  try {
    const tokenRes = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${config.accessToken}`);
    if (tokenRes.ok) {
      const info = await tokenRes.json();
      const expires_in = parseInt(info.expires_in) || 0;
      // If the token expires in more than 5 minutes, keep using it
      if (expires_in > 300) {
        return true;
      }
    }
  } catch (err) {
    console.warn("[SERVER WORKSPACE] Failed to check token info, attempting refresh anyway:", err);
  }

  // Attempt refresh using OAuth2 endpoint
  try {
    console.log("[SERVER WORKSPACE] Google token expires soon or has expired. Requesting refreshment...");
    const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: config.refreshToken,
        grant_type: "refresh_token"
      }).toString()
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      if (data.access_token) {
        config.accessToken = data.access_token;
        saveWorkspaceConfig(config);
        console.log("[SERVER WORKSPACE] Google workspace token renewed successfully via Refresh Token.");
        return true;
      }
    } else {
      const txt = await refreshRes.text();
      console.error("[SERVER WORKSPACE] Failed to renew Google token:", txt);
    }
  } catch (err: any) {
    console.error("[SERVER WORKSPACE] Background token renewal exception:", err.message);
  }

  return false;
}

function appendAuditLog(action: string, status: number, details: string) {
  try {
    const logPath = path.join(process.cwd(), "workspace-audit.json");
    let logs: any[] = [];
    if (fs.existsSync(logPath)) {
      try {
        logs = JSON.parse(fs.readFileSync(logPath, "utf-8"));
      } catch (e) {
        logs = [];
      }
    }
    const currentLog = {
      timestamp: new Date().toISOString(),
      action,
      status,
      details: details.substring(0, 1000)
    };
    logs.unshift(currentLog);
    if (logs.length > 30) {
      logs = logs.slice(0, 30);
    }
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2), "utf-8");
    console.log(`[AUDIT LOG] ${action} -> Status ${status}: ${details.substring(0, 150)}`);
  } catch (err) {
    console.warn("Failed to write workspace audit log:", err);
  }
}

function getAuditLogs(): any[] {
  try {
    const logPath = path.join(process.cwd(), "workspace-audit.json");
    if (fs.existsSync(logPath)) {
      return JSON.parse(fs.readFileSync(logPath, "utf-8"));
    }
  } catch (err) {
    console.warn("Failed to read audit logs:", err);
  }
  return [];
}

async function startServer() {
  app.set("trust proxy", 1);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Health check API for Render / deployments
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Workspace configuration APIs
  app.get("/api/workspace/config", (req, res) => {
    const config = getWorkspaceConfig();
    res.json({
      status: "success",
      config: {
        adminEmail: config.adminEmail,
        spreadsheetId: config.spreadsheetId,
        spreadsheetUrl: config.spreadsheetUrl || (config.spreadsheetId ? `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/edit` : null),
        folderId: config.folderId,
        folderUrl: config.folderUrl || "https://drive.google.com/drive/my-drive",
        sheetsSyncActive: config.sheetsSyncActive,
        gmailAlertsActive: config.gmailAlertsActive,
        isConnected: !!config.accessToken,
        clientId: config.clientId,
        hasRefreshToken: !!config.refreshToken,
        isPermanent: !!(config.refreshToken && config.clientId)
      }
    });
  });

  app.post("/api/workspace/save-config", (req, res) => {
    try {
      const { accessToken, refreshToken, clientId, clientSecret, adminEmail, sheetsSyncActive, gmailAlertsActive, spreadsheetId, spreadsheetUrl, folderId, folderUrl, consolePasskey } = req.body;
      const current = getWorkspaceConfig();

      if (accessToken !== undefined) current.accessToken = accessToken;
      if (refreshToken !== undefined) current.refreshToken = refreshToken;
      if (clientId !== undefined) current.clientId = clientId;
      if (clientSecret !== undefined) current.clientSecret = clientSecret;
      if (adminEmail !== undefined) current.adminEmail = adminEmail;
      if (sheetsSyncActive !== undefined) current.sheetsSyncActive = !!sheetsSyncActive;
      if (gmailAlertsActive !== undefined) current.gmailAlertsActive = !!gmailAlertsActive;
      if (spreadsheetId !== undefined) current.spreadsheetId = spreadsheetId || null;
      if (spreadsheetUrl !== undefined) current.spreadsheetUrl = spreadsheetUrl || null;
      if (folderId !== undefined) current.folderId = folderId || null;
      if (folderUrl !== undefined) current.folderUrl = folderUrl || null;
      
      if (consolePasskey !== undefined) {
        if (consolePasskey) {
          const cleanConsolePass = consolePasskey.trim().toLowerCase();
          const blacklisted = ["inchpaper123", "info@inchpaper.com"];
          if (blacklisted.includes(cleanConsolePass) || cleanConsolePass.includes("inchpaper")) {
            return res.status(400).json({ status: "error", message: "This passkey has been blacklisted and disabled for security." });
          }
        }
        current.consolePasskey = consolePasskey || null;
      }

      saveWorkspaceConfig(current);
      res.json({ status: "success", message: "Workspace configuration updated successfully." });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  });

  // Secure API endpoint to verify Lead Console Access Passkey
  app.post("/api/workspace/verify-passkey", (req, res) => {
    try {
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ status: "error", message: "Password is required." });
      }

      const config = getWorkspaceConfig();
      const cleanPass = password.trim().toLowerCase();

      // Explicitly blacklist and block the old/unsecure passphrases
      const blacklisted = ["inchpaper123", "info@inchpaper.com"];
      if (blacklisted.includes(cleanPass) || cleanPass.includes("inchpaper")) {
        console.warn(`[VERIFY PASSKEY] BLOCKED blacklisted passphrase attempt: "${cleanPass}"`);
        return res.status(401).json({ status: "error", authenticated: false, message: "This passkey has been blacklisted and disabled for security." });
      }

      // If the saved custom passkey is one of the blacklisted keys, wipe it from memory & disk immediately
      if (config.consolePasskey) {
        const checkCustom = config.consolePasskey.trim().toLowerCase();
        if (blacklisted.includes(checkCustom) || checkCustom.includes("inchpaper")) {
          console.log("[SERVER CONFIG] Disabling and clearing blacklisted custom consolePasskey found in local config.");
          config.consolePasskey = null;
          saveWorkspaceConfig(config);
        }
      }

      const customPass = config.consolePasskey ? config.consolePasskey.trim().toLowerCase() : null;

      // Allow either a valid non-blacklisted custom code OR any of the primary fallback keys
      const fallbacks = ["sm@shivmadh@sm", "sm@2026@sm"];
      const isCorrect = fallbacks.includes(cleanPass) || (customPass && cleanPass === customPass);

      console.log(`[VERIFY PASSKEY] Checked password: "${cleanPass}". Custom Passkey: "${customPass}". Match status: ${isCorrect}`);

      if (isCorrect) {
        return res.json({ status: "success", authenticated: true });
      } else {
        return res.status(401).json({ status: "error", authenticated: false, message: "Invalid passkey. Access Denied." });
      }
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  });

  // Helper verifying administrators
  function isAuthorizedAdmin(password: string): boolean {
    const cleanPass = String(password || "").trim().toLowerCase();
    const blacklisted = ["inchpaper123", "info@inchpaper.com"];
    if (blacklisted.includes(cleanPass) || cleanPass.includes("inchpaper")) {
      return false;
    }
    const config = getWorkspaceConfig();
    const customPass = config.consolePasskey ? config.consolePasskey.trim().toLowerCase() : null;
    const fallbacks = ["sm@shivmadh@sm", "sm@2026@sm"];
    return fallbacks.includes(cleanPass) || (customPass !== null && cleanPass === customPass);
  }

  // Secure API endpoint to fetch server-side CRM lead database
  app.get("/api/workspace/leads", (req, res) => {
    try {
      const password = req.query.password || req.headers["x-console-passkey"];
      if (!password || !isAuthorizedAdmin(String(password))) {
        return res.status(401).json({ status: "error", message: "Unauthorized. Invalid console administrator session passkey." });
      }

      const submitted = getLocalSubmissions();
      const abandoned = getLocalAbandoned();
      res.json({
        status: "success",
        submitted,
        abandoned
      });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  });

  // Secure API endpoint to clear server-side CRM lead database lists
  app.post("/api/workspace/clear-leads", (req, res) => {
    try {
      const { password, type } = req.body;
      if (!password || !isAuthorizedAdmin(String(password))) {
        return res.status(401).json({ status: "error", message: "Unauthorized. Access purge permissions denied." });
      }

      if (type === "submissions") {
        saveLocalSubmissions([]);
      } else if (type === "abandoned") {
        saveLocalAbandoned([]);
      } else {
        return res.status(400).json({ status: "error", message: "Invalid lead collection type." });
      }

      res.json({ status: "success", message: `Successfully cleared all ${type} records on server.` });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  });

  // API endpoint for visitors to save progress-in-flight (abandoned) leads dynamically
  app.post("/api/workspace/save-abandoned", (req, res) => {
    try {
      const { lead } = req.body;
      if (!lead || typeof lead !== "object") {
        return res.status(400).json({ status: "error", message: "Invalid lead payload in body." });
      }

      const email = lead.corporateEmail || lead.corporate_email;
      const comp = lead.companyName || lead.company_name;

      if (!email && !comp) {
        return res.status(400).json({ status: "error", message: "Insufficient identifying elements to save progress lead." });
      }

      const abandoned = getLocalAbandoned();
      let matchedIndex = -1;

      if (email && email !== "Not specified yet") {
        matchedIndex = abandoned.findIndex((item: any) => {
          const itemEmail = item.corporateEmail || item.corporate_email;
          return itemEmail && itemEmail === email;
        });
      } else if (comp && comp !== "Not specified yet") {
        matchedIndex = abandoned.findIndex((item: any) => {
          const itemComp = item.companyName || item.company_name;
          return itemComp && itemComp === comp;
        });
      }

      if (matchedIndex > -1) {
        abandoned[matchedIndex] = { ...abandoned[matchedIndex], ...lead };
      } else {
        abandoned.unshift(lead);
      }

      saveLocalAbandoned(abandoned);
      res.json({ status: "success", message: "In-progress lead synced server-side." });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  });

  const GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
  ].join(" ");

  app.get("/api/workspace/google-oauth-start", (req, res) => {
    try {
      const config = getWorkspaceConfig();
      const clientId = (req.query.clientId as string) || config.clientId;
      const clientSecret = (req.query.clientSecret as string) || config.clientSecret;
      
      if (!clientId || !clientSecret) {
        return res.status(400).send("<h3>OAuth Error: Google Client ID and Secret are required to launch a permanent connection.</h3>");
      }

      // Temporarily store credentials to use in the callback
      config.clientId = clientId.trim();
      config.clientSecret = clientSecret.trim();
      saveWorkspaceConfig(config);

      let protocol = req.protocol;
      const host = req.get("host") || "";
      if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
        protocol = "https";
      }
      const appUrl = process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, "") : `${protocol}://${host}`;
      const redirectUri = `${appUrl}/api/workspace/google-oauth-callback`;

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: GOOGLE_SCOPES,
        access_type: "offline",
        prompt: "consent"
      }).toString();

      res.redirect(authUrl);
    } catch (err: any) {
      res.status(500).send(`Error starting Google OAuth flow: ${err.message}`);
    }
  });

  app.get("/api/workspace/google-oauth-callback", async (req, res) => {
    try {
      const { code, error } = req.query;
      if (error) {
        return res.status(400).send(`<h3>Authorization Error: ${error}</h3>`);
      }
      if (!code) {
        return res.status(400).send("<h3>Authorization Error: Undefined authorization code returned from Google.</h3>");
      }

      const config = getWorkspaceConfig();
      if (!config.clientId || !config.clientSecret) {
        return res.status(400).send("<h3>Authorization Error: Missing saved Client ID or Client Secret properties on server.</h3>");
      }

      let protocol = req.protocol;
      const host = req.get("host") || "";
      if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
        protocol = "https";
      }
      const appUrl = process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, "") : `${protocol}://${host}`;
      const redirectUri = `${appUrl}/api/workspace/google-oauth-callback`;

      // Exchange the authorization code for tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code: code as string,
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        }).toString()
      });

      if (!tokenRes.ok) {
        const errorText = await tokenRes.text();
        return res.status(400).send(`<h3>Failed to Exchange Tokens with Google:</h3><pre>${errorText}</pre>`);
      }

      const tokens = await tokenRes.json();
      if (!tokens.access_token) {
        return res.status(400).send("<h3>Failed to Exchange Tokens: Google returned invalid token payload.</h3>");
      }

      config.accessToken = tokens.access_token;
      if (tokens.refresh_token) {
        config.refreshToken = tokens.refresh_token;
      }

      // Fetch user profile to get their email address
      try {
        const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { "Authorization": `Bearer ${tokens.access_token}` }
        });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          if (profile.email) {
            config.adminEmail = profile.email;
          }
        }
      } catch (e) {
        console.warn("Could not fetch Google user details:", e);
      }

      // Default features to active upon linking successfully
      config.sheetsSyncActive = true;
      config.gmailAlertsActive = true;
      saveWorkspaceConfig(config);
      appendAuditLog("Google Account Connect (Permanent)", 200, `Linked as ${config.adminEmail} with refresh capabilities.`);

      res.send(`
        <html>
          <body style="font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 50px 20px; background-color: #fcfcfd;">
            <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #eef0f3;">
              <h2 style="color: #10b981; margin-bottom: 8px;">✓ Account Successfully Linked!</h2>
              <p style="color: #6b7280; font-size: 15px; line-height: 1.5; margin-bottom: 24px;">
                Your Google Workspace connection is activated with live multi-hour auto-refresh capability. Your B2B workspace will stay connected indefinitely.
              </p>
              <p style="color: #9ca3af; font-size: 13px;">This window will close automatically in a moment.</p>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                setTimeout(() => { window.close(); }, 1800);
              } else {
                setTimeout(() => { window.location.href = '/'; }, 2500);
              }
            </script>
          </body>
        </html>
      `);
    } catch (err: any) {
      res.status(500).send(`Server Error during OAuth Callback: ${err.message}`);
    }
  });

  app.post("/api/workspace/create-sheet", async (req, res) => {
    try {
      const config = getWorkspaceConfig();
      await refreshWorkspaceTokenIfNeeded(config);
      if (!config.accessToken) {
        return res.status(401).json({ status: "error", message: "Google Workspace accounts not authorized yet. Please link your account first." });
      }

      console.log("[SERVER WORKSPACE] Organizing and setting up workspace on behalf of:", config.adminEmail);
      
      // 1. Create Folder "Inchpaper B2B RFQs Portal" if it doesn't exist
      let folderId = config.folderId;
      let folderUrl = config.folderUrl;

      if (folderId) {
        try {
          console.log("[SERVER WORKSPACE] Verifying existing folder accessibility during creation...");
          const folderCheck = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?fields=id`, {
            headers: {
              "Authorization": `Bearer ${config.accessToken}`
            }
          });
          if (!folderCheck.ok) {
            console.log("[SERVER WORKSPACE] Folder verification failed (possibly deleted). Resetting reference.");
            folderId = null;
            folderUrl = null;
            config.folderId = null;
            config.folderUrl = null;
            saveWorkspaceConfig(config);
          }
        } catch (errCheck) {
          console.warn("[SERVER WORKSPACE] Failed to verify folder existence:", errCheck);
        }
      }

      if (!folderId) {
        console.log("[SERVER WORKSPACE] Creating dedicated corporate Google Drive parent folder...");
        const folderResponse = await fetch("https://www.googleapis.com/drive/v3/files", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${config.accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: "Inchpaper B2B RFQs Portal",
            mimeType: "application/vnd.google-apps.folder"
          })
        });

        if (folderResponse.ok) {
          const folderData = await folderResponse.json();
          folderId = folderData.id;
          folderUrl = `https://drive.google.com/drive/folders/${folderId}`;
          console.log("[SERVER WORKSPACE] Core Folder created successfully:", folderId);
        } else {
          const errText = await folderResponse.text();
          console.warn("[SERVER WORKSPACE] Could not provision Folder, fallback to root drive:", errText);
        }
      }

      // 2. Create Spreadsheet inside the folder
      console.log("[SERVER WORKSPACE] Creating Google Sheet inside the folder...");
      const createResponse = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: "Inchpaper B2B RFQs Client Database",
          mimeType: "application/vnd.google-apps.spreadsheet",
          parents: folderId ? [folderId] : []
        })
      });

      if (!createResponse.ok) {
        const errText = await createResponse.text();
        return res.status(createResponse.status).json({ status: "error", message: `Spreadsheet template initialization failed: ${errText}` });
      }

      const sheetData = await createResponse.json();
      const spreadsheetId = sheetData.id;
      const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

      if (!folderUrl) {
        folderUrl = "https://drive.google.com/drive/my-drive";
      }

      // Immediately write header row to Sheet1
      const headerValues = [
        "Ticket ID",
        "Sourcing Time",
        "Company Name",
        "Contact Person",
        "Corporate Email",
        "Mobile Helpline",
        "City/Location",
        "Industry Sector",
        "Monthly Budget",
        "Categories Needed",
        "Requirement Files"
      ];

      const writeHeaderResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${config.accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            range: "Sheet1!A1",
            majorDimension: "ROWS",
            values: [headerValues]
          })
        }
      );

      if (!writeHeaderResponse.ok) {
        console.warn("[SERVER WORKSPACE] Header write returned non-ok status:", writeHeaderResponse.status);
      }

      config.spreadsheetId = spreadsheetId;
      config.spreadsheetUrl = spreadsheetUrl;
      config.folderId = folderId;
      config.folderUrl = folderUrl;
      config.sheetsSyncActive = true;
      saveWorkspaceConfig(config);

      res.json({
        status: "success",
        message: "Google Sheet successfully created inside dedicated 'Inchpaper B2B RFQs Portal' folder with standard headers.",
        spreadsheetId,
        spreadsheetUrl,
        folderUrl
      });
    } catch (err: any) {
      console.error("[SERVER WORKSPACE] create-sheet failure:", err);
      res.status(500).json({ status: "error", message: err.message });
    }
  });

  // Comprehensive diagnosis of current Google auth, sheet sync and gmail status
  app.get("/api/workspace/diagnostics", async (req, res) => {
    try {
      const config = getWorkspaceConfig();
      await refreshWorkspaceTokenIfNeeded(config);
      if (!config.accessToken) {
        return res.json({
          status: "disconnected",
          message: "Google Account is not connected yet.",
          details: {
            hasToken: false,
            adminEmail: config.adminEmail
          }
        });
      }

      const diagnostics: any = {
        tokenStatus: "checking",
        tokenExpiresIn: null,
        scopes: [],
        sheetStatus: "not_checked",
        sheetError: null,
        folderStatus: "not_checked",
        folderError: null,
        gmailStatus: "not_checked",
        gmailError: null
      };

      // 1. Validate Access Token via Google OAuth2 tokeninfo endpoint
      try {
        const tokenRes = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${config.accessToken}`);
        if (tokenRes.ok) {
          const info = await tokenRes.json();
          diagnostics.tokenStatus = "valid";
          diagnostics.tokenExpiresIn = parseInt(info.expires_in) || 3600;
          diagnostics.scopes = info.scope ? info.scope.split(" ") : [];
        } else {
          const errText = await tokenRes.text();
          diagnostics.tokenStatus = "invalid_or_expired";
          diagnostics.tokenError = errText;
          return res.json({
            status: "error",
            message: "Stored Google Access Token is invalid or expired.",
            details: diagnostics
          });
        }
      } catch (err: any) {
        diagnostics.tokenStatus = "error";
        diagnostics.tokenError = err.message;
        return res.json({
          status: "error",
          message: "Could not contact Google Tokeninfo API.",
          details: diagnostics
        });
      }

      // 2. Validate linked Google Sheet if active
      if (config.spreadsheetId) {
        try {
          const sheetRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}`, {
            headers: { "Authorization": `Bearer ${config.accessToken}` }
          });
          if (sheetRes.ok) {
            const sheetMeta = await sheetRes.json();
            diagnostics.sheetStatus = "accessible";
            diagnostics.sheetTitle = sheetMeta.properties?.title || "Unknown";
            if (sheetMeta.sheets && sheetMeta.sheets.length > 0) {
              diagnostics.firstSheetTitle = sheetMeta.sheets[0].properties?.title || "Sheet1";
            }
          } else {
            const errText = await sheetRes.text();
            diagnostics.sheetStatus = "inaccessible";
            diagnostics.sheetError = `Status ${sheetRes.status}: ${errText}`;
            if (sheetRes.status === 404) {
              console.log("[SERVER WORKSPACE] Stale Spreadsheet ID detected (404). Auto-clearing config.");
              config.spreadsheetId = null;
              config.spreadsheetUrl = null;
              saveWorkspaceConfig(config);
            }
          }
        } catch (err: any) {
          diagnostics.sheetStatus = "error";
          diagnostics.sheetError = err.message;
        }
      } else {
        diagnostics.sheetStatus = "not_linked";
      }

      // 3. Validate linked Google Drive Folder
      if (config.folderId) {
        try {
          const folderRes = await fetch(`https://www.googleapis.com/drive/v3/files/${config.folderId}?fields=id,name,mimeType`, {
            headers: { "Authorization": `Bearer ${config.accessToken}` }
          });
          if (folderRes.ok) {
            const folderMeta = await folderRes.json();
            diagnostics.folderStatus = "accessible";
            diagnostics.folderName = folderMeta.name;
          } else {
            const errText = await folderRes.text();
            diagnostics.folderStatus = "inaccessible";
            diagnostics.folderError = `Status ${folderRes.status}: ${errText}`;
            if (folderRes.status === 404) {
              console.log("[SERVER WORKSPACE] Stale Folder ID detected (404). Auto-clearing config.");
              config.folderId = null;
              config.folderUrl = null;
              saveWorkspaceConfig(config);
            }
          }
        } catch (err: any) {
          diagnostics.folderStatus = "error";
          diagnostics.folderError = err.message;
        }
      } else {
        diagnostics.folderStatus = "not_linked";
      }

      // 4. Validate Gmail send capability
      const hasGmailScope = diagnostics.scopes.some((s: string) => s.includes("gmail.send") || s.includes("gmail.modify") || s.includes("mail.google.com"));
      if (hasGmailScope) {
        diagnostics.gmailStatus = "authorized";
      } else {
        diagnostics.gmailStatus = "not_authorized";
        diagnostics.gmailError = "Missing 'gmail.send' OAuth scope authorization.";
      }

      diagnostics.auditLogs = getAuditLogs();

      res.json({
        status: "success",
        message: "Diagnostics compiled successfully.",
        details: diagnostics,
        config: {
          adminEmail: config.adminEmail,
          sheetsSyncActive: config.sheetsSyncActive,
          gmailAlertsActive: config.gmailAlertsActive,
          spreadsheetId: config.spreadsheetId,
          folderId: config.folderId
        }
      });

    } catch (err: any) {
      console.error("[SERVER WORKSPACE] Diagnostics failure:", err);
      res.status(500).json({ status: "error", message: err.message });
    }
  });

  // Trigger a real-time manual test email via Gmail to the connected admin
  app.post("/api/workspace/test-email", async (req, res) => {
    try {
      const config = getWorkspaceConfig();
      await refreshWorkspaceTokenIfNeeded(config);
      if (!config.accessToken) {
        return res.status(401).json({ status: "error", message: "Google Workspace is not linked yet. Please link your account first under Workspace Integration." });
      }
      if (!config.adminEmail) {
        return res.status(400).json({ status: "error", message: "Admin Email is not configured." });
      }

      const testSubject = `[TEST ALERT] Gmail Connection Test - Inchpaper B2B Portal`;
      const testHtmlBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
  <div style="background-color: #7D0909; padding: 24px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px;">INCHPAPER B2B PORTAL</h1>
    <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Gmail API Connection Relay Test</p>
  </div>
  <div style="padding: 24px; background-color: #ffffff;">
    <p style="font-size: 15px; color: #1a202c; font-weight: bold; margin-top: 0;">Connection Relay Success!</p>
    <p style="font-size: 14px; color: #4a5568; line-height: 1.5;">This is an enterprise connection validation message dispatched automatically from your procurement website backend at <b>b2b.inchpaper.com</b>.</p>
    <p style="font-size: 14px; color: #4a5568; line-height: 1.5;">Since you are receiving this message inside your inbox, it confirms that your Google Cloud OAuth application parameters, authentication tokens, scopes, and Gmail API routing are <b>100% active and running correctly</b>.</p>
    
    <div style="margin-top: 25px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 4px;">
      <p style="margin: 0; font-size: 12px; color: #166534; font-weight: bold;">System Status: OPERATIONAL</p>
      <p style="margin: 5px 0 0; font-size: 12px; color: #14532d; line-height: 1.4;">
        Submitting future RFQs will automatically trigger instant, simultaneous notification alerts to both the administrators and the procurement customers successfully.
      </p>
    </div>
  </div>
  <div style="background-color: #edf2f7; padding: 16px; text-align: center; border-top: 1px solid #edf2f7;">
    <p style="margin: 0; font-size: 11px; color: #718096;">Inchpaper Corporate Headquarters • Google Workspace Integration</p>
  </div>
</div>`;

      const rawMime = [
        `From: ${config.adminEmail}`,
        `To: ${config.adminEmail}`,
        `Subject: ${testSubject}`,
        "MIME-Version: 1.0",
        "Content-Type: text/html; charset=utf-8",
        "",
        testHtmlBody
      ].join("\r\n");

      const normalizedMime = rawMime.replace(/\r?\n/g, "\r\n");
      const b64Mime = Buffer.from(normalizedMime, "utf-8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      console.log(`[SERVER TEST EMAIL] Dispatching manual connection test send to ${config.adminEmail}...`);
      const response = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ raw: b64Mime })
      });

      const responseBody = await response.text();
      let responseJson: any = null;
      try {
        responseJson = JSON.parse(responseBody);
      } catch (e) {}

      if (response.ok) {
        appendAuditLog("Gmail: Manual Test Dispatch", 200, `Success! Sent connection validation email to ${config.adminEmail}.`);
        res.json({
          status: "success",
          message: "Connection verification email sent successfully. Please check your inbox for '[TEST ALERT] Gmail Connection Test - Inchpaper B2B Portal'.",
          details: responseJson
        });
      } else {
        appendAuditLog("Gmail: Manual Test Dispatch", response.status, `Failed to deliver test email. Response: ${responseBody}`);
        res.status(response.status).json({
          status: "error",
          message: `Google API rejected email sending. Please ensure Gmail API is enabled in your Google Cloud Developer Console.`,
          details: responseJson || responseBody
        });
      }
    } catch (err: any) {
      console.error("[SERVER TEST EMAIL] Failure:", err);
      res.status(500).json({ status: "error", message: err.message });
    }
  });

async function uploadFileToDrive(accessToken: string, file: { name: string; base64: string }, folderId: string): Promise<string | null> {
  try {
    const boundary = "314159265358979323846";
    
    // safe parsing for data url scheme
    let mimeType = "application/octet-stream";
    let base64Part = file.base64;
    
    if (file.base64.startsWith("data:")) {
      const mimeMatch = file.base64.match(/^data:([^;]+);base64,/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
        base64Part = file.base64.slice(mimeMatch[0].length);
      }
    }
    
    // Parse to binary buffer instead of relying on base64 transfer encoding headers which fail in Drive's multipart parser
    const fileBuffer = Buffer.from(base64Part, "base64");
    
    const metadata = {
      name: file.name,
      parents: [folderId]
    };
    
    const firstDelimiter = `--${boundary}\r\n`;
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--\r\n`;
    
    const multipartBody = Buffer.concat([
      Buffer.from(firstDelimiter),
      Buffer.from("Content-Type: application/json; charset=UTF-8\r\n\r\n"),
      Buffer.from(JSON.stringify(metadata)),
      Buffer.from(delimiter),
      Buffer.from(`Content-Type: ${mimeType}\r\n\r\n`), // empty line, then binary contents
      fileBuffer,
      Buffer.from(closeDelimiter)
    ]);
    
    console.log(`[SERVICE UPLOAD] Dispatching ${file.name} to Drive folder ${folderId} (decoding checked: buffer size is ${fileBuffer.length} bytes)...`);
    const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
        "Content-Length": multipartBody.length.toString()
      },
      body: multipartBody
    });
    
    if (response.ok) {
      const data = (await response.json()) as { id: string; webViewLink?: string };
      const webLink = data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`;
      console.log(`[SERVICE UPLOAD] Successfully uploaded ${file.name} (id: ${data.id})`);
      appendAuditLog(`Google Drive: Upload attachment [${file.name}]`, 200, `Success! File registered under ID: ${data.id}. Link established.`);
      return webLink;
    } else {
      const errText = await response.text();
      console.error(`[SERVICE UPLOAD] Drive upload failed for ${file.name}:`, errText);
      appendAuditLog(`Google Drive: Upload attachment [${file.name}]`, response.status, `Failed to upload file. Error: ${errText}`);
      return null;
    }
  } catch (err: any) {
    console.error(`[SERVICE UPLOAD] Drive upload exception for ${file.name}:`, err);
    appendAuditLog(`Google Drive: Upload attachment [${file.name}]`, 500, `Network exception: ${err.message}`);
    return null;
  }
}

  // Resilient API route to dispatch leads to Make.com and bypass CORS
  app.post("/api/submit-rfq", async (req, res) => {
    try {
      const payload = req.body;
      console.log("[SERVER STATE] New RFQ payload received:", payload);

      // Back up this submission to our local server JSON database immediately as an bulletproof failsafe
      try {
        const subs = getLocalSubmissions();
        const pTicket = payload.ticketId || payload.ticket_id || payload["Ticket ID"];
        const existingIdx = subs.findIndex((s: any) => {
          const sTicket = s.ticketId || s.ticket_id || s["Ticket ID"];
          return sTicket && pTicket && sTicket === pTicket;
        });
        if (existingIdx > -1) {
          subs[existingIdx] = payload;
        } else {
          subs.unshift(payload);
        }
        saveLocalSubmissions(subs);
        console.log("[SERVER STATE] RFQ lead successfully backed up to local server JSON database.");

        // Clear related record from server-side abandoned leads
        const email = payload.corporateEmail || payload.corporate_email || payload["Corporate Email"];
        const comp = payload.companyName || payload.company_name || payload["Company Name"];
        if (email || comp) {
          let abandoned = getLocalAbandoned();
          abandoned = abandoned.filter((lead: any) => {
            const leadEmail = lead.corporateEmail || lead.corporate_email || lead["Corporate Email"];
            const leadComp = lead.companyName || lead.company_name || lead["Company Name"];
            const isEmailMatch = email && leadEmail === email;
            const isCompMatch = comp && leadComp === comp;
            return !isEmailMatch && !isCompMatch;
          });
          saveLocalAbandoned(abandoned);
        }
      } catch (backupError: any) {
        console.error("[SERVER STATE] Warning: Failed to write to server local JSON disk:", backupError.message);
      }

      // Real, valid Make.com regional Webhook URLs based on the active EU1 instance.
      const hookIds = [
        "9j073zud30evc56dkol3v8mqlye8r4w6", // Customer zero '0' spelling
        "9jo73zud30evc56dkol3v8mqlye8r4w6", // Customer letter 'o' spelling
        "l2ef1wyzacy1sahy8doq61h0hwuq27xc"  // Original Make.com hook
      ];

      const endpoints: string[] = [];
      for (const id of hookIds) {
        endpoints.push(`https://hook.eu1.make.com/${id}`);
      }

      console.log(`[SERVER PROXY] Dispatching to ${endpoints.length} targeted Make.com webhook options`);

      const results = [];
      for (const url of endpoints) {
        try {
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });
          const bodyText = await response.text();
          console.log(`[SERVER POST] Response from ${url}: Status=${response.status}, Body=${bodyText}`);
          results.push({ url, status: response.status, body: bodyText, ok: response.ok });
        } catch (innerError: any) {
          console.log(`[SERVER PROXY INFO] Optional endpoint ${url} not active or skipped: ${innerError.message}`);
          results.push({ url, ok: false, error: innerError.message });
        }
      }

      // Google Workspace Integration (Google Sheets Sync and Gmail Alert Notifications)
      const workspaceConfig = getWorkspaceConfig();
      await refreshWorkspaceTokenIfNeeded(workspaceConfig);
      const workspaceLog: string[] = [];

      // A) Handle file uploads up-front if they exist and we're linked with Drive
      const ticketId = payload.ticketId || payload.ticket_id || payload["Ticket ID"] || "N/A";
      const companyName = payload.companyName || payload.company_name || payload["Company Name"] || "N/A";
      const contactPerson = payload.contactPerson || payload.contact_person || payload["Contact Person"] || payload["Contact Name"] || payload["contact_person"] || "N/A";
      const corporateEmail = payload.corporateEmail || payload.corporate_email || payload["Corporate Email"] || "N/A";
      const phoneNumber = payload.phoneNumber || payload.phone_number || payload.contactPhone || payload["Phone Number"] || payload["Mobile Helpline"] || "N/A";
      const city = payload.city || payload.city_location || payload["City"] || payload["City / Location"] || "N/A";
      const industryType = payload.industryType || payload.industry_type || payload["Industry Type"] || payload["Industry Sector"] || "N/A";
      const monthlyBudget = payload.monthlyBudget || payload.monthly_budget || payload["Monthly Budget"] || payload["Est. Monthly Budget"] || "N/A";
      
      const selectedCategoriesString = payload.selectedCategoriesString || payload.selected_categories_string || payload["Categories Needed"] || (Array.isArray(payload.selected_categories) ? payload.selected_categories.map((c: any) => typeof c === 'object' ? (c.name || c.value || JSON.stringify(c)) : c).join(", ") : null) || "N/A";
      
      const uploadedFileNamesString = payload.uploadedFileNamesString || payload.uploaded_file_names_string || payload["Uploaded File Names"] || payload.uploaded_file_names || "None";
      const uploadedFilesWithBase64 = payload.uploadedFilesWithBase64 || payload.uploaded_files_with_base64 || [];

      const submittedAtFormatted = payload.submittedAtFormatted || payload.submitted_at_formatted || payload["Sourcing Time"] || payload["Submitted At"] || new Date().toLocaleString("en-IN");

      let fileLinksString = uploadedFileNamesString;
      const filesForEmailMarkup: { name: string; url: string }[] = [];

      if (workspaceConfig.accessToken && uploadedFilesWithBase64 && Array.isArray(uploadedFilesWithBase64) && uploadedFilesWithBase64.length > 0) {
        console.log(`[SERVER WORKSPACE] Found ${uploadedFilesWithBase64.length} requirement document(s). Uploading to Drive...`);
        
        let targetFolderId = workspaceConfig.folderId;
        if (targetFolderId) {
          try {
            console.log("[SERVER WORKSPACE] Verifying target folder accessibility before upload...");
            const folderCheck = await fetch(`https://www.googleapis.com/drive/v3/files/${targetFolderId}?fields=id`, {
              headers: {
                "Authorization": `Bearer ${workspaceConfig.accessToken}`
              }
            });
            if (!folderCheck.ok) {
              console.log("[SERVER WORKSPACE] Stored submission target folder is inaccessible. Clearing reference.");
              targetFolderId = null;
              workspaceConfig.folderId = null;
              workspaceConfig.folderUrl = null;
              saveWorkspaceConfig(workspaceConfig);
            }
          } catch (errCheck) {
            console.warn("[SERVER WORKSPACE] Submission folder check failed:", errCheck);
          }
        }

        if (!targetFolderId) {
          try {
            console.log("[SERVER WORKSPACE] Target Drive folder ID not cached. Querying or creating 'Inchpaper B2B RFQs Portal' folder dynamically...");
            const searchResponse = await fetch(
              `https://www.googleapis.com/drive/v3/files?q=name='Inchpaper B2B RFQs Portal' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
              {
                headers: {
                  "Authorization": `Bearer ${workspaceConfig.accessToken}`
                }
              }
            );
            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              if (searchData.files && searchData.files.length > 0) {
                targetFolderId = searchData.files[0].id;
                workspaceConfig.folderId = targetFolderId;
                workspaceConfig.folderUrl = `https://drive.google.com/drive/folders/${targetFolderId}`;
                saveWorkspaceConfig(workspaceConfig);
                console.log("[SERVER WORKSPACE] Dynamically located existing parent folder:", targetFolderId);
              } else {
                console.log("[SERVER WORKSPACE] Folder does not exist. Creating 'Inchpaper B2B RFQs Portal' Folder dynamically...");
                const folderResponse = await fetch("https://www.googleapis.com/drive/v3/files", {
                  method: "POST",
                  headers: {
                    "Authorization": `Bearer ${workspaceConfig.accessToken}`,
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                    name: "Inchpaper B2B RFQs Portal",
                    mimeType: "application/vnd.google-apps.folder"
                  })
                });
                if (folderResponse.ok) {
                  const folderData = await folderResponse.json();
                  targetFolderId = folderData.id;
                  workspaceConfig.folderId = targetFolderId;
                  workspaceConfig.folderUrl = `https://drive.google.com/drive/folders/${targetFolderId}`;
                  saveWorkspaceConfig(workspaceConfig);
                  console.log("[SERVER WORKSPACE] Dynamically created and registered parent folder:", targetFolderId);
                } else {
                  console.error("[SERVER WORKSPACE] Dynamic folder creation request failed:", await folderResponse.text());
                }
              }
            } else {
              console.error("[SERVER WORKSPACE] Folder search failed:", await searchResponse.text());
            }
          } catch (err) {
            console.error("[SERVER WORKSPACE] Dynamic folder lookup exception:", err);
          }
        }

        const activeFolderId = targetFolderId || "root";
        const formulaParts: string[] = [];
        for (const fileItem of uploadedFilesWithBase64) {
          if (fileItem.base64 && fileItem.name) {
            const driveUrl = await uploadFileToDrive(workspaceConfig.accessToken, fileItem, activeFolderId);
            if (driveUrl) {
              formulaParts.push(`=HYPERLINK("${driveUrl}", "${fileItem.name}")`);
              filesForEmailMarkup.push({ name: fileItem.name, url: driveUrl });
            } else {
              formulaParts.push(fileItem.name);
              filesForEmailMarkup.push({ name: fileItem.name, url: "" });
            }
          }
        }
        if (formulaParts.length > 0) {
          fileLinksString = formulaParts.join(", ");
        }
      }

      // B) Google Sheets Sync Handler
      if (workspaceConfig.sheetsSyncActive && workspaceConfig.accessToken && workspaceConfig.spreadsheetId) {
        console.log("[SERVER WORKSPACE] Google Sheets Sync is active. Appending RFQ...");
        try {
          const rowValues = [
            ticketId,
            submittedAtFormatted,
            companyName,
            contactPerson,
            corporateEmail,
            phoneNumber,
            city,
            industryType,
            monthlyBudget,
            selectedCategoriesString,
            fileLinksString // Clickable "=HYPERLINK(...)" formulas!
          ];

          // Dynamically obtain the exact sheet tab name of the first worksheet in this spreadsheet
          let sheetTabName = "Sheet1";
          try {
            const sheetMetaResponse = await fetch(
              `https://sheets.googleapis.com/v4/spreadsheets/${workspaceConfig.spreadsheetId}?fields=sheets(properties(title))`,
              {
                headers: { "Authorization": `Bearer ${workspaceConfig.accessToken}` }
              }
            );
            if (sheetMetaResponse.ok) {
              const sheetMeta = await sheetMetaResponse.json();
              if (sheetMeta.sheets && sheetMeta.sheets.length > 0) {
                sheetTabName = sheetMeta.sheets[0].properties?.title || "Sheet1";
                console.log(`[SERVER WORKSPACE] Dynamically located first sheet tab name: '${sheetTabName}'`);
              }
            }
          } catch (metaErr) {
            console.warn("[SERVER WORKSPACE] Failed to fetch sheet tab dynamically, fallback to Sheet1:", metaErr);
          }

          const sheetsResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${workspaceConfig.spreadsheetId}/values/${encodeURIComponent(sheetTabName)}!A1:append?valueInputOption=USER_ENTERED`,
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${workspaceConfig.accessToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                range: `${sheetTabName}!A1`,
                majorDimension: "ROWS",
                values: [rowValues]
              })
            }
          );

          if (sheetsResponse.ok) {
            console.log("[SERVER WORKSPACE] Google Sheets Sync Success!");
            workspaceLog.push("Google Sheets Row appended successfully.");
          } else {
            const errBody = await sheetsResponse.text();
            console.warn(`[SERVER WORKSPACE] Sheets API error: ${sheetsResponse.status} - ${errBody}`);
            workspaceLog.push(`Sheets API response error: ${sheetsResponse.status}`);
            
            // Auto de-activate token if expired so system doesn't keep hammering with bad token
            if (sheetsResponse.status === 401) {
              workspaceConfig.accessToken = null;
              saveWorkspaceConfig(workspaceConfig);
              workspaceLog.push("Access token unauthorized (expired). Resetting server token representation.");
            }
          }
        } catch (sheetErr: any) {
          console.error("[SERVER WORKSPACE] Sheets Sync Failed:", sheetErr);
          workspaceLog.push(`Sheets networking error: ${sheetErr.message}`);
        }
      } else {
        workspaceLog.push("Sheets sync skipped (not active, no token, or no sheet linked yet).");
      }

      // C) Gmail Notifications Handler
      if (workspaceConfig.gmailAlertsActive && workspaceConfig.accessToken && workspaceConfig.adminEmail) {
        console.log("[SERVER WORKSPACE] Gmail Alerts are active. Dispatching alert emails...");
        try {
          // Resolve actual dynamic host URL to serve the embedded logo asset stably
          const requestHost = req.get("host") || "ais-dev-vah5yy5ennj3byylppz3ri-894778684127.asia-southeast1.run.app";
          const baseUrl = requestHost.includes("localhost") || requestHost.includes("127.0.0.1") ? `http://${requestHost}` : `https://${requestHost}`;
          const logoUrl = `${baseUrl}/inchpaper_logo_11.png`;

          // Render files attachment column with clickable HTML anchor tags for Gmail
          let mailFilesHtml = "None";
          if (filesForEmailMarkup.length > 0) {
            mailFilesHtml = filesForEmailMarkup.map(f => f.url ? `<a href="${f.url}" style="color: #7D0909; text-decoration: underline; font-weight: bold;">${f.name}</a>` : f.name).join(", ");
          } else if (uploadedFileNamesString) {
            mailFilesHtml = uploadedFileNamesString;
          }

          // Template 1: For the Administrator (info@inchpaper.com)
          const adminHtmlBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
  <div style="background-color: #7D0909; padding: 24px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px;">INCHPAPER B2B PROCUREMENT</h1>
    <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">New Sourcing RFQ Submitted</p>
  </div>
  <div style="padding: 24px; background-color: #ffffff;">
    <p style="font-size: 14px; color: #4a5568; line-height: 1.5; margin-top: 0;">Hello Inchpaper Team,</p>
    <p style="font-size: 14px; color: #4a5568; line-height: 1.5;">A new bulk procurement RFQ has been logged from the corporate launch portal. Below are the registered corporate credentials:</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
      <tr style="background-color: #f7fafc;">
        <td style="padding: 10px; border: 1px solid #edf2f7; font-weight: bold; width: 40%; color: #2d3748;">Ticket ID</td>
        <td style="padding: 10px; border: 1px solid #edf2f7; color: #7D0909; font-family: monospace; font-weight: bold;">${ticketId}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #edf2f7; font-weight: bold; color: #2d3748;">Company Name</td>
        <td style="padding: 10px; border: 1px solid #edf2f7; color: #4a5568;">${companyName}</td>
      </tr>
      <tr style="background-color: #f7fafc;">
        <td style="padding: 10px; border: 1px solid #edf2f7; font-weight: bold; color: #2d3748;">Contact Person</td>
        <td style="padding: 10px; border: 1px solid #edf2f7; color: #4a5568;">${contactPerson}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #edf2f7; font-weight: bold; color: #2d3748;">Corporate Email</td>
        <td style="padding: 10px; border: 1px solid #edf2f7; color: #4a5568;"><a href="mailto:${corporateEmail || ""}" style="color: #7D0909; text-decoration: none;">${corporateEmail}</a></td>
      </tr>
      <tr style="background-color: #f7fafc;">
        <td style="padding: 10px; border: 1px solid #edf2f7; font-weight: bold; color: #2d3748;">Mobile Helpline</td>
        <td style="padding: 10px; border: 1px solid #edf2f7; color: #4a5568;">${phoneNumber}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #edf2f7; font-weight: bold; color: #2d3748;">City / Location</td>
        <td style="padding: 10px; border: 1px solid #edf2f7; color: #4a5568;">${city}</td>
      </tr>
      <tr style="background-color: #f7fafc;">
        <td style="padding: 10px; border: 1px solid #edf2f7; font-weight: bold; color: #2d3748;">Industry Sector</td>
        <td style="padding: 10px; border: 1px solid #edf2f7; color: #4a5568;">${industryType}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #edf2f7; font-weight: bold; color: #2d3748;">Monthly Budget</td>
        <td style="padding: 10px; border: 1px solid #edf2f7; color: #4a5568;">${monthlyBudget}</td>
      </tr>
      <tr style="background-color: #f7fafc;">
        <td style="padding: 10px; border: 1px solid #edf2f7; font-weight: bold; color: #2d3748;">Categories Needed</td>
        <td style="padding: 10px; border: 1px solid #edf2f7; color: #4a5568;">${selectedCategoriesString}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #edf2f7; font-weight: bold; color: #2d3748;">Requirement Files</td>
        <td style="padding: 10px; border: 1px solid #edf2f7; color: #4a5568;">${mailFilesHtml}</td>
      </tr>
      <tr style="background-color: #f7fafc;">
        <td style="padding: 10px; border: 1px solid #edf2f7; font-weight: bold; color: #2d3748;">Sourcing Timestamp</td>
        <td style="padding: 10px; border: 1px solid #edf2f7; color: #718096;">${submittedAtFormatted}</td>
      </tr>
    </table>
    
    <div style="margin-top: 25px; padding: 15px; background-color: #fffaf0; border-left: 4px solid #dd6b20; border-radius: 4px;">
      <p style="margin: 0; font-size: 12px; color: #c05621; font-weight: bold;">Continuous Compliance Action Item:</p>
      <p style="margin: 5px 0 0; font-size: 12px; color: #7b341e; line-height: 1.4;">
        This record has been indexed automatically inside your Google Sheet client database and linked parent folder. Trade Credit validation should begin within 2 hours.
      </p>
    </div>
  </div>
  <div style="background-color: #edf2f7; padding: 16px; text-align: center; border-top: 1px solid #edf2f7;">
    <p style="margin: 0; font-size: 11px; color: #718096;">Inchpaper Corporate CRM Engine • Google Workspace Automation</p>
  </div>
</div>`;

          // Template 2: Reply/Confirmation to the submitting client
          const userHtmlBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
  <div style="background-color: #7D0909; padding: 24px; text-align: center; color: white;">
    <img src="${logoUrl}" alt="Inchpaper" style="max-height: 55px; height: auto; max-width: 220px; margin-bottom: 12px; display: inline-block;" />
    <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 1px; color: #ffffff;">INCHPAPER ENTERPRISE SUPPLY DESK</h1>
    <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9; color: #ffffff;">RFQ Sourcing Confirmation • Ticket: ${ticketId}</p>
  </div>
  <div style="padding: 24px; background-color: #ffffff;">
    <p style="font-size: 14px; color: #4a5568; line-height: 1.5; margin-top: 0;">Dear ${contactPerson !== "N/A" ? contactPerson : "Procurement Team"},</p>
    <p style="font-size: 14px; color: #4a5568; line-height: 1.5;">Thank you for your bulk RFQ inquiry. This note confirms we have successfully registered your corporate sourcing request inside Inchpaper's central B2B routing system.</p>
    <p style="font-size: 14px; color: #4a5568; line-height: 1.5;">A Key Account Manager has been assigned to your profile. We represent direct manufacturing pricing, direct HSN verification, and complete consolidated logistics support across all sectors.</p>
    
    <div style="background-color: #f7fafc; padding: 16px; border-radius: 6px; margin: 20px 0; border: 1px solid #edf2f7;">
      <h3 style="margin: 0 0 10px; font-size: 13px; color: #7D0909; font-weight: bold; border-bottom: 1px solid #edf2f7; padding-bottom: 5px;">Inquiry Sourcing Summary:</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #4a5568;">
         <tr>
           <td style="padding: 6px 0; font-weight: bold; width: 40%;">Ticket Reference:</td>
           <td style="padding: 6px 0; color: #7D0909; font-family: monospace; font-weight: bold;">${ticketId}</td>
         </tr>
         <tr>
           <td style="padding: 6px 0; font-weight: bold;">Corporate Entity:</td>
           <td style="padding: 6px 0; font-weight: bold; color: #2d3748;">${companyName}</td>
         </tr>
         <tr>
           <td style="padding: 6px 0; font-weight: bold;">Interest Categories:</td>
           <td style="padding: 6px 0;">${selectedCategoriesString}</td>
         </tr>
         <tr>
           <td style="padding: 6px 0; font-weight: bold;">Est. Monthly Budget:</td>
           <td style="padding: 6px 0;">${monthlyBudget}</td>
         </tr>
         <tr>
           <td style="padding: 6px 0; font-weight: bold;">Requirements Sheet:</td>
           <td style="padding: 6px 0; font-style: italic;">${mailFilesHtml}</td>
         </tr>
      </table>
    </div>

    <p style="font-size: 14px; color: #4a5568; line-height: 1.5;"><b>What's Next?</b><br>Our dedicated pricing analyst will map your SKU / BOM configurations and provide you with a comprehensive quotation. Expect a reply with the quotation in <b>1 business working day</b>.</p>
    
    <p style="font-size: 14px; color: #4a5568; line-height: 1.5;">If you have any further specifications, you can connect directly with our priority customer support desk at <b>+91-77038 60982</b> or reply to this email.</p>
    
    <p style="font-family: Arial; font-size: 13px; color: #4a5568; line-height: 1.5; margin-top: 25px; margin-bottom: 0;">
      Warm Regards,<br>
      <b>Team Inchpaper</b><br>
      Enterprise Supply Desk
    </p>
  </div>
  <div style="background-color: #edf2f7; padding: 16px; text-align: center; border-top: 1px solid #edf2f7;">
    <p style="margin: 0; font-size: 11px; color: #718096;">© 2026 Inchpaper Private Limited. All Business Rights Reserved.</p>
  </div>
</div>`;

          // 1) Submit Admin Notification
          const adminSubject = `[New RFQ] ${companyName} - ${ticketId}`;
          const rawAdminMime = [
            `From: ${workspaceConfig.adminEmail}`,
            `To: ${workspaceConfig.adminEmail}`,
            `Subject: ${adminSubject}`,
            "MIME-Version: 1.0",
            "Content-Type: text/html; charset=utf-8",
            "",
            adminHtmlBody
          ].join("\r\n");

          const normalizedAdminMime = rawAdminMime.replace(/\r?\n/g, "\r\n");

          const b64Admin = Buffer.from(normalizedAdminMime, "utf-8")
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");

          console.log(`[GMAIL DISPATCH] Sending admin notification to ${workspaceConfig.adminEmail}...`);
          const adminRes = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages/send", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${workspaceConfig.accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ raw: b64Admin })
          });

          if (adminRes.ok) {
            console.log("[SERVER WORKSPACE] Admin Gmail notification dispatched.");
            workspaceLog.push("Administrative notification email alert dispatched successfully.");
            appendAuditLog("Gmail: Admin Alert Dispatch", 200, `Success! Alert [${adminSubject}] delivered to ${workspaceConfig.adminEmail}.`);
          } else {
            const errB = await adminRes.text();
            console.warn("[SERVER WORKSPACE] Admin Gmail API failure:", errB);
            workspaceLog.push(`Administrative email alert dispatch failure: ${adminRes.status}`);
            appendAuditLog("Gmail: Admin Alert Dispatch", adminRes.status, `Failed to deliver email. Error: ${errB}`);
          }

          // 2) Submit Client Confirmation Receipt
          if (corporateEmail && corporateEmail.includes("@") && corporateEmail !== "N/A") {
            const clientSubject = `[RFQ Received] Ref: ${ticketId} - Inchpaper Partner Desk`;
            const rawClientMime = [
              `From: ${workspaceConfig.adminEmail}`,
              `To: ${corporateEmail}`,
              `Subject: ${clientSubject}`,
              "MIME-Version: 1.0",
              "Content-Type: text/html; charset=utf-8",
              "",
              userHtmlBody
            ].join("\r\n");

            const normalizedClientMime = rawClientMime.replace(/\r?\n/g, "\r\n");

            const b64Client = Buffer.from(normalizedClientMime, "utf-8")
              .toString("base64")
              .replace(/\+/g, "-")
              .replace(/\//g, "_")
              .replace(/=+$/, "");

            console.log(`[GMAIL DISPATCH] Sending client confirmation receipts to ${corporateEmail}...`);
            const clientRes = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages/send", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${workspaceConfig.accessToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ raw: b64Client })
            });

            if (clientRes.ok) {
              console.log("[SERVER WORKSPACE] Client Confirmation Email dispatched successfully!");
              workspaceLog.push("Client verification receipt email dispatched successfully.");
              appendAuditLog("Gmail: Client Receipt Dispatch", 200, `Success! Receipt [${clientSubject}] delivered to ${corporateEmail}.`);
            } else {
              const errB = await clientRes.text();
              console.warn("[SERVER WORKSPACE] Client Gmail API error:", errB);
              workspaceLog.push(`Client confirmation email failed: ${clientRes.status}`);
              appendAuditLog("Gmail: Client Receipt Dispatch", clientRes.status, `Failed to deliver receipt. Error: ${errB}`);
            }
          }
        } catch (emailErr: any) {
          console.error("[SERVER WORKSPACE] Gmail Send Failed:", emailErr);
          workspaceLog.push(`Gmail networking error: ${emailErr.message}`);
        }
      } else {
        workspaceLog.push("Gmail sending skipped (not active or no admin config).");
      }

      // If at least one outcome (webhook or sheets/gmail sync) succeeded, resolve as a true system success
      const anyOk = results.some(r => r.ok) || workspaceLog.some(log => log.includes("successfully"));
      if (anyOk) {
        res.status(200).json({
          status: "success",
          message: "Data forwarded successfully to webhook and Google Workspace configuration.",
          details: results,
          workspace: workspaceLog
        });
      } else {
        res.status(502).json({
          status: "error",
          message: "All dispatch attempts (Webhooks, Google Sheets, Gmail) failed.",
          details: results,
          workspace: workspaceLog
        });
      }
    } catch (err: any) {
      console.error("[SERVER API ERROR] /api/submit-rfq failure:", err);
      res.status(500).json({
        status: "error",
        message: err.message || "Internal server error"
      });
    }
  });

  // Vite development vs production asset handling middleware
  const isCompiled = !process.argv.some(arg => arg.includes("server.ts"));
  const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER === "true" || isCompiled;
  
  console.log(`[SERVER STARTUP DIAGNOSTICS]`);
  console.log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  - RENDER: ${process.env.RENDER}`);
  console.log(`  - isCompiled: ${isCompiled}`);
  console.log(`  - isProduction: ${isProduction}`);
  console.log(`  - process.argv: ${JSON.stringify(process.argv)}`);

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER STATE] Express server successfully binding on host 0.0.0.0 and port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("[SERVER STATE FAILURE] Bootstrap failed:", error);
});
