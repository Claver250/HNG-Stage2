Based on your engine's logic—specifically the integration of the **NLP Query Parser**, the **Enrichment Pipeline**, and the **PKCE CLI Flow**—here is a professional, high-standard README for your HNG submission.

---

# 🛡️ SafeGuardian: Intelligence Query & Auth Engine

An advanced backend system combining **OAuth 2.0 with PKCE**, **JWT-based session management**, and an **NLP-driven Data Enrichment Pipeline**. Built with **Node.js**, **Express**, and **PostgreSQL (Sequelize)**.

---

## 🏗️ System Architecture

The system follows a modular, layered architecture designed for performance and security:

* **API Layer (v1):** Express-based REST API enforcing strict versioning via custom middleware.
* **Intelligence Layer:** A custom Natural Language Processing (NLP) engine that parses conversational queries into structured SQL logic.
* **Enrichment Pipeline:** A concurrent fetching mechanism that hydrates user profiles with demographic data from multiple external sources (Agify, Genderize, Nationalize).
* **Persistence Layer:** PostgreSQL using **UUID v7** for primary keys, providing time-sortable, globally unique identifiers.

---

## 🔐 Authentication Flow

### Web & CLI PKCE Support
To secure terminal-based logins without exposing a `Client Secret`, the system implements **Proof Key for Code Exchange (PKCE)**:

1.  **CLI Initialization:** Generates a `code_verifier` and `code_challenge`.
2.  **Handshake:** The CLI opens the browser to the backend; the challenge is stored in the OAuth `state`.
3.  **Callback & Exchange:** Upon GitHub approval, the backend exchanges the code and redirects the browser to `http://localhost:8080` (the CLI's local listener).
4.  **Token Delivery:** The terminal "catches" the JWTs from the redirect URL and completes the login.



---

## 💻 CLI Usage

The system includes a standalone CLI client for developer authentication.

1.  **Start the Backend:** `npm start` (Runs on port 4000).
2.  **Launch CLI:**
    ```bash
    node cli-login.js
    ```
3.  **Result:** Your browser will open for GitHub login. Once authorized, your terminal will display your **Access** and **Refresh** tokens.

---

## 🧠 Natural Language Parsing (NLP)

The `/api/profiles/search` endpoint uses a pattern-matching parser to interpret human language.

**Supported Query Examples:**
* `"young men from Nigeria"` → Filters: `gender: male`, `age: 16-24`, `country: NG`.
* `"adults above 30 from Germany"` → Filters: `age_group: adult`, `age: >30`, `country: DE`.
* `"teenagers younger than 18"` → Filters: `age: 13-17`.

**The Logic:**
1.  **Normalization:** Converts input to lowercase and strips noise.
2.  **Entity Extraction:** Uses Regex and `i18n-iso-countries` to identify demographics and locations.
3.  **Sequelize Mapping:** Converts entities into `Sequelize.Op` operators (e.g., `Op.between`, `Op.gt`).

---

## 🎫 Token Handling & Security

| Feature | Implementation |
| :--- | :--- |
| **Primary Key** | UUID v7 (Time-ordered) |
| **Access Token** | JWT (3-minute expiry) |
| **Refresh Token** | Persistent (5-minute expiry, stored in DB) |
| **Versioning** | Required `X-API-Version: 1` header |
| **RBAC** | Role-based enforcement (Analyst by default) |

---

## 🛠️ Enrichment Pipeline Logic

When a new profile is created via `POST /api/profiles`, the system executes a **Concurrent Enrichment Pipeline**:

```javascript
// Data is fetched in parallel to minimize latency
const [genderRes, ageRes, nationRes] = await Promise.allSettled([
    axios.get(genderizeUrl),
    axios.get(agifyUrl),
    axios.get(nationalizeUrl)
]);
```
* **Idempotency:** Checks the database for existing names before triggering external API calls.
* **Probability Scoring:** Only the highest-probability country and gender data are persisted.
* **Age Grouping:** Dynamically assigns categories (Child, Teenager, Adult, Senior) based on inferred age.

---

## 🚀 Installation & Setup

1.  **Clone the repo** and run `npm install`.
2.  **Environment Variables:** Create a `.env` file with:
    * `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
    * `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`
3.  **Database:** Ensure PostgreSQL is running. The system uses `sequelize.sync({ alter: true })` for automated schema management.

---

