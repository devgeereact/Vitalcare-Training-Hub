import { useState } from "react"
import { toast } from "sonner"
import { ShoppingBag, AlertCircle, Plus, Loader2, Trash2, Landmark } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUser } from "@/hooks/use-user"
import { useAuth } from "@/hooks/use-auth"
import StoreDashboard from "@/components/store/StoreDashboard"
import {
  useProducts,
  useProductMutations,
  useCreateOrder,
  applyCoupon,
  gbp,
  type PlacedOrder,
} from "@/lib/queries/store.queries"
import { useCourses } from "@/lib/queries/courses.queries"
import { COMPANY, PAYMENT } from "@/lib/constants"
import { driveImageUrl } from "@/lib/drive-image"
import type { Product } from "@/types/database.types"

export default function StoreCataloguePage() {
  const { profile, isAdmin } = useUser()
  const { user } = useAuth()
  const { data, isLoading, isError, refetch } = useProducts()
  const prodMut = useProductMutations()
  const createOrder = useCreateOrder()
  const courses = useCourses()

  // Add product form (admin)
  const [addOpen, setAddOpen] = useState(false)
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [price, setPrice] = useState("")
  const [courseId, setCourseId] = useState("none")

  // Buy flow
  const [buy, setBuy] = useState<Product | null>(null)
  const [method, setMethod] = useState<"bank_transfer" | "paypal">("bank_transfer")
  const [coupon, setCoupon] = useState("")
  const [discount, setDiscount] = useState(0)
  // What the server actually charged, not what the browser quoted.
  const [placed, setPlaced] = useState<PlacedOrder | null>(null)

  function addProduct() {
    if (!name.trim() || !profile?.id) return
    prodMut.create
      .mutateAsync({
        name,
        description: desc,
        pricePence: Math.round(parseFloat(price || "0") * 100),
        courseId: courseId === "none" ? null : courseId,
        createdBy: profile.id,
      })
      .then(() => {
        toast.success("Product added")
        setName("")
        setDesc("")
        setPrice("")
        setCourseId("none")
        setAddOpen(false)
      })
      .catch(() => toast.error("Could not add"))
  }

  async function checkCoupon() {
    if (!buy || !coupon.trim()) return
    const r = await applyCoupon(coupon, buy.price_pence)
    if (r) {
      setDiscount(r.discountPence)
      toast.success(`Coupon applied: −${gbp(r.discountPence)}`)
    } else {
      setDiscount(0)
      toast.error("Invalid or expired coupon")
    }
  }

  function placeOrder() {
    if (!buy) return
    createOrder
      .mutateAsync({ product: buy, paymentMethod: method, couponCode: coupon || undefined })
      .then((order) => {
        setPlaced(order)
        // The server prices the order. If the coupon lapsed between the quote
        // and the write, say so rather than showing a total nobody will be
        // charged.
        if (coupon.trim() && !order.couponCode) {
          toast.warning("The coupon could not be applied", {
            description: "Your order was placed at the full price.",
          })
        } else {
          toast.success("Order placed")
        }
      })
      .catch((err: unknown) => {
        console.error("[StoreCataloguePage:placeOrder]", err)
        toast.error("Could not place order", {
          description: "Nothing was charged. Please try again.",
        })
      })
  }

  function resetBuy() {
    setBuy(null)
    setCoupon("")
    setDiscount(0)
    setPlaced(null)
    setMethod("bank_transfer")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Store</h1>
          <p className="mt-1 text-muted-foreground">
            {isAdmin
              ? "Sales, orders and your course catalogue at a glance."
              : "Browse courses and bundles, and track your orders."}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" /> New product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New product</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                <Textarea placeholder="Description" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1.5 block text-xs">Price (£)</Label>
                    <Input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs">Linked course</Label>
                    <Select value={courseId} onValueChange={setCourseId}>
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {(courses.data ?? []).map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button onClick={addProduct} disabled={!name.trim() || prodMut.create.isPending}>
                  {prodMut.create.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Add
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Store metrics are staff only. Learners see just the catalogue. */}
      {isAdmin && <StoreDashboard staff buyerId={user?.id} />}

      {/* Catalogue list */}
      <div className="space-y-4">
        <div>
          <h2 className="font-display text-2xl text-foreground">Catalogue</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Courses and bundles. Pay by bank transfer or PayPal.
          </p>
        </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">Could not load the store.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      ) : (data?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <ShoppingBag className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              No products yet.{isAdmin ? " Add your first one above." : ""}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data!.map((p) => (
            <Card key={p.id} className="flex flex-col overflow-hidden">
              {p.thumbnail_url && (
                <img src={driveImageUrl(p.thumbnail_url, 600)} alt={p.name} className="aspect-video w-full object-cover" />
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-base leading-snug">{p.name}</CardTitle>
                <p className="font-display text-xl text-foreground">
                  {p.price_pence === 0 ? "Free" : gbp(p.price_pence)}
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                {p.description && (
                  <p className="line-clamp-3 text-sm text-muted-foreground">{p.description}</p>
                )}
                <div className="mt-auto flex gap-2">
                  <Button className="flex-1" size="sm" onClick={() => setBuy(p)}>
                    Buy
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        prodMut.remove
                          .mutateAsync(p.id)
                          .then(() => toast.success("Removed"))
                          .catch(() => toast.error("Could not remove"))
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>

      {/* Buy dialog */}
      <Dialog open={!!buy} onOpenChange={(o) => !o && resetBuy()}>
        <DialogContent>
          {placed ? (
            <>
              <DialogHeader>
                <DialogTitle>Order placed</DialogTitle>
                <DialogDescription>
                  Nothing has been taken yet. Your place is held once we confirm
                  the payment.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="rounded-lg border border-brand-gold/40 bg-brand-gold/10 p-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Your payment reference
                  </p>
                  <p className="mt-0.5 font-mono text-lg font-semibold text-brand-navy">
                    {placed.reference}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Quote this on the payment. It is how we match it to your
                    order.
                  </p>
                </div>

                <p>
                  Amount to pay:{" "}
                  <span className="font-medium">{gbp(placed.totalPence)}</span>
                  {placed.discountPence > 0 ? (
                    <span className="text-muted-foreground">
                      {" "}
                      (coupon {placed.couponCode} took off{" "}
                      {gbp(placed.discountPence)})
                    </span>
                  ) : null}
                </p>

                <div className="rounded-lg border border-border p-3">
                  <p className="flex items-center gap-1.5 text-xs font-medium">
                    <Landmark className="size-3.5" />
                    {method === "paypal" ? "PayPal" : "Bank transfer"}
                  </p>
                  {method === "paypal" ? (
                    PAYMENT.paypalAddress ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Send to{" "}
                        <span className="font-medium text-foreground">
                          {PAYMENT.paypalAddress}
                        </span>
                        , quoting {placed.reference}.
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">
                        We will email the PayPal details to you, quoting this
                        reference.
                      </p>
                    )
                  ) : PAYMENT.bankSortCode && PAYMENT.bankAccountNumber ? (
                    <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                      <p>
                        Account name:{" "}
                        <span className="font-medium text-foreground">
                          {PAYMENT.bankAccountName || COMPANY.legalName}
                        </span>
                      </p>
                      <p>
                        Sort code:{" "}
                        <span className="font-mono text-foreground">
                          {PAYMENT.bankSortCode}
                        </span>
                      </p>
                      <p>
                        Account number:{" "}
                        <span className="font-mono text-foreground">
                          {PAYMENT.bankAccountNumber}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      We will email the bank details to you, quoting this
                      reference.
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {COMPANY.legalName} · Company {COMPANY.companyNumber}
                  </p>
                </div>

                <p className="text-xs text-muted-foreground">
                  We check payments and confirm within{" "}
                  {PAYMENT.confirmationWindow}. Track the status under Store →
                  Orders, or email {PAYMENT.supportEmail} quoting{" "}
                  {placed.reference}.
                </p>
              </div>
              <DialogFooter>
                <Button onClick={resetBuy}>Done</Button>
              </DialogFooter>
            </>
          ) : buy ? (
            <>
              <DialogHeader>
                <DialogTitle>Buy {buy.name}</DialogTitle>
                <DialogDescription>
                  {gbp(buy.price_pence)}
                  {discount > 0 && (
                    <>
                      {" "}
                      − {gbp(discount)} ={" "}
                      <span className="font-medium text-foreground">
                        {gbp(buy.price_pence - discount)}
                      </span>
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="mb-1.5 block text-xs">Payment method</Label>
                  <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Coupon code"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                  />
                  <Button variant="outline" onClick={checkCoupon} disabled={!coupon.trim()}>
                    Apply
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={resetBuy}>Cancel</Button>
                <Button onClick={placeOrder} disabled={createOrder.isPending}>
                  {createOrder.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Place order
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
