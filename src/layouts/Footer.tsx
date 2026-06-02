export default function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container flex h-14 flex-col items-center justify-between gap-1 py-2 text-xs text-muted-foreground sm:flex-row">
        <span>
          Copyright © {new Date().getFullYear()}{" "}
          <span className="font-medium text-foreground">Vitalcare Training Hub Ltd</span>. Company
          No. 15718997. All rights reserved.
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-1.5 rounded-full bg-brand-gold" />
          CSTF-aligned, CPD-accredited
        </span>
      </div>
    </footer>
  )
}
