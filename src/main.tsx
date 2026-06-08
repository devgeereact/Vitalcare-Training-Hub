import React from "react"
import ReactDOM from "react-dom/client"
import { RouterProvider } from "react-router-dom"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import UIThemeProvider from "@/providers/ui-theme-provider"
import { AuthProvider } from "@/contexts/AuthContext"

import { router } from "@/routes"
import { registerServiceWorker } from "@/lib/push"
import { loadPublicConfig } from "@/lib/turnstile"
import "@/index.css"

// Load public runtime config (Turnstile site key) early so pre-auth forms can
// render the CAPTCHA. Fire-and-forget; the widget re-checks once it resolves.
void loadPublicConfig()

// Register the service worker so the app is installable and can receive push.
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    void registerServiceWorker()
  })
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <UIThemeProvider>
            <RouterProvider router={router} />
          </UIThemeProvider>
        </ThemeProvider>
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
