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
