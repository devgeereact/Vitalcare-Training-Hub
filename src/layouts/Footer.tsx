export default function Footer() {
  return (
    <footer className="border-t">
      <div className="container flex h-14 flex-col items-center justify-between gap-1 text-sm text-muted-foreground sm:flex-row">
        <span>
          © {new Date().getFullYear()}{" "}
          <span className="font-medium text-foreground">
            Vitalcare Training Hub Ltd
          </span>
          . Company No. 15718997. All rights reserved.
        </span>
        <span>CSTF-aligned, CPD-accredited, verifiable at vitalcare.uk/verify</span>
      </div>
    </footer>
  )
}
