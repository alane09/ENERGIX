import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

export interface FormulaConfig {
  tepFactor: number;  // TEP conversion factor (L to TEP)
  costFactor: number; // Cost per liter (DT)
  ipeFormula: string; // Formula for IPE calculation
  ipeTonneFormula: string; // Formula for IPE per tonne calculation
}

export const defaultFormulaConfig: FormulaConfig = {
  tepFactor: 0.00098,
  costFactor: 2.5,
  ipeFormula: "(consommationL * 100) / kilometrage",
  ipeTonneFormula: "(consommationL * 100) / (kilometrage * produitsTonnes)"
};

interface FormulaConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  formulaConfig: FormulaConfig;
  onSave: (config: FormulaConfig) => void;
  editingType: keyof FormulaConfig;
}

export function FormulaConfigModal({ 
  isOpen, 
  onClose, 
  formulaConfig, 
  onSave,
  editingType 
}: FormulaConfigModalProps) {
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      // Test the formula with sample values
      const testValues = {
        consommationL: 100,
        kilometrage: 1000,
        produitsTonnes: 10
      };
      
      if (editingType === 'ipeFormula') {
        const formula = new Function('consommationL', 'kilometrage', `return ${formulaConfig.ipeFormula}`);
        formula(testValues.consommationL, testValues.kilometrage);
      } else if (editingType === 'ipeTonneFormula') {
        const formula = new Function('consommationL', 'kilometrage', 'produitsTonnes', `return ${formulaConfig.ipeTonneFormula}`);
        formula(testValues.consommationL, testValues.kilometrage, testValues.produitsTonnes);
      }

      onSave(formulaConfig);
      onClose();
      toast({
        title: "Success",
        description: "Formula updated successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Invalid formula. Please check the syntax.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">Edit Formula</h3>
          
          <div className="space-y-4">
            {editingType === 'tepFactor' && (
              <div>
                <Label htmlFor="tep-factor">TEP Conversion Factor</Label>
                <Input 
                  id="tep-factor" 
                  type="number"
                  step="0.00001"
                  value={formulaConfig.tepFactor}
                  onChange={(e) => onSave({
                    ...formulaConfig,
                    tepFactor: parseFloat(e.target.value)
                  })}
                />
                <p className="text-sm text-gray-500 mt-1">1 Liter = X TEP</p>
              </div>
            )}

            {editingType === 'costFactor' && (
              <div>
                <Label htmlFor="cost-factor">Cost per Liter (DT)</Label>
                <Input 
                  id="cost-factor" 
                  type="number"
                  step="0.01"
                  value={formulaConfig.costFactor}
                  onChange={(e) => onSave({
                    ...formulaConfig,
                    costFactor: parseFloat(e.target.value)
                  })}
                />
                <p className="text-sm text-gray-500 mt-1">1 Liter = X DT</p>
              </div>
            )}

            {editingType === 'ipeFormula' && (
              <div>
                <Label htmlFor="ipe-formula">IPE Formula</Label>
                <Input 
                  id="ipe-formula" 
                  value={formulaConfig.ipeFormula}
                  onChange={(e) => onSave({
                    ...formulaConfig,
                    ipeFormula: e.target.value
                  })}
                />
                <p className="text-sm text-gray-500 mt-1">Available variables: consommationL, kilometrage</p>
              </div>
            )}

            {editingType === 'ipeTonneFormula' && (
              <div>
                <Label htmlFor="ipe-tonne-formula">IPE per Tonne Formula</Label>
                <Input 
                  id="ipe-tonne-formula" 
                  value={formulaConfig.ipeTonneFormula}
                  onChange={(e) => onSave({
                    ...formulaConfig,
                    ipeTonneFormula: e.target.value
                  })}
                />
                <p className="text-sm text-gray-500 mt-1">Available variables: consommationL, kilometrage, produitsTonnes</p>
              </div>
            )}
            
            <div className="pt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 