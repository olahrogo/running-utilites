// Type for time input with hours, minutes, and seconds
export interface TimeInput {
  hours: number | undefined;
  minutes: number | undefined;
  seconds: number | undefined;
}

// Format seconds to HH:MM:SS
export function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

// Format pace per km (seconds) to MM:SS
export function formatPace(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Convert hours, minutes, seconds to total seconds
export function timeToSeconds(hours: number, minutes: number, seconds: number): number {
  return hours * 3600 + minutes * 60 + seconds;
}

// McMillan Calculator Data
export const mcmillanDistanceOptions = [
  { value: '800m', label: '800m' },
  { value: '1500m', label: '1500m' },
  { value: '1600m', label: '1600m / Mile' },
  { value: '3k', label: '3000m / 3k' },
  { value: '5k', label: '5000m / 5k' },
  { value: '10k', label: '10000m / 10k' },
  { value: '15k', label: '15000m / 15k' },
  { value: 'half_marathon', label: 'Half Marathon' },
  { value: 'marathon', label: 'Marathon' }
];

// Distances in meters
const distanceValues: Record<string, number> = {
  '800m': 800,
  '1500m': 1500,
  '1600m': 1600,
  '3k': 3000,
  '5k': 5000,
  '10k': 10000,
  '15k': 15000,
  'half_marathon': 21097.5,
  'marathon': 42195
};

// McMillan Calculator implementation
export function mcmillanCalculate(distance: string, raceTimeSeconds: number) {
  const distanceInMeters = distanceValues[distance];
  if (!distanceInMeters) {
    throw new Error('Invalid distance selected');
  }

  // Distance factors based on McMillan's algorithm
  const distanceFactors: Record<string, {seconds: number, meters: number}> = {
    '800m': {seconds: 800/400 * 0.91, meters: 800},
    '1500m': {seconds: 1500/400 * 0.97, meters: 1500},
    '1600m': {seconds: 1600/400 * 0.975, meters: 1600},
    '3k': {seconds: 3000/400 * 1.02, meters: 3000},
    '5k': {seconds: 5000/400 * 1.05, meters: 5000},
    '10k': {seconds: 10000/400 * 1.08, meters: 10000},
    '15k': {seconds: 15000/400 * 1.10, meters: 15000},
    'half_marathon': {seconds: 21097.5/400 * 1.11, meters: 21097.5},
    'marathon': {seconds: 42195/400 * 1.15, meters: 42195},
  };
  
  // Calculate the equivalent 400m time
  const factor = distanceFactors[distance];
  const base400mTime = raceTimeSeconds / factor.seconds;
  
  // Calculate equivalent race performances
  const equivalentRaces: Record<string, string> = {};
  for (const [dist, distFactor] of Object.entries(distanceFactors)) {
    const equivalentTime = base400mTime * distFactor.seconds;
    equivalentRaces[dist] = formatTime(equivalentTime);
  }
  
  // Calculate pace per km
  const pacePerKm = (base400mTime * 2.5); // 1km = 2.5 * 400m
  
  // Calculate training paces (per km)
  // These are approximations based on McMillan's methods
  const trainingPaces = {
    recovery_jog: {
      min: formatPace(base400mTime * 1.5 * 2.5),
      max: formatPace(base400mTime * 1.75 * 2.5)
    },
    easy_run: {
      min: formatPace(base400mTime * 1.25 * 2.5),
      max: formatPace(base400mTime * 1.5 * 2.5)
    },
    steady_state: {
      min: formatPace(base400mTime * 1.1 * 2.5),
      max: formatPace(base400mTime * 1.2 * 2.5)
    },
    tempo: {
      min: formatPace(base400mTime * 1.05 * 2.5),
      max: formatPace(base400mTime * 1.1 * 2.5)
    },
    intervals: {
      min: formatPace(base400mTime * 0.95 * 2.5),
      max: formatPace(base400mTime * 1.0 * 2.5)
    },
    repetition: {
      min: formatPace(base400mTime * 0.9 * 2.5),
      max: formatPace(base400mTime * 0.95 * 2.5)
    }
  };

  return {
    race_distance: distance,
    race_time: formatTime(raceTimeSeconds),
    pace_per_km: formatPace(pacePerKm),
    equivalent_races: equivalentRaces,
    training_paces: trainingPaces
  };
}

// Humphrey/Hansons Calculator Data
export const humphreyDistanceOptions = [
  { value: '5k', label: '5000m / 5k' },
  { value: '10k', label: '10000m / 10k' },
  { value: 'half_marathon', label: 'Half Marathon' },
  { value: 'marathon', label: 'Marathon' }
];

// Humphrey/Hansons Calculator implementation
export function humphreyCalculate(distance: string, raceTimeSeconds: number) {
  const distanceInMeters = distanceValues[distance];
  if (!distanceInMeters) {
    throw new Error('Invalid distance selected');
  }

  // First compute the equivalent 5k time if not already 5k
  // Based on the Python implementation's equivalency factors
  let base5kSeconds: number;
  
  if (distance === '5k') {
    base5kSeconds = raceTimeSeconds;
  } else if (distance === '10k') {
    // 10k to 5k conversion factor
    base5kSeconds = raceTimeSeconds * 0.48;
  } else if (distance === 'half_marathon') {
    // Half marathon to 5k conversion factor
    base5kSeconds = raceTimeSeconds * 0.22;
  } else if (distance === 'marathon') {
    // Marathon to 5k conversion factor
    base5kSeconds = raceTimeSeconds * 0.105;
  } else {
    throw new Error('Unsupported race distance for Humphrey calculator');
  }
  
  // Calculate pace per km for the original race
  const pacePerKm = raceTimeSeconds / (distanceInMeters / 1000);
  
  // Calculate base 5k pace per km
  const base5kPacePerKm = base5kSeconds / 5;
  
  // Calculate training paces based on the Python implementation's factors
  const trainingPaces = {
    easy_run: {
      min: formatPace(base5kPacePerKm * 1.45),
      max: formatPace(base5kPacePerKm * 1.65)
    },
    moderate: {
      min: formatPace(base5kPacePerKm * 1.34),
      max: formatPace(base5kPacePerKm * 1.55)
    },
    long_run: {
      min: formatPace(base5kPacePerKm * 1.24),
      max: formatPace(base5kPacePerKm * 1.55)
    },
    speed_workouts: {
      min: formatPace(base5kPacePerKm * 1.00),
      max: formatPace(base5kPacePerKm * 1.03)
    },
    vo2max_workouts: {
      min: formatPace(base5kPacePerKm * 0.95),
      max: formatPace(base5kPacePerKm * 1.00)
    },
    lactate_threshold: {
      min: formatPace(base5kPacePerKm * 1.07),
      max: formatPace(base5kPacePerKm * 1.09)
    },
    strength_workouts: {
      pace: formatPace(base5kPacePerKm * 1.10)
    },
    half_marathon_tempo: {
      pace: formatPace(base5kPacePerKm * 1.09)
    },
    marathon_tempo: {
      pace: formatPace(base5kPacePerKm * 1.13)
    },
    strides: {
      min: formatPace(base5kPacePerKm * 0.81),
      max: formatPace(base5kPacePerKm * 0.91)
    }
  };
  
  // Calculate equivalent race times
  // Using the 15:00 5k reference from the Python implementation
  const referenceTime = 15 * 60; // 15 minutes in seconds
  
  const equivalentRaces: Record<string, string> = {};
  
  // Mile: 4:24 for a 15:00 5k
  const mileSeconds = base5kSeconds * (4*60 + 24) / referenceTime;
  equivalentRaces['mile'] = formatTime(mileSeconds);
  
  // 3k: 8:38 for a 15:00 5k
  const threeKSeconds = base5kSeconds * (8*60 + 38) / referenceTime;
  equivalentRaces['3k'] = formatTime(threeKSeconds);
  
  // 2 Miles: 9:21 for a 15:00 5k
  const twoMilesSeconds = base5kSeconds * (9*60 + 21) / referenceTime;
  equivalentRaces['2miles'] = formatTime(twoMilesSeconds);
  
  // 4k: 11:50 for a 15:00 5k
  const fourKSeconds = base5kSeconds * (11*60 + 50) / referenceTime;
  equivalentRaces['4k'] = formatTime(fourKSeconds);
  
  // 5k: Just use the base 5k time
  equivalentRaces['5k'] = formatTime(base5kSeconds);
  
  // 6k: 18:11 for a 15:00 5k
  const sixKSeconds = base5kSeconds * (18*60 + 11) / referenceTime;
  equivalentRaces['6k'] = formatTime(sixKSeconds);
  
  // 8k: 24:41 for a 15:00 5k
  const eightKSeconds = base5kSeconds * (24*60 + 41) / referenceTime;
  equivalentRaces['8k'] = formatTime(eightKSeconds);
  
  // 10k: 31:16 for a 15:00 5k
  const tenKSeconds = base5kSeconds * (31*60 + 16) / referenceTime;
  equivalentRaces['10k'] = formatTime(tenKSeconds);
  
  // 12k: 37:56 for a 15:00 5k
  const twelveKSeconds = base5kSeconds * (37*60 + 56) / referenceTime;
  equivalentRaces['12k'] = formatTime(twelveKSeconds);
  
  // 15k: 48:03 for a 15:00 5k
  const fifteenKSeconds = base5kSeconds * (48*60 + 3) / referenceTime;
  equivalentRaces['15k'] = formatTime(fifteenKSeconds);
  
  // 10 Miles: 51:47 for a 15:00 5k
  const tenMilesSeconds = base5kSeconds * (51*60 + 47) / referenceTime;
  equivalentRaces['10miles'] = formatTime(tenMilesSeconds);
  
  // 20k: 1:05:12 for a 15:00 5k
  const twentyKSeconds = base5kSeconds * (65*60 + 12) / referenceTime;
  equivalentRaces['20k'] = formatTime(twentyKSeconds);
  
  // Half Marathon: 1:09:00 for a 15:00 5k
  const halfMarathonSeconds = base5kSeconds * (69*60) / referenceTime;
  equivalentRaces['half_marathon'] = formatTime(halfMarathonSeconds);
  
  // 25k: 1:22:36 for a 15:00 5k
  const twentyfiveKSeconds = base5kSeconds * (82*60 + 36) / referenceTime;
  equivalentRaces['25k'] = formatTime(twentyfiveKSeconds);
  
  // 30k: 1:40:12 for a 15:00 5k
  const thirtyKSeconds = base5kSeconds * (100*60 + 12) / referenceTime;
  equivalentRaces['30k'] = formatTime(thirtyKSeconds);
  
  // Marathon: 2:23:51 for a 15:00 5k
  const marathonSeconds = base5kSeconds * (143*60 + 51) / referenceTime;
  equivalentRaces['marathon'] = formatTime(marathonSeconds);

  return {
    race_distance: distance,
    race_time: formatTime(raceTimeSeconds),
    pace_per_km: formatPace(pacePerKm),
    equivalent_races: equivalentRaces,
    training_paces: trainingPaces
  };
}

// VDOT Calculator Data
export const vdotDistanceOptions = [
  { value: '1500m', label: '1500m' },
  { value: '1600m', label: '1600m / Mile' },
  { value: '3k', label: '3000m / 3k' },
  { value: '5k', label: '5000m / 5k' },
  { value: '10k', label: '10000m / 10k' },
  { value: 'half_marathon', label: 'Half Marathon' },
  { value: 'marathon', label: 'Marathon' }
];

// VDOT Calculator implementation
export function vdotCalculate(race_distance: string, raceTimeSeconds: number) {
  const distanceInMeters = distanceValues[race_distance];
  if (!distanceInMeters) {
    throw new Error('Invalid distance selected');
  }

  // Calculate velocity in m/s
  const velocity = distanceInMeters / raceTimeSeconds;
  
  // Calculate VDOT using formula based on Daniels' calculations
  // These coefficients are adjusted based on the distance to match published values
  let vdot = 0;
  
  // Using the recalibrated VDOT calculation from Python implementation
  if (race_distance === '1500m' || race_distance === '1600m') {
    vdot = velocity * 10.2 + 8.0;  // Adjusted for shorter distances
  } else if (race_distance === '3k') {
    vdot = velocity * 11.4 + 7.5;  // Adjusted for middle distances
  } else if (race_distance === '5k') {
    vdot = velocity * 13.5 + 3.5;  // Adjusted for longer distances
  } else if (race_distance === '10k') {
    vdot = velocity * 13.5 + 3.5;  // Same coefficient as 5k
  } else if (race_distance === 'half_marathon') {
    vdot = velocity * 14.3 + 2.7;  // Adjusted for half marathon
  } else if (race_distance === 'marathon') {
    vdot = velocity * 15.1 + 1.8;  // Adjusted for marathon
  }
  
  vdot = Math.round(vdot * 10) / 10; // Round to 1 decimal place
  
  // Calculate pace per km
  const pacePerKm = 1000 / velocity;
  
  // Calculate equivalent race times based on VDOT
  const equivalentRaces: Record<string, string> = {};
  for (const [dist, meters] of Object.entries(distanceValues)) {
    if (['1500m', '1600m', '3k', '5k', '10k', 'half_marathon', 'marathon'].includes(dist)) {
      // Get velocity for this distance based on VDOT
      let velocityForDist = 0;
      if (dist === '1500m' || dist === '1600m') {
        velocityForDist = (vdot - 8.0) / 10.2;
      } else if (dist === '3k') {
        velocityForDist = (vdot - 7.5) / 11.4;
      } else if (dist === '5k' || dist === '10k') {
        velocityForDist = (vdot - 3.5) / 13.5;
      } else if (dist === 'half_marathon') {
        velocityForDist = (vdot - 2.7) / 14.3;
      } else if (dist === 'marathon') {
        velocityForDist = (vdot - 1.8) / 15.1;
      }
      
      const predictedSeconds = meters / velocityForDist;
      equivalentRaces[dist] = formatTime(predictedSeconds);
    }
  }
  
  // Calculate training paces based on VDOT
  // Calculate base velocity for a 5k at this VDOT level
  const base5kVelocity = (vdot - 3.5) / 13.5; // m/s for 5k
  
  // Calculate training paces as percentages of this velocity
  // Percentages based on Jack Daniels' tables
  const easyVelocity = base5kVelocity * 0.76;  // ~76% of 5k race pace
  const marathonVelocity = base5kVelocity * 0.83;  // ~83% of 5k race pace
  const thresholdVelocity = base5kVelocity * 0.91;  // ~91% of 5k race pace
  const intervalVelocity = base5kVelocity * 0.97;  // ~97% of 5k race pace
  const repetitionVelocity = base5kVelocity * 1.02;  // ~102% of 5k race pace
  
  // Convert velocities to pace in seconds per km
  const easyPaceSeconds = 1000 / easyVelocity;
  const marathonPaceSeconds = 1000 / marathonVelocity;
  const thresholdPaceSeconds = 1000 / thresholdVelocity;
  const intervalPaceSeconds = 1000 / intervalVelocity;
  const repetitionPaceSeconds = 1000 / repetitionVelocity;
  
  // Each pace has a range (±2% adjustment)
  const trainingPaces = {
    easy: {
      min: formatPace(easyPaceSeconds * 1.03),
      max: formatPace(easyPaceSeconds * 0.97)
    },
    marathon: {
      min: formatPace(marathonPaceSeconds * 1.01),
      max: formatPace(marathonPaceSeconds * 0.99)
    },
    threshold: {
      min: formatPace(thresholdPaceSeconds * 1.01),
      max: formatPace(thresholdPaceSeconds * 0.99)
    },
    interval: {
      min: formatPace(intervalPaceSeconds * 1.01),
      max: formatPace(intervalPaceSeconds * 0.99)
    },
    repetition: {
      min: formatPace(repetitionPaceSeconds * 1.01),
      max: formatPace(repetitionPaceSeconds * 0.99)
    }
  };

  return {
    race_distance: race_distance,
    race_time: formatTime(raceTimeSeconds),
    vdot: vdot,
    pace_per_km: formatPace(pacePerKm),
    equivalent_races: equivalentRaces,
    training_paces: trainingPaces
  };
}

// Tinman Calculator Data
export const tinmanDistanceOptions = [
  { value: '3k', label: '3000m / 3k' },
  { value: '5k', label: '5000m / 5k' },
  { value: '10k', label: '10000m / 10k' },
  { value: 'half_marathon', label: 'Half Marathon' },
  { value: 'marathon', label: 'Marathon' }
];

// Tinman Calculator implementation
export function tinmanCalculate(distance: string, raceTimeSeconds: number) {
  const distanceInMeters = distanceValues[distance];
  if (!distanceInMeters) {
    throw new Error('Invalid distance selected');
  }

  // Calculate velocity in m/s
  const velocity = distanceInMeters / raceTimeSeconds;
  
  // Calculate Critical Velocity (CV) based on race performance
  // These are approximation factors based on Tinman's approach
  let cvVelocity: number;
  if (distance === 'marathon') {
    cvVelocity = velocity * 1.06;
  } else if (distance === 'half_marathon') {
    cvVelocity = velocity * 1.04;
  } else if (distance === '10k') {
    cvVelocity = velocity * 1.02;
  } else if (distance === '5k') {
    cvVelocity = velocity * 0.98;
  } else {  // 3k
    cvVelocity = velocity * 0.94;
  }
  
  // Calculate CV pace in seconds per km
  const cvPaceSeconds = 1000 / cvVelocity;
  const cvPace = formatPace(cvPaceSeconds);
  
  // Calculate equivalent race times based on CV
  const equivalentRaces: Record<string, string> = {};
  for (const dist of Object.keys(distanceValues)) {
    if (['3k', '5k', '10k', 'half_marathon', 'marathon'].includes(dist)) {
      // For each distance, adjust CV to race pace using the inverse of the conversion factors
      let equivVelocity: number;
      if (dist === 'marathon') {
        equivVelocity = cvVelocity / 1.06;
      } else if (dist === 'half_marathon') {
        equivVelocity = cvVelocity / 1.04;
      } else if (dist === '10k') {
        equivVelocity = cvVelocity / 1.02;
      } else if (dist === '5k') {
        equivVelocity = cvVelocity / 0.98;
      } else { // 3k
        equivVelocity = cvVelocity / 0.94;
      }
      
      const equivSeconds = distanceValues[dist] / equivVelocity;
      equivalentRaces[dist] = formatTime(equivSeconds);
    }
  }

  // Tinman training paces based on CV
  const trainingPaces = {
    easy: {
      min: formatPace(cvPaceSeconds * 1.34),
      max: formatPace(cvPaceSeconds * 1.28)
    },
    moderate: {
      min: formatPace(cvPaceSeconds * 1.19),
      max: formatPace(cvPaceSeconds * 1.15)
    },
    steady_state: {
      min: formatPace(cvPaceSeconds * 1.11),
      max: formatPace(cvPaceSeconds * 1.07)
    },
    cv: {
      min: formatPace(cvPaceSeconds * 1.01),
      max: formatPace(cvPaceSeconds * 0.99)
    },
    interval: {
      min: formatPace(cvPaceSeconds * 0.95),
      max: formatPace(cvPaceSeconds * 0.92)
    },
    repetition: {
      min: formatPace(cvPaceSeconds * 0.87),
      max: formatPace(cvPaceSeconds * 0.83)
    }
  };

  return {
    race_distance: distance,
    race_time: formatTime(raceTimeSeconds),
    cv_pace: cvPace,
    equivalent_races: equivalentRaces,
    training_paces: trainingPaces
  };
}

// KM Effort Calculator implementation
export function kmEffortCalculate(
  distanceKm: number, 
  elevationGainM: number,
  hours?: number, 
  minutes?: number, 
  seconds?: number
) {
  // Validate input
  if (distanceKm <= 0) {
    throw new Error('Distance must be greater than zero');
  }
  
  if (elevationGainM < 0) {
    throw new Error('Elevation gain cannot be negative');
  }

  // Calculate elevation factor
  const elevationFactor = 1 + (elevationGainM / 10000); // 100m gain = 1km equivalent
  
  // Calculate KM-effort distance
  const elevationContribution = (elevationGainM / 100);
  const kmEffort = distanceKm + elevationContribution;
  
  // Calculate KM-effort percentage increase
  const kmEffortPercent = Math.round((kmEffort / distanceKm - 1) * 100);
  
  const result: Record<string, any> = {
    distance_km: parseFloat(distanceKm.toFixed(2)),
    elevation_gain_m: elevationGainM,
    factors: {
      elevation_factor: parseFloat(elevationFactor.toFixed(2))
    },
    contributions: {
      elevation: parseFloat(elevationContribution.toFixed(2))
    },
    km_effort: parseFloat(kmEffort.toFixed(2)),
    km_effort_percent: kmEffortPercent
  };
  
  // Add time-based calculations if provided
  if (hours !== undefined && minutes !== undefined && seconds !== undefined) {
    const totalSeconds = timeToSeconds(hours, minutes, seconds);
    const pacePerKm = totalSeconds / distanceKm;
    const effortPacePerKm = totalSeconds / kmEffort;
    const hoursDecimal = totalSeconds / 3600;
    
    result.total_time = formatTime(totalSeconds);
    result.pace_per_km = formatPace(pacePerKm);
    result.effort_pace_per_km = formatPace(effortPacePerKm);
    result.km_effort_per_hour = parseFloat((kmEffort / hoursDecimal).toFixed(2));
  }
  
  return result;
}

// 80/20 Calculator Data
export const eightyTwentyDistanceOptions = [
  { value: '5k', label: '5000m / 5k' },
  { value: '10k', label: '10000m / 10k' },
  { value: 'half_marathon', label: 'Half Marathon' },
  { value: 'marathon', label: 'Marathon' }
];

// 80/20 Calculator implementation
export function eightyTwentyCalculate(distance: string, raceTimeSeconds: number) {
  const distanceInMeters = distanceValues[distance];
  if (!distanceInMeters) {
    throw new Error('Invalid distance selected');
  }

  // Calculate pace per km
  const pacePerKm = raceTimeSeconds / (distanceInMeters / 1000);
  
  // Calculate VT2 (Ventilatory Threshold 2) pace based on race distance
  // VT2 serves as a reference for all other zones in 80/20 training
  let vt2Pace = 0;
  if (distance === '5k') {
    vt2Pace = pacePerKm * 1.05;  // 5k pace is slightly faster than VT2
  } else if (distance === '10k') {
    vt2Pace = pacePerKm * 1.02;  // 10k pace is very close to VT2
  } else if (distance === 'half_marathon') {
    vt2Pace = pacePerKm * 0.96;  // Half marathon pace is slower than VT2
  } else if (distance === 'marathon') {
    vt2Pace = pacePerKm * 0.92;  // Marathon pace is significantly slower than VT2
  }
  
  // Calculate VT1 (Ventilatory Threshold 1) pace - typically around 80% of VT2 intensity
  const vt1Pace = vt2Pace * 1.20;
  
  // Calculate 80/20 pace zones based on VT1 and VT2
  const paceZones = {
    zone1: {  // Recovery
      min: formatPace(vt2Pace * 1.25),  // Slower than 80% of VT2 intensity
      max: formatPace(vt2Pace * 1.20),   // 80% of VT2 intensity
      description: 'Recovery/Low-Intensity'
    },
    zone2: {  // Foundation/Endurance
      min: formatPace(vt2Pace * 1.20),  // 80% of VT2 intensity
      max: formatPace(vt2Pace * 1.05),   // 95% of VT2 intensity
      description: 'Foundation/Endurance'
    },
    zoneX: {  // Moderate (Gray Zone)
      min: formatPace(vt2Pace * 1.05),  // 95% of VT2 intensity
      max: formatPace(vt1Pace),   // VT1 pace
      description: 'Moderate (Gray Zone)'
    },
    zone3: {  // Tempo
      min: formatPace(vt1Pace),  // VT1 pace
      max: formatPace(vt2Pace * 0.97),   // 97% of VT2 intensity
      description: 'Tempo'
    },
    zone4: {  // SubThreshold
      min: formatPace(vt2Pace * 0.97),  // 97% of VT2 intensity
      max: formatPace(vt2Pace),   // VT2 pace
      description: 'SubThreshold'
    },
    zone5: {  // SuperThreshold
      min: formatPace(vt2Pace),  // VT2 pace
      max: formatPace(vt2Pace * 0.94),   // 106% of VT2 intensity
      description: 'SuperThreshold'
    },
    zoneY: {  // VO2max
      min: formatPace(vt2Pace * 0.94),  // 106% of VT2 intensity
      max: formatPace(vt2Pace * 0.83),   // 120% of VT2 intensity
      description: 'VO2max'
    },
    zoneZ: {  // Speed
      min: formatPace(vt2Pace * 0.83),  // 120% of VT2 intensity
      max: formatPace(vt2Pace * 0.70),   // Arbitrary faster limit
      description: 'Speed/Anaerobic'
    }
  };
  
  // Calculate heart rate zones based on 80/20 methodology
  // These are calculated as percentages of max heart rate (requires max HR input)
  const hrZones = {
    zone1: {
      max_hr_percent: 76,
      description: 'Recovery/Low-Intensity'
    },
    zone2: {
      min_max_hr_percent: 76,
      max_max_hr_percent: 81,
      description: 'Foundation/Endurance'
    },
    zoneX: {
      min_max_hr_percent: 81,
      max_max_hr_percent: 89,
      description: 'Moderate (Gray Zone)'
    },
    zone3: {
      min_max_hr_percent: 89,
      max_max_hr_percent: 93,
      description: 'Tempo'
    },
    zone4: {
      min_max_hr_percent: 93,
      max_max_hr_percent: 97,
      description: 'SubThreshold'
    },
    zone5: {
      min_max_hr_percent: 97,
      max_max_hr_percent: 100,
      description: 'SuperThreshold/VO2max/Speed'
    }
  };

  return {
    race_distance: distance,
    race_time: formatTime(raceTimeSeconds),
    pace_per_km: formatPace(pacePerKm),
    vt1_pace: formatPace(vt1Pace),
    vt2_pace: formatPace(vt2Pace),
    pace_zones: paceZones,
    hr_zones: hrZones
  };
}

/**
 * Calculate training zones based on Joe Friel's methodology
 * @param lthr Lactate threshold heart rate in BPM
 * @param ftp Functional threshold power in watts
 * @param ltPaceSeconds Lactate threshold pace in seconds per km
 * @returns Dictionary containing training zones for heart rate, power, and/or pace
 */
export function frielCalculate(lthr: number | null = null, ftp: number | null = null, ltPaceSeconds: number | null = null) {
  const result: any = {};
  
  // Calculate heart rate zones if LTHR is provided
  if (lthr) {
    const hrZones = {
      'zone1': {  // Active Recovery
        'min': Math.round(lthr * 0.65),
        'max': Math.round(lthr * 0.81),
        'description': 'Active Recovery'
      },
      'zone2': {  // Endurance
        'min': Math.round(lthr * 0.82),
        'max': Math.round(lthr * 0.89),
        'description': 'Endurance'
      },
      'zone3': {  // Tempo
        'min': Math.round(lthr * 0.90),
        'max': Math.round(lthr * 0.93),
        'description': 'Tempo'
      },
      'zone4': {  // Lactate Threshold
        'min': Math.round(lthr * 0.94),
        'max': Math.round(lthr * 0.99),
        'description': 'Lactate Threshold'
      },
      'zone5a': {  // VO2max
        'min': Math.round(lthr * 1.00),
        'max': Math.round(lthr * 1.02),
        'description': 'VO2max'
      },
      'zone5b': {  // Anaerobic Capacity
        'min': Math.round(lthr * 1.03),
        'max': Math.round(lthr * 1.05),
        'description': 'Anaerobic Capacity'
      },
      'zone5c': {  // Neuromuscular Power
        'min': Math.round(lthr * 1.06),
        'max': 220,  // Arbitrary max heart rate
        'description': 'Neuromuscular Power'
      }
    };
    result.lthr = lthr;
    result.hr_zones = hrZones;
  }
  
  // Calculate power zones if FTP is provided
  if (ftp) {
    const powerZones = {
      'zone1': {  // Active Recovery
        'min': Math.round(ftp * 0.45),
        'max': Math.round(ftp * 0.55),
        'description': 'Active Recovery'
      },
      'zone2': {  // Endurance
        'min': Math.round(ftp * 0.56),
        'max': Math.round(ftp * 0.75),
        'description': 'Endurance'
      },
      'zone3': {  // Tempo
        'min': Math.round(ftp * 0.76),
        'max': Math.round(ftp * 0.90),
        'description': 'Tempo'
      },
      'zone4': {  // Lactate Threshold
        'min': Math.round(ftp * 0.91),
        'max': Math.round(ftp * 1.05),
        'description': 'Lactate Threshold'
      },
      'zone5a': {  // VO2max
        'min': Math.round(ftp * 1.06),
        'max': Math.round(ftp * 1.20),
        'description': 'VO2max'
      },
      'zone5b': {  // Anaerobic Capacity
        'min': Math.round(ftp * 1.21),
        'max': Math.round(ftp * 1.50),
        'description': 'Anaerobic Capacity'
      },
      'zone5c': {  // Neuromuscular Power
        'min': Math.round(ftp * 1.51),
        'max': 'max',  // No specific upper limit
        'description': 'Neuromuscular Power'
      }
    };
    result.ftp = ftp;
    result.power_zones = powerZones;
  }
  
  // Calculate pace zones if lactate threshold pace is provided
  if (ltPaceSeconds) {
    const paceZones = {
      'zone1': {  // Active Recovery
        'min': ltPaceSeconds * 1.30,
        'max': ltPaceSeconds * 1.20,
        'description': 'Active Recovery'
      },
      'zone2': {  // Endurance
        'min': ltPaceSeconds * 1.20,
        'max': ltPaceSeconds * 1.10,
        'description': 'Endurance'
      },
      'zone3': {  // Tempo
        'min': ltPaceSeconds * 1.10,
        'max': ltPaceSeconds * 1.05,
        'description': 'Tempo'
      },
      'zone4': {  // Lactate Threshold
        'min': ltPaceSeconds * 1.05,
        'max': ltPaceSeconds * 1.00,
        'description': 'Lactate Threshold'
      },
      'zone5a': {  // VO2max
        'min': ltPaceSeconds * 1.00,
        'max': ltPaceSeconds * 0.95,
        'description': 'VO2max'
      },
      'zone5b': {  // Anaerobic Capacity
        'min': ltPaceSeconds * 0.95,
        'max': ltPaceSeconds * 0.90,
        'description': 'Anaerobic Capacity'
      },
      'zone5c': {  // Neuromuscular Power
        'min': ltPaceSeconds * 0.90,
        'max': ltPaceSeconds * 0.80,
        'description': 'Neuromuscular Power'
      }
    };
    
    // Convert seconds to formatted time strings
    const formattedPaceZones: any = {};
    for (const [zone, paces] of Object.entries(paceZones)) {
      formattedPaceZones[zone] = {
        min: formatPace(paces.min),
        max: formatPace(paces.max),
        description: paces.description
      };
    }
    
    result.lt_pace = formatPace(ltPaceSeconds);
    result.pace_zones = formattedPaceZones;
  }
  
  return result;
}