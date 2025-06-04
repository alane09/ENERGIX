import { RegressionResult } from '@/app/situation-energ-ref/types';
import { saveAs } from 'file-saver';
import { formatNumber } from './utils';

interface CellStyle {
  font?: {
    bold?: boolean;
  };
  alignment?: {
    horizontal?: 'left' | 'center' | 'right';
  };
  border?: {
    top?: { style: string };
    bottom?: { style: string };
    left?: { style: string };
    right?: { style: string };
  };
  fill?: {
    type: string;
    pattern?: string;
    fgColor?: { rgb: string };
  };
}

interface Cell {
  v: string | number;
  t?: string;
  s?: CellStyle;
}

interface WorksheetData {
  [key: string]: Cell;
}

export async function generateRegressionReport(result: RegressionResult): Promise<void> {
  try {
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();

    // Create worksheet data
    const wsData: WorksheetData = {};

    // Header style
    const headerStyle: CellStyle = {
      font: { bold: true },
      alignment: { horizontal: 'center' },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { rgb: 'E0E0E0' }
      }
    };

    // Border style
    const borderStyle: CellStyle = {
      border: {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      }
    };

    // Regression Statistics
    wsData['A1'] = { v: 'Statistiques de la régression', s: headerStyle };
    wsData['A2'] = { v: 'Multiple R', s: borderStyle };
    wsData['B2'] = { v: result.multipleR, s: borderStyle };
    wsData['A3'] = { v: 'R²', s: borderStyle };
    wsData['B3'] = { v: result.rSquared, s: borderStyle };
    wsData['A4'] = { v: 'R² ajusté', s: borderStyle };
    wsData['B4'] = { v: result.adjustedRSquared, s: borderStyle };
    wsData['A5'] = { v: 'Erreur-type', s: borderStyle };
    wsData['B5'] = { v: result.standardError, s: borderStyle };
    wsData['A6'] = { v: 'Observations', s: borderStyle };
    wsData['B6'] = { v: result.observations, s: borderStyle };

    // ANOVA
    wsData['A8'] = { v: 'Analyse de la variance', s: headerStyle };
    wsData['A9'] = { v: '', s: borderStyle };
    wsData['B9'] = { v: 'ddl', s: borderStyle };
    wsData['C9'] = { v: 'Somme des carrés', s: borderStyle };
    wsData['D9'] = { v: 'Moyenne des carrés', s: borderStyle };
    wsData['E9'] = { v: 'F', s: borderStyle };
    wsData['F9'] = { v: 'Valeur-P', s: borderStyle };

    wsData['A10'] = { v: 'Régression', s: borderStyle };
    wsData['B10'] = { v: result.degreesOfFreedom, s: borderStyle };
    wsData['C10'] = { v: result.sumOfSquares, s: borderStyle };
    wsData['D10'] = { v: result.meanSquare, s: borderStyle };
    wsData['E10'] = { v: result.fStatistic, s: borderStyle };
    wsData['F10'] = { v: result.significanceF, s: borderStyle };

    // Coefficients
    wsData['A12'] = { v: 'Coefficients', s: headerStyle };
    wsData['A13'] = { v: '', s: borderStyle };
    wsData['B13'] = { v: 'Coefficients', s: borderStyle };
    wsData['C13'] = { v: 'Erreur-type', s: borderStyle };
    wsData['D13'] = { v: 'Statistique t', s: borderStyle };
    wsData['E13'] = { v: 'Probabilité', s: borderStyle };
    wsData['F13'] = { v: 'Limite inférieure 95%', s: borderStyle };
    wsData['G13'] = { v: 'Limite supérieure 95%', s: borderStyle };

    // Intercept row
    wsData['A14'] = { v: 'Constante', s: borderStyle };
    wsData['B14'] = { v: result.intercept, s: borderStyle };
    wsData['C14'] = { v: result.standardErrors[0], s: borderStyle };
    wsData['D14'] = { v: result.tStats[0], s: borderStyle };
    wsData['E14'] = { v: result.pValues[0], s: borderStyle };
    wsData['F14'] = { v: result.lowerConfidence[0], s: borderStyle };
    wsData['G14'] = { v: result.upperConfidence[0], s: borderStyle };

    // Kilometrage row
    wsData['A15'] = { v: 'Kilométrage', s: borderStyle };
    wsData['B15'] = { v: result.coefficients.kilometrage, s: borderStyle };
    wsData['C15'] = { v: result.standardErrors[1], s: borderStyle };
    wsData['D15'] = { v: result.tStats[1], s: borderStyle };
    wsData['E15'] = { v: result.pValues[1], s: borderStyle };
    wsData['F15'] = { v: result.lowerConfidence[1], s: borderStyle };
    wsData['G15'] = { v: result.upperConfidence[1], s: borderStyle };

    // Tonnage row (if applicable)
    if (result.coefficients.tonnage !== null) {
      wsData['A16'] = { v: 'Tonnage', s: borderStyle };
      wsData['B16'] = { v: result.coefficients.tonnage, s: borderStyle };
      wsData['C16'] = { v: result.standardErrors[2], s: borderStyle };
      wsData['D16'] = { v: result.tStats[2], s: borderStyle };
      wsData['E16'] = { v: result.pValues[2], s: borderStyle };
      wsData['F16'] = { v: result.lowerConfidence[2], s: borderStyle };
      wsData['G16'] = { v: result.upperConfidence[2], s: borderStyle };
    }

    // Residual Output
    wsData['A18'] = { v: 'Valeurs prédites et résidus', s: headerStyle };
    wsData['A19'] = { v: 'Observation', s: borderStyle };
    wsData['B19'] = { v: 'Valeur prédite', s: borderStyle };
    wsData['C19'] = { v: 'Résidus', s: borderStyle };

    result.predictedValues.forEach((value, index) => {
      wsData[`A${20 + index}`] = { v: index + 1, s: borderStyle };
      wsData[`B${20 + index}`] = { v: formatNumber(value, 2), s: borderStyle };
      wsData[`C${20 + index}`] = { v: formatNumber(result.residuals[index], 2), s: borderStyle };
    });

    // Create worksheet and add to workbook
    const ws = XLSX.utils.aoa_to_sheet([]);
    ws['!ref'] = `A1:G${20 + result.predictedValues.length}`;
    Object.keys(wsData).forEach(cellRef => {
      ws[cellRef] = wsData[cellRef];
    });

    XLSX.utils.book_append_sheet(workbook, ws, 'Regression Analysis');

    // Generate and save file
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `regression-analysis-${result.type}-${result.year || 'all'}.xlsx`);
  } catch (error) {
    console.error('Error generating regression report:', error);
    throw error;
  }
}
