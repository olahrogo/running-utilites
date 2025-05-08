// GPX Elevation Analysis Types
export interface TrackPoint {
    lat: number;
    lon: number;
    ele: number;
}

export interface KilometerSegment {
    km: string | number;
    elevation_gain: number;
    elevation_loss: number;
    net_elevation: number;
    grade: number;
    current_elevation: number;
}

export interface ElevationAnalysisResult {
    filename?: string;
    km_segments: KilometerSegment[];
    total_distance: number;
    total_elevation_gain: number;
    total_elevation_loss: number;
    net_elevation: number;
    avg_elevation_gain_per_km: number;
    overall_grade: number;
    median_gradient?: number;
    min_gradient?: number;
    max_gradient?: number;
    start_elevation: number;
    end_elevation: number;
    error?: string;
}

// Calculate the distance between two points using the Haversine formula
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Radius of the Earth in meters
    const R = 6371000;

    // Convert latitude and longitude from degrees to radians
    const lat1Rad = (Math.PI * lat1) / 180;
    const lon1Rad = (Math.PI * lon1) / 180;
    const lat2Rad = (Math.PI * lat2) / 180;
    const lon2Rad = (Math.PI * lon2) / 180;

    // Differences in coordinates
    const dlat = lat2Rad - lat1Rad;
    const dlon = lon2Rad - lon1Rad;

    // Haversine formula
    const a = Math.sin(dlat / 2) ** 2 + Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dlon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
}

// Parse GPX file and extract track points
export function parseGPXString(gpxString: string): TrackPoint[] {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(gpxString, "text/xml");

        // Check if parsing was successful
        if (xmlDoc.documentElement.nodeName === "parsererror") {
            throw new Error("Error parsing GPX file");
        }

        // Extract track points
        const trackPoints: TrackPoint[] = [];

        // Try different possible GPX structures
        // First attempt: Standard GPX format with namespaces
        let trkptNodes = xmlDoc.evaluate('//trkpt | //gpx:trkpt', xmlDoc,
            (prefix) => prefix === 'gpx' ? 'http://www.topografix.com/GPX/1/1' : null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

        // If no points found, try alternative structures (GPX 1.0 or non-namespaced)
        if (trkptNodes.snapshotLength === 0) {
            // Try GPX without namespace
            trkptNodes = xmlDoc.evaluate('//*[local-name()="trkpt"]', xmlDoc, null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        }

        // If still no points found, try looking for waypoints instead
        if (trkptNodes.snapshotLength === 0) {
            trkptNodes = xmlDoc.evaluate('//wpt | //gpx:wpt | //*[local-name()="wpt"]', xmlDoc,
                (prefix) => prefix === 'gpx' ? 'http://www.topografix.com/GPX/1/1' : null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        }

        for (let i = 0; i < trkptNodes.snapshotLength; i++) {
            const trkpt = trkptNodes.snapshotItem(i) as Element;
            const lat = parseFloat(trkpt.getAttribute('lat') || '0');
            const lon = parseFloat(trkpt.getAttribute('lon') || '0');

            // Get elevation - try different possible element names
            const eleNode = trkpt.querySelector('ele') ||
                trkpt.querySelector('gpx\\:ele') ||
                trkpt.getElementsByTagName('ele')[0];

            const ele = eleNode ? parseFloat(eleNode.textContent || '0') : 0;

            if (lat !== 0 || lon !== 0) { // Only add valid points
                trackPoints.push({ lat, lon, ele });
            }
        }

        if (trackPoints.length < 2) {
            throw new Error("Not enough track points found in the GPX file. Ensure your file contains valid track points.");
        }

        return trackPoints;
    } catch (error) {
        console.error("Error parsing GPX file:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to parse GPX file. Please ensure it's a valid GPX format.");
    }
}

// Apply a simple moving average to smooth elevation data
export function smoothElevationData(trackPoints: TrackPoint[], windowSize: number = 5): TrackPoint[] {
    if (trackPoints.length <= windowSize) {
        return [...trackPoints]; // Return a copy of the original array
    }

    const smoothedPoints: TrackPoint[] = JSON.parse(JSON.stringify(trackPoints)); // Deep copy
    const halfWindow = Math.floor(windowSize / 2);

    for (let i = 0; i < trackPoints.length; i++) {
        // Calculate window bounds with edge handling
        const startIdx = Math.max(0, i - halfWindow);
        const endIdx = Math.min(trackPoints.length - 1, i + halfWindow);

        // Calculate average elevation within the window
        const windowElevations = trackPoints.slice(startIdx, endIdx + 1).map(point => point.ele);
        const avgElevation = windowElevations.reduce((sum, ele) => sum + ele, 0) / windowElevations.length;

        smoothedPoints[i].ele = avgElevation;
    }

    return smoothedPoints;
}

// Calculate total elevation changes with minimum threshold
export function calculateTotalElevationChanges(
    trackPoints: TrackPoint[], 
    minElevationDiff: number = 3.0
): { total_gain: number; total_loss: number } {
    let totalGain = 0;
    let totalLoss = 0;

    // Accumulators for small changes that don't reach the threshold
    let gainAccumulator = 0;
    let lossAccumulator = 0;

    for (let i = 1; i < trackPoints.length; i++) {
        const diff = trackPoints[i].ele - trackPoints[i - 1].ele;

        // Handle positive elevation changes (gains)
        if (diff > 0) {
            gainAccumulator += diff;

            // If we've accumulated enough gain, add it to the total
            if (gainAccumulator >= minElevationDiff) {
                totalGain += gainAccumulator;
                gainAccumulator = 0;
            }

            // Reset loss accumulator when direction changes
            lossAccumulator = 0;
        } 
        // Handle negative elevation changes (losses)
        else if (diff < 0) {
            lossAccumulator += Math.abs(diff);

            // If we've accumulated enough loss, add it to the total
            if (lossAccumulator >= minElevationDiff) {
                totalLoss += lossAccumulator;
                lossAccumulator = 0;
            }

            // Reset gain accumulator when direction changes
            gainAccumulator = 0;
        }
    }

    // Add any remaining accumulated values if they're significant
    if (gainAccumulator >= minElevationDiff) {
        totalGain += gainAccumulator;
    }
    if (lossAccumulator >= minElevationDiff) {
        totalLoss += lossAccumulator;
    }

    return {
        total_gain: totalGain,
        total_loss: totalLoss
    };
}

// Calculate elevation gain for segments from track points
export function calculateElevationGainForSegments(
    trackPoints: TrackPoint[], 
    segmentDistanceMeters: number = 1000, 
    minElevationDiff: number = 3.0,
    useSmoothing: boolean = true
): ElevationAnalysisResult {
    if (!trackPoints || trackPoints.length < 2) {
        return {
            km_segments: [],
            total_distance: 0,
            total_elevation_gain: 0,
            total_elevation_loss: 0,
            net_elevation: 0,
            avg_elevation_gain_per_km: 0,
            overall_grade: 0,
            start_elevation: 0,
            end_elevation: 0,
            error: "Not enough track points to analyze"
        };
    }

    // Apply smoothing to reduce noise in elevation data if requested
    const pointsToUse = useSmoothing ? smoothElevationData(trackPoints, 10) : trackPoints;

    // Calculate total elevation changes directly from all track points
    const elevationChanges = calculateTotalElevationChanges(pointsToUse, minElevationDiff);
    const totalElevationGain = elevationChanges.total_gain;
    const totalElevationLoss = elevationChanges.total_loss;

    // Initialize variables
    const segmentResults: KilometerSegment[] = [];
    let totalDistance = 0;
    let currentSegmentStartIdx = 0;
    let currentSegment = 1;

    // Process each track point to calculate distances and elevation changes for segments
    for (let i = 1; i < pointsToUse.length; i++) {
        const prevPoint = pointsToUse[i - 1];
        const currentPoint = pointsToUse[i];

        // Calculate distance between points
        const segmentDistance = haversineDistance(
            prevPoint.lat, prevPoint.lon,
            currentPoint.lat, currentPoint.lon
        );

        totalDistance += segmentDistance;

        // If we've crossed a segment boundary or reached the end
        if (totalDistance >= currentSegment * segmentDistanceMeters || i === pointsToUse.length - 1) {
            // Calculate elevation change for this segment
            const segmentPoints = pointsToUse.slice(currentSegmentStartIdx, i + 1);
            const segmentElevationChanges = calculateTotalElevationChanges(segmentPoints, minElevationDiff);
            
            const elevationGain = segmentElevationChanges.total_gain;
            const elevationLoss = segmentElevationChanges.total_loss;

            // Calculate segment distance in meters
            let segmentDistanceInMeters = 0;
            for (let j = currentSegmentStartIdx + 1; j <= i; j++) {
                segmentDistanceInMeters += haversineDistance(
                    pointsToUse[j-1].lat, pointsToUse[j-1].lon,
                    pointsToUse[j].lat, pointsToUse[j].lon
                );
            }

            // Calculate net elevation and grade for this segment
            const netElevation = elevationGain - elevationLoss;
            const grade = (netElevation / segmentDistanceInMeters) * 100;

            // Add segment data with improved segment labeling
            const segmentStart = (currentSegment - 1) * (segmentDistanceMeters / 1000);
            const segmentEnd = i === pointsToUse.length - 1 ?
                Math.round(totalDistance / 1000 * 100) / 100 :
                currentSegment * (segmentDistanceMeters / 1000);

            segmentResults.push({
                km: `${segmentStart}-${segmentEnd} km`,
                elevation_gain: Math.round(elevationGain * 10) / 10,
                elevation_loss: Math.round(elevationLoss * 10) / 10,
                net_elevation: Math.round(netElevation * 10) / 10,
                grade: Math.round(grade * 10) / 10,
                current_elevation: Math.round(pointsToUse[i].ele * 10) / 10
            });

            // Prepare for next segment
            currentSegmentStartIdx = i;
            currentSegment++;
        }
    }

    // Calculate overall statistics
    const netElevation = totalElevationGain - totalElevationLoss;
    const overallGrade = (netElevation / totalDistance) * 100;
    
    // Calculate average elevation gain per km
    const avgElevationGainPerKm = segmentResults.length > 0 ? 
        totalElevationGain / segmentResults.length : 0;

    return {
        km_segments: segmentResults,
        total_distance: Math.round(totalDistance / 1000 * 100) / 100, // convert to km and round to 2 decimals
        total_elevation_gain: Math.round(totalElevationGain * 10) / 10,
        total_elevation_loss: Math.round(totalElevationLoss * 10) / 10,
        net_elevation: Math.round(netElevation * 10) / 10,
        avg_elevation_gain_per_km: Math.round(avgElevationGainPerKm * 10) / 10,
        overall_grade: Math.round(overallGrade * 10) / 10,
        start_elevation: Math.round(pointsToUse[0].ele * 10) / 10,
        end_elevation: Math.round(pointsToUse[pointsToUse.length - 1].ele * 10) / 10
    };
}

// Main function to analyze GPX data
export function analyzeGpxElevation(
    gpxString: string, 
    filename?: string, 
    segmentDistanceMeters: number = 1000,
    minElevationDiff: number = 1.0,
    useSmoothing: boolean = true
): ElevationAnalysisResult {
    try {
        const trackPoints = parseGPXString(gpxString);

        if (trackPoints.length < 2) {
            return {
                km_segments: [],
                total_distance: 0,
                total_elevation_gain: 0,
                total_elevation_loss: 0,
                net_elevation: 0,
                avg_elevation_gain_per_km: 0,
                overall_grade: 0,
                start_elevation: 0,
                end_elevation: 0,
                error: "Not enough track points found in the GPX file. Ensure your file contains valid track points."
            };
        }

        const results = calculateElevationGainForSegments(
            trackPoints, 
            segmentDistanceMeters,
            minElevationDiff,
            useSmoothing
        );

        if (filename) {
            results.filename = filename;
        }

        return results;
    } catch (error) {
        console.error("Error analyzing GPX elevation:", error);
        return {
            km_segments: [],
            total_distance: 0,
            total_elevation_gain: 0,
            total_elevation_loss: 0,
            net_elevation: 0,
            avg_elevation_gain_per_km: 0,
            overall_grade: 0,
            start_elevation: 0,
            end_elevation: 0,
            error: error instanceof Error ? error.message : "Unknown error analyzing GPX file"
        };
    }
}