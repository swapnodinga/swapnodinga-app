import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Scale, 
  AlertCircle, 
  Banknote, 
  Calendar, 
  UserMinus,
  CheckCircle 
} from "lucide-react";

export default function PolicyPage() {
  const policies = [
    {
      icon: Calendar,
      title: "Monthly Contributions",
      description: "Instalments must be paid between the 20th and 30th of each month. Late payments trigger a fine schedule starting on the 1st of the following month."
    },
    {
      icon: AlertCircle,
      title: "Fine Schedule",
      description: "৳500 fine applied if payment is made between the 1st and 4th. ৳1,000 fine applied from the 5th onwards. Persistent non-payment may lead to membership review."
    },
    {
      icon: Banknote,
      title: "Interest & Profit",
      description: "Profit from society investments is distributed proportionally based on each member's total contribution (Fixed Deposit + Total Instalments)."
    },
    {
      icon: UserMinus,
      title: "Withdrawal Policy",
      description: "Members wishing to exit must provide a 3-month notice. A 5% administrative fee is deducted from the total profit earned at the time of exit."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-10 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex p-3 bg-emerald-100 rounded-full text-emerald-700 mb-2">
          <Scale size={32} />
        </div>
        <h1 className="text-4xl font-serif font-bold text-emerald-900">Society Bylaws & Policies</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          These rules ensure the sustainability, transparency, and fairness of our collective financial growth.
        </p>
      </div>

      {/* Policy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {policies.map((policy, index) => (
          <Card key={index} className="border-emerald-50 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="p-2 bg-slate-100 rounded-lg text-emerald-800">
                <policy.icon size={20} />
              </div>
              <CardTitle className="text-lg">{policy.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 leading-relaxed">
                {policy.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Clauses */}
      <Card className="border-emerald-100 bg-white shadow-md">
        <CardHeader className="bg-emerald-900 text-white rounded-t-lg">
          <CardTitle className="text-xl">Terms of Membership</CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="space-y-2">
            <h4 className="font-bold text-emerald-900 flex items-center gap-2">
              <CheckCircle size={16} /> 1. Eligibility
            </h4>
            <p className="text-sm text-slate-600 pl-6">
              Membership is open to individuals who are referred by at least two existing members and approved by the Society Board.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-emerald-900 flex items-center gap-2">
              <CheckCircle size={16} /> 2. Transparency Commitment
            </h4>
            <p className="text-sm text-slate-600 pl-6">
              The Society shall maintain a real-time digital ledger accessible to all members. Annual audits will be conducted every January.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-emerald-900 flex items-center gap-2">
              <CheckCircle size={16} /> 3. Dispute Resolution
            </h4>
            <p className="text-sm text-slate-600 pl-6">
              Any disagreements regarding interest calculation or fund management will be resolved through a majority vote of the active membership.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Note */}
      <div className="p-6 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-4">
        <AlertCircle className="text-amber-600 shrink-0 mt-1" />
        <div>
          <h5 className="font-bold text-amber-900">Compliance Notice</h5>
          <p className="text-sm text-amber-800 leading-relaxed">
            By contributing to the society fund, you agree to abide by these policies. Policies may be amended with a 2/3rd majority vote of the general body.
          </p>
        </div>
      </div>
    </div>
  );
}
