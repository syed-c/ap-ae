import { Shield, FileCheck, AlertTriangle, CheckCircle } from "lucide-react";

export function InsuranceEducation() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold mb-2">
          How Dental Insurance Works in the UAE
        </h2>
        <p className="text-muted-foreground">
          Understanding your dental coverage helps you get the most from your insurance plan.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold">DHA Mandatory Coverage</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            The Dubai Health Authority requires all residents to have health insurance. Most plans include basic dental coverage such as extractions and emergency treatments.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileCheck className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold">Direct Billing vs Reimbursement</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Many clinics offer direct billing — they bill your insurance directly so you only pay the copay. Some plans require reimbursement where you pay upfront and claim later.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold">Pre-Approval Requirements</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Major procedures like implants, crowns, and orthodontics typically require pre-approval from your insurer. Your clinic can submit the request on your behalf.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold">Enhanced Plans</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Premium insurance plans offer comprehensive dental coverage including cleanings, whitening, orthodontics, and cosmetic procedures. Check your policy schedule of benefits.
          </p>
        </div>
      </div>
    </div>
  );
}
