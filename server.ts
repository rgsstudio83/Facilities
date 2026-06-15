import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Parse incoming JSON request bodies
  app.use(express.json());

  // API: Resend Email Proxy Endpoint
  app.post("/api/send-email", async (req, res) => {
    const { to, subject, html, from } = req.body;
    
    if (!to || !subject || !html) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes: 'to', 'subject' e 'html'." });
    }

    // Safe, lazy initialization of Resend API Key
    const apiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: "RESEND_API_KEY não foi configurada nas variáveis de ambiente (.env)."
      });
    }

    try {
      const resendClient = new Resend(apiKey);
      
      // Default Resend sandbox sender matches onboarding@resend.dev
      const sender = from || "Facilities Premium <onboarding@resend.dev>";
      
      const { data, error } = await resendClient.emails.send({
        from: sender,
        to: [to],
        subject: subject,
        html: html,
      });

      if (error) {
        console.error("Resend API returned an error:", error);
        return res.status(400).json({ error: error.message });
      }

      console.log(`[Resend] E-mail enviado com sucesso para ${to}. ID: ${data?.id}`);
      return res.json({ success: true, data });
    } catch (err: any) {
      console.error("Internal error sending email via Resend:", err);
      return res.status(500).json({ error: err.message || "Erro interno de rede ao enviar e-mail." });
    }
  });

  // Serve Vite in development or static assets in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
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
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
