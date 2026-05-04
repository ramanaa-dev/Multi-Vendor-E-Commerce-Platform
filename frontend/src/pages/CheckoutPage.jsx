import { useEffect, useMemo, useState } from "react";
import { CreditCard, Link as LinkIcon, MapPin, Phone, QrCode, ShieldCheck, Wallet } from "lucide-react";
import QRCode from "qrcode";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";
import { cartAPI, ordersAPI } from "../services/api";

const paymentOptions = [
  {
    id: "debit_card",
    label: "Debit Card",
    icon: CreditCard,
    description: "Pay with your debit card in this demo checkout."
  },
  {
    id: "credit_card",
    label: "Credit Card",
    icon: CreditCard,
    description: "Use a credit card for a faster, reward-friendly checkout."
  },
  {
    id: "vavi_pay",
    label: "Vavi Pay",
    icon: Wallet,
    description: "Use your Vavi wallet or handle for instant payment."
  },
  {
    id: "qr_payment",
    label: "QR Payment",
    icon: QrCode,
    description: "A QR code is generated automatically from the order total."
  }
];

const buildShippingAddress = (form) =>
  [
    form.recipient.trim(),
    form.address_line_1.trim(),
    form.address_line_2.trim(),
    [form.city.trim(), form.state.trim()].filter(Boolean).join(", "),
    [form.postal_code.trim(), form.country.trim()].filter(Boolean).join(" ")
  ]
    .filter(Boolean)
    .join(", ");

const CheckoutPage = () => {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], total_amount: 0 });
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("qr_payment");
  const [paymentDetails, setPaymentDetails] = useState({
    card_name: "",
    card_number: "",
    expiry: "",
    cvv: "",
    vavi_id: ""
  });
  const [checkoutForm, setCheckoutForm] = useState({
    recipient: user?.name || "",
    phone: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India"
  });
  const [qrImage, setQrImage] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const navigate = useNavigate();

  const loadCart = async () => {
    try {
      setLoading(true);
      const result = await cartAPI.get();
      if (result.success) {
        setCart(result.data);
      }
    } catch {
      toast.error("Could not load checkout details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    setCheckoutForm((prev) => ({
      ...prev,
      recipient: prev.recipient || user?.name || ""
    }));
  }, [user?.name]);

  const shippingAddress = useMemo(() => buildShippingAddress(checkoutForm), [checkoutForm]);

  const previewReference = useMemo(
    () => `PREVIEW-${String(cart.items.length).padStart(2, "0")}-${Math.round(cart.total_amount * 100) || 0}`,
    [cart.items.length, cart.total_amount]
  );

  const qrPayload = useMemo(
    () =>
      `upi://pay?pa=vendosphere@upi&pn=VendoSphere&am=${Number(cart.total_amount || 0).toFixed(2)}&cu=INR&tn=Order ${previewReference}`,
    [cart.total_amount, previewReference]
  );

  useEffect(() => {
    if (paymentMethod !== "qr_payment" || cart.total_amount <= 0) {
      setQrImage("");
      setQrLoading(false);
      return;
    }

    let active = true;
    setQrLoading(true);

    QRCode.toDataURL(qrPayload, {
      width: 320,
      margin: 1,
      color: {
        dark: "#082032",
        light: "#0000"
      }
    })
      .then((image) => {
        if (active) {
          setQrImage(image);
        }
      })
      .catch(() => {
        if (active) {
          setQrImage("");
        }
      })
      .finally(() => {
        if (active) {
          setQrLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [cart.total_amount, paymentMethod, qrPayload]);

  const updateAddressField = (field, value) => {
    setCheckoutForm((prev) => ({ ...prev, [field]: value }));
  };

  const updatePaymentDetail = (field, value) => {
    setPaymentDetails((prev) => ({ ...prev, [field]: value }));
  };

  const validateCheckout = () => {
    if (!checkoutForm.recipient.trim()) return "Recipient name is required";
    if (!checkoutForm.phone.trim()) return "Phone number is required";
    if (!checkoutForm.address_line_1.trim()) return "Address line is required";
    if (!checkoutForm.city.trim()) return "City is required";
    if (!checkoutForm.state.trim()) return "State is required";
    if (!checkoutForm.postal_code.trim()) return "Postal code is required";

    if (paymentMethod === "debit_card" || paymentMethod === "credit_card") {
      if (!paymentDetails.card_name.trim()) return "Card holder name is required";
      if (paymentDetails.card_number.replace(/\s/g, "").length < 12) return "Enter a valid card number";
      if (!paymentDetails.expiry.trim()) return "Expiry date is required";
      if (paymentDetails.cvv.trim().length < 3) return "CVV must be at least 3 digits";
    }

    if (paymentMethod === "vavi_pay" && !paymentDetails.vavi_id.trim()) {
      return "Enter your Vavi Pay ID";
    }

    if (paymentMethod === "qr_payment" && !qrImage) {
      return "QR code is still being generated";
    }

    return "";
  };

  const placeOrder = async () => {
    const validationError = validateCheckout();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setPlacingOrder(true);
      const result = await ordersAPI.create({
        shipping_address: shippingAddress,
        contact_phone: checkoutForm.phone.trim(),
        payment_method: paymentMethod
      });
      if (result.success) {
        toast.success(`Order #${result.data.id} placed with ${result.data.payment_method_label}`);
        navigate("/dashboard/customer");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) return <Loader text="Preparing checkout..." />;

  if (cart.items.length === 0) {
    return (
      <div className="glass-card rounded-[32px] p-8 text-center">
        <p className="text-slate-600 dark:text-slate-300">Cart is empty. Add products before checkout.</p>
        <Link
          to="/products"
          className="mt-4 inline-flex rounded-full bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 section-fade">
      <section className="glass-card relative overflow-hidden rounded-[32px] border border-white/40 p-6 shadow-soft sm:p-8">
        <div className="absolute inset-y-0 right-0 hidden w-72 bg-gradient-to-l from-sky-400/20 via-cyan-300/10 to-transparent lg:block" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-700 dark:text-sky-300">Smart Checkout</p>
            <h1 className="brand-font mt-2 text-3xl font-bold sm:text-4xl">Address, payment, and QR flow in one place.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Add the delivery address, choose debit card, credit card, Vavi Pay, or QR payment, and the payment preview updates automatically.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <div className="rounded-full border border-emerald-200 bg-emerald-50/80 px-4 py-2 font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              <ShieldCheck className="mr-2 inline-block h-4 w-4" />
              Demo-safe payment preview
            </div>
            <div className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200">
              {cart.items.length} items
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr,0.9fr]">
        <div className="space-y-6">
          <section className="glass-card rounded-[28px] p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-100 p-3 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h2 className="brand-font text-2xl font-bold">Delivery Address</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Add the address details for this order.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">Recipient</label>
                <input
                  value={checkoutForm.recipient}
                  onChange={(event) => updateAddressField("recipient", event.target.value)}
                  placeholder="Full name"
                  className="soft-input"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Phone</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={checkoutForm.phone}
                    onChange={(event) => updateAddressField("phone", event.target.value)}
                    placeholder="Mobile number"
                    className="soft-input pl-11"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold">Address Line 1</label>
                <input
                  value={checkoutForm.address_line_1}
                  onChange={(event) => updateAddressField("address_line_1", event.target.value)}
                  placeholder="House number, street, area"
                  className="soft-input"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold">Address Line 2</label>
                <input
                  value={checkoutForm.address_line_2}
                  onChange={(event) => updateAddressField("address_line_2", event.target.value)}
                  placeholder="Apartment, landmark, or nearby point"
                  className="soft-input"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">City</label>
                <input
                  value={checkoutForm.city}
                  onChange={(event) => updateAddressField("city", event.target.value)}
                  placeholder="City"
                  className="soft-input"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">State</label>
                <input
                  value={checkoutForm.state}
                  onChange={(event) => updateAddressField("state", event.target.value)}
                  placeholder="State"
                  className="soft-input"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Postal Code</label>
                <input
                  value={checkoutForm.postal_code}
                  onChange={(event) => updateAddressField("postal_code", event.target.value)}
                  placeholder="PIN / ZIP"
                  className="soft-input"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Country</label>
                <input
                  value={checkoutForm.country}
                  onChange={(event) => updateAddressField("country", event.target.value)}
                  placeholder="Country"
                  className="soft-input"
                />
              </div>
            </div>
          </section>

          <section className="glass-card rounded-[28px] p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-fuchsia-100 p-3 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-200">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <h2 className="brand-font text-2xl font-bold">Payment Method</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Choose how you want this order to be paid.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {paymentOptions.map((option) => {
                const Icon = option.icon;
                const active = paymentMethod === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPaymentMethod(option.id)}
                    className={`payment-tile text-left ${active ? "payment-tile-active" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`rounded-2xl p-3 ${active ? "bg-sky-700 text-white" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-base font-bold">{option.label}</p>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{option.description}</p>
                        </div>
                      </div>
                      <span className={`mt-1 h-3.5 w-3.5 rounded-full border-2 ${active ? "border-sky-600 bg-sky-500" : "border-slate-300 dark:border-slate-600"}`} />
                    </div>
                  </button>
                );
              })}
            </div>

            {(paymentMethod === "debit_card" || paymentMethod === "credit_card") && (
              <div className="mt-5 grid gap-4 rounded-[24px] border border-slate-200/80 bg-white/60 p-5 dark:border-slate-700/70 dark:bg-slate-950/35 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold">Card Holder Name</label>
                  <input
                    value={paymentDetails.card_name}
                    onChange={(event) => updatePaymentDetail("card_name", event.target.value)}
                    placeholder="Name on card"
                    className="soft-input"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold">Card Number</label>
                  <input
                    value={paymentDetails.card_number}
                    onChange={(event) => updatePaymentDetail("card_number", event.target.value)}
                    placeholder="1234 5678 9012 3456"
                    className="soft-input"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold">Expiry</label>
                  <input
                    value={paymentDetails.expiry}
                    onChange={(event) => updatePaymentDetail("expiry", event.target.value)}
                    placeholder="MM/YY"
                    className="soft-input"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold">CVV</label>
                  <input
                    value={paymentDetails.cvv}
                    onChange={(event) => updatePaymentDetail("cvv", event.target.value)}
                    placeholder="123"
                    className="soft-input"
                  />
                </div>
                <p className="sm:col-span-2 text-xs text-slate-500 dark:text-slate-400">
                  This is a demo checkout. Card fields are validated in the UI but not stored on the server.
                </p>
              </div>
            )}

            {paymentMethod === "vavi_pay" && (
              <div className="mt-5 rounded-[24px] border border-slate-200/80 bg-white/60 p-5 dark:border-slate-700/70 dark:bg-slate-950/35">
                <label className="mb-2 block text-sm font-semibold">Vavi Pay ID</label>
                <div className="relative">
                  <LinkIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={paymentDetails.vavi_id}
                    onChange={(event) => updatePaymentDetail("vavi_id", event.target.value)}
                    placeholder="name@vavi"
                    className="soft-input pl-11"
                  />
                </div>
              </div>
            )}

            {paymentMethod === "qr_payment" && (
              <div className="mt-5 rounded-[24px] border border-dashed border-sky-300 bg-sky-50/80 p-5 dark:border-sky-500/30 dark:bg-sky-500/10">
                <p className="text-sm font-semibold text-sky-800 dark:text-sky-100">QR payment is enabled.</p>
                <p className="mt-1 text-sm text-sky-700/80 dark:text-sky-200/80">
                  The QR is auto-generated from your order total and preview reference.
                </p>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="glass-card rounded-[28px] p-6 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="brand-font text-2xl font-bold">Order Summary</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Review the products in this checkout.</p>
              </div>
              <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
                {paymentOptions.find((option) => option.id === paymentMethod)?.label}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-[22px] border border-slate-200/80 bg-white/70 p-3 dark:border-slate-700/70 dark:bg-slate-950/35">
                  <img
                    src={item.product.image_url || "https://placehold.co/120x120?text=Item"}
                    alt={item.product.name}
                    className="h-16 w-16 rounded-2xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{item.product.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Qty {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold">Rs. {item.line_total}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3 rounded-[24px] bg-slate-950 p-5 text-white dark:bg-slate-100 dark:text-slate-900">
              <div className="flex items-center justify-between text-sm text-white/80 dark:text-slate-700">
                <span>Subtotal</span>
                <span>Rs. {cart.total_amount}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-white/80 dark:text-slate-700">
                <span>Delivery</span>
                <span>Rs. 0</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-3 text-lg font-bold dark:border-slate-300">
                <span>Total</span>
                <span>Rs. {cart.total_amount}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={placingOrder}
              onClick={placeOrder}
              className="mt-5 w-full rounded-full bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {placingOrder ? "Placing order..." : "Place Order"}
            </button>
          </section>

          <section className="glass-card rounded-[28px] p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h2 className="brand-font text-xl font-bold">Address Preview</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">This formatted address will be saved on the order.</p>
              </div>
            </div>

            <div className="mt-4 rounded-[24px] border border-slate-200/80 bg-white/70 p-5 dark:border-slate-700/70 dark:bg-slate-950/35">
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">
                {shippingAddress || "Start filling the address to preview it here."}
              </p>
              {checkoutForm.phone && (
                <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">Phone: {checkoutForm.phone}</p>
              )}
            </div>
          </section>

          {paymentMethod === "qr_payment" && (
            <section className="glass-card rounded-[28px] p-6 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="brand-font text-xl font-bold">Auto-Generated QR</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Scan this QR to match the current order amount.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[220px,1fr]">
                <div className="flex min-h-[220px] items-center justify-center rounded-[28px] border border-dashed border-sky-300 bg-sky-50/70 p-4 dark:border-sky-500/30 dark:bg-sky-500/10">
                  {qrLoading ? (
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-sky-600 dark:border-slate-700 dark:border-t-sky-300" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">Generating QR...</p>
                    </div>
                  ) : qrImage ? (
                    <img src={qrImage} alt="Order payment QR code" className="h-full w-full rounded-[22px] object-contain" />
                  ) : (
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400">QR preview unavailable</p>
                  )}
                </div>

                <div className="space-y-3 rounded-[24px] border border-slate-200/80 bg-white/70 p-5 dark:border-slate-700/70 dark:bg-slate-950/35">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Preview Reference</span>
                    <span className="font-semibold">{previewReference}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Amount</span>
                    <span className="font-semibold">Rs. {cart.total_amount}</span>
                  </div>
                  <div className="rounded-2xl bg-slate-100/90 p-4 text-xs leading-6 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    <p className="font-semibold text-slate-900 dark:text-white">QR payload preview</p>
                    <p className="mt-2 break-all">{qrPayload}</p>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
