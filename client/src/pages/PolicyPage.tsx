import Layout from "@/components/Layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function PolicyPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-serif font-bold text-primary mb-6">Society Policies & Bylaws</h1>
        <p className="text-muted-foreground mb-8">
          To ensure fairness and transparency, all members of Swapnodinga Cooperative Society must adhere to the following policies.
        </p>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Membership Eligibility</AccordionTrigger>
            <AccordionContent>
              Membership is open to all individuals aged 18 and above who agree to the society's objectives. Approval is subject to the review of the Admin/Managing Committee.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Instalment Payments</AccordionTrigger>
            <AccordionContent>
              Monthly instalments must be paid by the 10th of every month. A late fee of 2% may be applicable for delays exceeding 30 days. Consistent default for 3 months may lead to suspension of membership.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Fixed Deposits & Interest</AccordionTrigger>
            <AccordionContent>
              Members can deposit lump sums as Fixed Deposits for a minimum tenure of 1 year. Interest rates are determined annually by the committee based on the society's investment returns. Withdrawals before maturity may incur a penalty.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>Refund Policy</AccordionTrigger>
            <AccordionContent>
              If a member wishes to leave the society, they must submit a written application. The principal amount deposited (Instalments + FD) will be refunded within 90 days. Interest accrued may be subject to deductions based on the bylaws.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5">
            <AccordionTrigger>Land Allocation</AccordionTrigger>
            <AccordionContent>
              Land plots or flats will be allocated based on a seniority list determined by total contribution amount and duration of membership.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </Layout>
  );
}
