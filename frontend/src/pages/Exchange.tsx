import { whatsappLink } from "@/lib/types";

const BLOCKS = [
  {
    title: "7 day easy exchange",
    body: "Changed your mind about a size or style? Request an exchange within 7 days of delivery and we ship the replacement free.",
  },
  {
    title: "Returns & refunds",
    body: "Unused pieces in original packaging can be returned within 7 days. Refunds land back on the original payment method within 5–7 working days.",
  },
  {
    title: "Anti-tarnish warranty",
    body: "Every Veeraa piece carries a 6 month colour warranty. If the plating fades with normal daily wear, we replace it.",
  },
  {
    title: "How to raise a request",
    body: "Message us on WhatsApp with your order number and a photo. Our team confirms the pickup slot the same day.",
  },
];

export default function Exchange() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14" data-testid="exchange-page">
      <p className="text-xs uppercase tracking-[0.25em] text-amber-800">Peace of mind</p>
      <h1 className="mt-2 font-heading text-3xl font-light tracking-tight text-stone-900">Exchange &amp; Returns</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {BLOCKS.map((b) => (
          <div
            key={b.title}
            className="rounded-xl border border-[#E7E0D6] bg-white p-6"
            data-testid={`exchange-block-${b.title.toLowerCase().replace(/[^a-z]+/g, "-")}`}
          >
            <h2 className="font-heading text-lg text-stone-900">{b.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">{b.body}</p>
          </div>
        ))}
      </div>

      <a
        href={whatsappLink("Hi Veeraa, I'd like to raise an exchange/return request. My order number is ")}
        target="_blank"
        rel="noreferrer"
        className="mt-8 inline-flex items-center rounded-md bg-green-700 px-6 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-green-800"
        data-testid="exchange-whatsapp-button"
      >
        Start a request on WhatsApp
      </a>
    </div>
  );
}
