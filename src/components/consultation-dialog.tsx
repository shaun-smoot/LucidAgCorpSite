"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";

import {
  consultationSchema,
  interestAreas,
  type ConsultationInput,
} from "@/lib/api/consultation.schema";
import { submitConsultation } from "@/lib/api/consultation.functions";

const fieldClass =
  "w-full bg-transparent border border-ink/15 px-3 py-2.5 text-sm text-ink placeholder:text-ink/35 outline-none transition-colors focus:border-ink/60 focus:bg-cream";
const labelClass = "eyebrow block mb-2";
const errorClass = "mt-1 text-xs text-destructive";

export function ConsultationDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ConsultationInput>({
    resolver: zodResolver(consultationSchema),
  });

  // Reset to a clean form whenever the dialog is fully closed.
  React.useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setSubmitted(false);
        setSubmitError(null);
        reset();
      }, 250);
      return () => clearTimeout(t);
    }
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await submitConsultation({ data: values });
      setSubmitted(true);
    } catch {
      setSubmitError("Something went wrong sending your request. Please email office@lucidag.com.");
    }
  });

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto max-h-[calc(100vh-2rem)] bg-cream text-ink border border-ink/15 shadow-2xl px-6 py-8 md:px-10 md:py-10 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <Dialog.Close
            aria-label="Close"
            className="absolute right-5 top-5 text-ink/50 transition-colors hover:text-ink focus:outline-none"
          >
            <X className="size-5" />
          </Dialog.Close>

          {submitted ? (
            <div className="py-6 text-center">
              <div className="eyebrow mb-4">§ Inquiry received</div>
              <Dialog.Title className="font-display text-3xl md:text-4xl leading-tight">
                Thank you<span className="text-steel">.</span>
              </Dialog.Title>
              <Dialog.Description className="mt-4 text-sm text-ink/65 leading-relaxed max-w-sm mx-auto">
                Your request has reached us. A member of the team will be in touch shortly to arrange
                a confidential conversation.
              </Dialog.Description>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-8 inline-flex items-center gap-3 border border-ink/30 px-6 py-3 text-sm font-medium transition-colors hover:bg-ink hover:text-cream"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="eyebrow mb-3">§ Request a consultation</div>
              <Dialog.Title className="font-display text-3xl md:text-4xl leading-[1.05] -tracking-[0.01em]">
                Start the <span className="italic text-steel">conversation.</span>
              </Dialog.Title>
              <Dialog.Description className="mt-3 text-sm text-ink/65 leading-relaxed">
                Tell us a little about you and your organization. Fields marked
                <span className="text-ink"> *</span> are required.
              </Dialog.Description>

              <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="c-name" className={labelClass}>
                      Full name <span className="text-ink">*</span>
                    </label>
                    <input id="c-name" autoComplete="name" className={fieldClass} {...register("name")} />
                    {errors.name && <p className={errorClass}>{errors.name.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="c-email" className={labelClass}>
                      Work email <span className="text-ink">*</span>
                    </label>
                    <input
                      id="c-email"
                      type="email"
                      autoComplete="email"
                      className={fieldClass}
                      {...register("email")}
                    />
                    {errors.email && <p className={errorClass}>{errors.email.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="c-company" className={labelClass}>
                      Company <span className="text-ink">*</span>
                    </label>
                    <input
                      id="c-company"
                      autoComplete="organization"
                      className={fieldClass}
                      {...register("company")}
                    />
                    {errors.company && <p className={errorClass}>{errors.company.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="c-role" className={labelClass}>
                      Role / title
                    </label>
                    <input
                      id="c-role"
                      autoComplete="organization-title"
                      className={fieldClass}
                      {...register("role")}
                    />
                  </div>
                  <div>
                    <label htmlFor="c-phone" className={labelClass}>
                      Phone
                    </label>
                    <input
                      id="c-phone"
                      type="tel"
                      autoComplete="tel"
                      className={fieldClass}
                      {...register("phone")}
                    />
                  </div>
                  <div>
                    <label htmlFor="c-interest" className={labelClass}>
                      Area of interest
                    </label>
                    <select id="c-interest" className={fieldClass} defaultValue="" {...register("interest")}>
                      <option value="" disabled>
                        Select…
                      </option>
                      {interestAreas.map((area) => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="c-message" className={labelClass}>
                    How can we help?
                  </label>
                  <textarea
                    id="c-message"
                    rows={4}
                    className={`${fieldClass} resize-none`}
                    placeholder="A few lines on what you're looking to achieve."
                    {...register("message")}
                  />
                </div>

                {submitError && <p className="text-sm text-destructive">{submitError}</p>}

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-3 bg-ink text-cream px-6 py-3.5 text-sm font-medium transition-colors hover:bg-ink-soft disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Sending…" : "Send request"}
                    {!isSubmitting && <span aria-hidden>→</span>}
                  </button>
                  <p className="text-xs text-ink/45 leading-relaxed max-w-[28ch]">
                    Confidential. We reply by email, typically within two business days.
                  </p>
                </div>
              </form>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
