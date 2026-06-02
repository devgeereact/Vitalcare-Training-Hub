import { useState, type JSX } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Loader2, RefreshCw, AlertCircle, Smartphone } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; url: string }
  | { status: "error"; message: string }

/**
 * Shows a QR code that signs the user in on a second device (their phone).
 * The QR encodes a single-use, short-lived magic link minted server-side for
 * the current user's own account.
 */
export function QrLoginDialog({ open, onOpenChange }: Props): JSX.Element {
  const [state, setState] = useState<State>({ status: "idle" })

  async function load(): Promise<void> {
    setState({ status: "loading" })
    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/platform/dashboard`
          : undefined
      const { data, error } = await supabase.functions.invoke("qr-login", {
        body: { redirectTo },
      })
      if (error || !data?.url) throw error ?? new Error("No link returned")
      setState({ status: "ready", url: data.url as string })
    } catch {
      setState({
        status: "error",
        message: "QR sign-in is not available yet. Deploy the qr-login function to enable it.",
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (o) void load()
        else setState({ status: "idle" })
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="size-5 text-brand-navy" />
            Sign in on your phone
          </DialogTitle>
          <DialogDescription>
            Scan this code with your phone camera to open Vitalcare already signed in.
            The code is for your account and expires shortly after use.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {state.status === "loading" || state.status === "idle" ? (
            <div className="flex h-[200px] items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : state.status === "error" ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">{state.message}</p>
              <Button variant="outline" size="sm" onClick={() => void load()}>
                <RefreshCw className="mr-2 size-4" /> Try again
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <QRCodeSVG value={state.url} size={196} fgColor="#1b2e6b" />
              </div>
              <Button variant="ghost" size="sm" onClick={() => void load()}>
                <RefreshCw className="mr-2 size-4" /> New code
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
