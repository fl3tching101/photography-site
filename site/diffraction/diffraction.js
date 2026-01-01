/**
 * Calculates diffraction-limited spatial frequency for given contrast percentage
 * @param {number} fNumber - f-stop value (e.g., 8 for f/8)
 * @param {number} contrastPercent - Target contrast percentage (0-100)
 * @param {number} [wavelengthNm=520] - Wavelength in nanometers (default: 520nm)
 * @returns {Object} { spatialFrequency: cycles/mm, cutoffFrequency: cycles/mm }
 */
function calculateDiffractionLimit(fNumber, contrastPercent, wavelengthNm = 520) {
    // Validate inputs
    if (fNumber <= 0) throw new Error("f-number must be positive");
    if (contrastPercent < 0 || contrastPercent > 100) {
        throw new Error("Contrast percentage must be between 0 and 100");
    }
    if (wavelengthNm <= 0) throw new Error("Wavelength must be positive");

    // Convert wavelength to millimeters
    const wavelengthMm = wavelengthNm * 1e-6;
    
    // Calculate cutoff frequency (ν₀) in cycles/mm
    const cutoffFrequency = 1 / (wavelengthMm * fNumber);
    
    // Handle edge cases immediately
    if (contrastPercent >= 100) return { spatialFrequency: 0, cutoffFrequency };
    if (contrastPercent <= 0) return { spatialFrequency: cutoffFrequency, cutoffFrequency };
    
    // Normalized MTF function for diffraction-limited system
    const mtf = (u) => {
        if (u <= 0) return 1.0;
        if (u >= 1) return 0.0;
        return (2 / Math.PI) * (
            Math.acos(u) - 
            u * Math.sqrt(1 - u * u)
        );
    };

    // Target MTF value (0.0 to 1.0)
    const targetMtf = contrastPercent / 100.0;
    
    // Bisection method to solve MTF(u) = targetMtf
    let low = 0.0;
    let high = 1.0;
    let u = 0.5;
    const tolerance = 1e-6;
    let iterations = 0;
    const maxIterations = 100;

    while ((high - low) > tolerance && iterations < maxIterations) {
        u = (low + high) / 2;
        const currentMtf = mtf(u);
        
        if (Math.abs(currentMtf - targetMtf) < tolerance) {
            break;
        }
        
        if (currentMtf > targetMtf) {
            low = u;  // Target is in upper half
        } else {
            high = u; // Target is in lower half
        }
        iterations++;
    }

    // Calculate actual spatial frequency
    const spatialFrequency = u * cutoffFrequency;
    
    return {
        spatialFrequency: Number(spatialFrequency.toFixed(1)),
        cutoffFrequency: Number(cutoffFrequency.toFixed(1)),
        normalizedFrequency: Number(u.toFixed(6)),
        iterations
    };
}

// ======================
// COMMAND LINE HANDLING
// ======================
function showUsage() {
    console.log(`
Diffraction Limit Calculator
Usage:
  node ${process.argv[1]} <f-number> <contrast%> [wavelength_nm]

Arguments:
  <f-number>      : Lens aperture f-stop (e.g., 2.8, 4, 5.6, 8, 11, 16)
  <contrast%>     : Target contrast percentage (0-100)
  [wavelength_nm] : Light wavelength in nanometers (optional, default: 520)

Examples:
  node ${process.argv[1]} 8 10
  node ${process.argv[1]} 5.6 30 550
  node ${process.argv[1]} 16 50
`);
    process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2); // Remove node path and script name

// Show usage if insufficient arguments
if (args.length < 2) {
    showUsage();
}

// Parse arguments with validation
let fNumber, contrastPercent, wavelengthNm = 520;

try {
    fNumber = parseFloat(args[0]);
    contrastPercent = parseFloat(args[1]);
    
    if (isNaN(fNumber) || isNaN(contrastPercent)) {
        throw new Error("Invalid numeric values");
    }
    
    if (args[2]) {
        wavelengthNm = parseFloat(args[2]);
        if (isNaN(wavelengthNm)) throw new Error("Invalid wavelength value");
    }
} catch (e) {
    console.error(`\x1b[31mError: ${e.message}\x1b[0m`);
    showUsage();
}

// Execute calculation and display results
try {
    const result = calculateDiffractionLimit(fNumber, contrastPercent, wavelengthNm);
    
    // Format output with colors and units
    console.log(`\n\x1b[1mDiffraction Limit Calculation\x1b[0m`);
    console.log(`──────────────────────────────`);
    console.log(`Aperture:      f/${fNumber}`);
    console.log(`Contrast:      ${contrastPercent}%`);
    console.log(`Wavelength:    ${wavelengthNm} nm`);
    console.log(`\x1b[34mCutoff Freq:   ${result.cutoffFrequency} cycles/mm (0% contrast)\x1b[0m`);
    console.log(`\x1b[32mTarget Freq:   ${result.spatialFrequency} cycles/mm\x1b[0m`);
    console.log(`Precision:     ${result.iterations} iterations (tolerance: 1e-6)`);
    console.log(`──────────────────────────────`);
    
    // Add practical interpretation
    const featureSize = (1000 / (2 * result.spatialFrequency)).toFixed(1);
    console.log(`\n\x1b[33mPractical Interpretation:\x1b[0m`);
    console.log(`At ${contrastPercent}% contrast, this system can resolve features as small as`);
    console.log(`${featureSize} μm (line pairs) under ideal diffraction-limited conditions.`);
    
} catch (error) {
    console.error(`\n\x1b[31mCalculation Error:\x1b[0m ${error.message}`);
    process.exit(1);
}
