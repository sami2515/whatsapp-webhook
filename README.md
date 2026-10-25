# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Web Push / PWA Notifications

Generate valid VAPID keys for browser push notifications:

```bash
npx web-push generate-vapid-keys
```

Set these values in the backend `.env` file:

```env
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:your-email@example.com
```

The public key must be the generated P-256 VAPID public key. Do not commit the private key.

---

## 🚀 100% Free Setup Guide (Zero Developer Cost)

Agar aap direct Meta Cloud se API loge to first **1,000 messages/conversations** jo apko receive honge wo har month bilkul **FREE** honge aur developer cost **0** hogi!

🔗 **Repository:** [https://github.com/sami2515/whatsapp-webhook](https://github.com/sami2515/whatsapp-webhook)

### 🛠️ Step-by-Step Setup:

1. **Repo Download / Clone:**
   - Ye repository download / clone kar lena:
     ```bash
     git clone https://github.com/sami2515/whatsapp-webhook.git
     cd whatsapp-webhook
     ```

2. **Frontend Hosting (Vercel):**
   - Frontend ko **Vercel** per host karna (`vercel.json` already configured hai, easy 1-click deploy).

3. **Backend Hosting (VPS Free Hosting):**
   - Backend ko VPS free hosting per host karna (e.g. Ubuntu VPS).
   - Backend folder mein ja kar dependencies install aur start karein:
     ```bash
     cd backend
     npm install
     pm2 start server.js --name whatsapp-bot
     ```

4. **MongoDB Free Cluster:**
   - Messages aur leads save karne ke liye **MongoDB** free cluster banana aur uski connection API / URI string copy karna.

5. **`.env` Setup:**
   - Backend folder mein `.env` file bana lena jisme API keys aur database URI rakhna:
     ```env
     PORT=5000
     MONGODB_URI=your_mongodb_cluster_uri
     WHATSAPP_TOKEN=your_meta_cloud_api_token
     VERIFY_TOKEN=your_webhook_verify_token
     GROQ_API_KEY=your_groq_api_key
     PHONE_NUMBER_ID=your_whatsapp_phone_number_id
     ```

100% free setup ban jaiga, bahut easy setup hai!

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

