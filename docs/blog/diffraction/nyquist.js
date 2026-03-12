/**
 * Calculates the Nyquist limit of a camera sensor in line pairs per millimeter (lp/mm).
 * 
 * The Nyquist limit represents the highest spatial frequency that can be resolved
 * by the sensor without aliasing. It is defined as half the sampling frequency
 * (pixel density).
 * 
 * Formula: Nyquist (lp/mm) = (Pixels / Millimeters) / 2
 * 
 * @param {number} long_edge_pixel - The number of pixels along the long edge of the sensor.
 * @param {number} short_edge_pixel - The number of pixels along the short edge of the sensor.
 * @param {number} long_edge_mm - The physical length of the long edge in millimeters.
 * @param {number} short_edge_mm - The physical length of the short edge in millimeters.
 * @returns {number} The Nyquist limit in line pairs per millimeter.
 * @throws {Error} If any input is non-positive or not a number.
 */
function calculateNyquistLimit(long_edge_pixel, short_edge_pixel, long_edge_mm, short_edge_mm) {
    // Input Validation
    const inputs = [long_edge_pixel, short_edge_pixel, long_edge_mm, short_edge_mm];
    for (const val of inputs) {
        if (typeof val !== 'number' || isNaN(val) || val <= 0) {
            throw new Error("All arguments must be positive numbers.");
        }
    }

    // Calculate pixel density (pixels per mm) for the long edge
    const densityLong = long_edge_pixel / long_edge_mm;
    
    // Calculate pixel density (pixels per mm) for the short edge
    const densityShort = short_edge_pixel / short_edge_mm;

    // Calculate Nyquist limit for each axis (Density / 2)
    const nyquistLong = densityLong / 2;
    const nyquistShort = densityShort / 2;

    // Ideally, pixels are square, so nyquistLong and nyquistShort should be identical.
    // However, physical sensor dimensions are often nominal (rounded) values.
    // We return the average to account for minor discrepancies in the input dimensions.
    const averageNyquist = (nyquistLong + nyquistShort) / 2;

    return averageNyquist;
}
