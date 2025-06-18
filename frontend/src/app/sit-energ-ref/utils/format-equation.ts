interface Coefficient {
  [key: string]: number;
}

export function formatRegressionEquation(equation: string, coefficients: Coefficient): string {
  // Replace coefficient placeholders with actual values
  let formattedEquation = equation;
  
  Object.entries(coefficients).forEach(([key, value]) => {
    const formattedValue = value >= 0 ? `+ ${value.toFixed(4)}` : `- ${Math.abs(value).toFixed(4)}`;
    formattedEquation = formattedEquation.replace(
      new RegExp(`\\b${key}\\b`, 'g'),
      formattedValue
    );
  });

  // Clean up the equation
  formattedEquation = formattedEquation
    // Remove leading plus sign
    .replace(/^\+\s/, '')
    // Add spaces around operators
    .replace(/([+\-])/g, ' $1 ')
    // Remove double spaces
    .replace(/\s+/g, ' ')
    // Format intercept
    .replace(/\bintercept\b/, coefficients.intercept >= 0 
      ? `+ ${coefficients.intercept.toFixed(4)}`
      : `- ${Math.abs(coefficients.intercept).toFixed(4)}`
    )
    .trim();

  return formattedEquation;
} 