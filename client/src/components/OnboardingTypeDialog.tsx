import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';

interface OnboardingTypeDialogProps {
  isOpen: boolean;
  memberName: string;
  isLoading: boolean;
  onSelect: (type: 'fresh_start' | 'full_replacement') => void;
  onCancel: () => void;
}

export function OnboardingTypeDialog({
  isOpen,
  memberName,
  isLoading,
  onSelect,
  onCancel
}: OnboardingTypeDialogProps) {
  const [selectedType, setSelectedType] = useState<'fresh_start' | 'full_replacement'>('fresh_start');

  const handleSelect = () => {
    onSelect(selectedType);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Onboarding Type</DialogTitle>
          <DialogDescription>
            Select how {memberName} will join the society
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={selectedType} onValueChange={(val) => setSelectedType(val as 'fresh_start' | 'full_replacement')}>
          <div className="space-y-3">
            {/* Fresh Start Option */}
            <Card className="p-4 border-2 cursor-pointer hover:border-emerald-400 transition-colors"
              onClick={() => setSelectedType('fresh_start')}>
              <div className="flex items-start gap-3">
                <RadioGroupItem value="fresh_start" id="fresh_start" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="fresh_start" className="text-base font-semibold cursor-pointer">
                    Fresh Start
                  </Label>
                  <p className="text-sm text-slate-600 mt-1">
                    New member starts from <strong>current month</strong>. Eligible for dividends from <strong>this month</strong> onward based on contributions.
                  </p>
                  <div className="mt-2 text-xs text-slate-500 bg-blue-50 p-2 rounded">
                    ✓ Lower entry commitment<br/>
                    ✓ Contributes fresh going forward<br/>
                    ✓ Dividends calculated from approval date
                  </div>
                </div>
              </div>
            </Card>

            {/* Full Replacement Option */}
            <Card className="p-4 border-2 cursor-pointer hover:border-emerald-400 transition-colors"
              onClick={() => setSelectedType('full_replacement')}>
              <div className="flex items-start gap-3">
                <RadioGroupItem value="full_replacement" id="full_replacement" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="full_replacement" className="text-base font-semibold cursor-pointer">
                    Full Replacement (Pay All Outstanding)
                  </Label>
                  <p className="text-sm text-slate-600 mt-1">
                    New member <strong>takes over all records</strong> from a previous member (who is being deactivated). All past transactions are transferred.
                  </p>
                  <div className="mt-2 text-xs text-slate-500 bg-amber-50 p-2 rounded">
                    ✓ Higher entry commitment<br/>
                    ✓ Inherits all transaction history<br/>
                    ✓ Eligible for all past dividends<br/>
                    ⚠ Requires settlement & payment approval
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </RadioGroup>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSelect}
            disabled={isLoading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Approving...
              </>
            ) : (
              'Approve Member'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
