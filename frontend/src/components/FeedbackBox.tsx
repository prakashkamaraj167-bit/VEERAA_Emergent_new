import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Feedback } from "@/lib/types";

export default function FeedbackBox() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");

  const mutation = useMutation({
    mutationFn: () => apiPost<Feedback>("/feedback", { name, email, rating, message }),
    onSuccess: () => {
      toast.success("Thank you — your feedback reached the Veeraa team.");
      setName("");
      setEmail("");
      setMessage("");
      setRating(5);
    },
    onError: () => toast.error("Could not send feedback. Please try again."),
  });

  return (
    <section className="border-t border-[#E7E0D6] bg-white/70" data-testid="feedback-section">
      <div className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-xs uppercase tracking-[0.25em] text-amber-800">We are listening</p>
        <h2 className="mt-2 font-heading text-2xl sm:text-3xl tracking-tight text-stone-900">Leave your feedback</h2>
        <p className="mt-2 text-sm text-stone-600">
          Every note goes straight to the Veeraa admin inbox.
        </p>

        <form
          className="mt-7 grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          data-testid="feedback-form"
        >
          <div className="grid gap-2">
            <Label htmlFor="fb-name">Your name</Label>
            <Input
              id="fb-name"
              value={name}
              required
              onChange={(e) => setName(e.target.value)}
              data-testid="feedback-name-input"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="fb-email">Email (optional)</Label>
            <Input
              id="fb-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="feedback-email-input"
            />
          </div>
          <div className="sm:col-span-2 grid gap-2">
            <Label>Rating</Label>
            <div className="flex gap-1" data-testid="feedback-rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="p-1 transition-transform duration-200 hover:scale-110"
                  data-testid={`feedback-star-${n}`}
                  aria-label={`${n} star`}
                >
                  <Star
                    className={
                      n <= rating ? "size-5 fill-amber-500 text-amber-500" : "size-5 text-stone-300"
                    }
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2 grid gap-2">
            <Label htmlFor="fb-message">Your feedback</Label>
            <Textarea
              id="fb-message"
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              data-testid="feedback-message-input"
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={mutation.isPending} data-testid="feedback-submit-button">
              {mutation.isPending ? "Sending…" : "Send feedback"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
