# Murugappa Smart Inventory System

A modern, scalable QR-based inventory and spare management solution built with React and Supabase.

## 🚀 Getting Started

1.  **Clone/Download** the repository.
2.  **Initialize Supabase**:
    *   Create a new project on [Supabase.com](https://supabase.com).
    *   Navigate to the **SQL Editor**.
    *   Copy and run the contents of [supabase_schema.sql](./supabase_schema.sql).
3.  **Authentication Config**:
    *   Go to **Authentication** -> **Providers**.
    *   Enable **Google OAuth** (you will need Google Cloud credentials).
    *   Enable **Email/Password**.
4.  **Local Environment Setup**:
    *   Create a `.env` file based on [.env.example](./.env.example).
    *   Fill in your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5.  **Installation**:
    ```bash
    npm install
    ```
6.  **Development**:
    ```bash
    npm run dev
    ```

## 🛠 Features

*   **Secure Auth**: Google & Email/Password login.
*   **Module Logic**: Switch between "Inventory" and "Spare" management.
*   **Automatic ID & QR**: Unique pre-formatted IDs (IM0001, SM0001) with auto-generated labels.
*   **Live Scanner**: Real-time camera-based QR scanning with item lookup.
*   **Premium Audit Logs**: Full history tracking with CSV export.
*   **Role-Based Access**: Specialized permissions for Admin, Staff, and Viewer.

## 🎨 Design System

*   **Inventory Module**: 🟦 Blue-themed premium layout.
*   **Spare Module**: 🟧 Orange-themed premium layout.
*   **Aesthetics**: Glassmorphism cards, Outfit typography, and Outfit icons.

---
Built by Antigravity
