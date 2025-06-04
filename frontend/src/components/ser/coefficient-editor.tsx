"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2 } from "lucide-react";
import { useState } from "react";

interface CoefficientEditorProps {
  coefficients: {
    kilometrage: number;
    tonnage: number;
    intercept: number;
  };
  onSave: (coefficients: {
    kilometrage: number;
    tonnage: number;
    intercept: number;
  }) => Promise<void>;
}

export function CoefficientEditor({ coefficients, onSave }: CoefficientEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [values, setValues] = useState(coefficients);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await onSave(values);
      setIsOpen(false);
    } catch (error) {
      setError("Impossible de mettre à jour les coefficients");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit2 className="h-4 w-4 mr-2" />
          Modifier les coefficients
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Modifier les coefficients de régression</DialogTitle>
            <DialogDescription>
              Ajustez les coefficients de l'équation Y = a·X₁ + b·X₂ + c
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="kilometrage">
                Coefficient kilométrage (a)
              </Label>
              <Input
                id="kilometrage"
                type="number"
                step="0.0001"
                value={values.kilometrage}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    kilometrage: parseFloat(e.target.value) || 0,
                  }))
                }
              />
              <p className="text-sm text-muted-foreground">
                Impact du kilométrage sur la consommation (L/km)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tonnage">
                Coefficient tonnage (b)
              </Label>
              <Input
                id="tonnage"
                type="number"
                step="0.0001"
                value={values.tonnage}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    tonnage: parseFloat(e.target.value) || 0,
                  }))
                }
              />
              <p className="text-sm text-muted-foreground">
                Impact du tonnage sur la consommation (L/t)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="intercept">
                Constante (c)
              </Label>
              <Input
                id="intercept"
                type="number"
                step="0.01"
                value={values.intercept}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    intercept: parseFloat(e.target.value) || 0,
                  }))
                }
              />
              <p className="text-sm text-muted-foreground">
                Consommation de base (L)
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
