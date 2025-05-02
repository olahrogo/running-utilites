<script>
  import { eightyTwentyCalculate, eightyTwentyDistanceOptions, timeToSeconds } from '$lib/calculatorUtils';
  
  // Define state for form data
  let formData = $state({
    raceDistance: '5k', // Default to 5k
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  let calculatedZones = $state(null);
  let errorMessage = $state('');
  
  function calculateZones() {
    try {
      // Convert time to seconds
      const totalSeconds = timeToSeconds(
        parseInt(formData.hours) || 0,
        parseInt(formData.minutes) || 0,
        parseInt(formData.seconds) || 0
      );
      
      if (isNaN(totalSeconds) || totalSeconds <= 0) {
        errorMessage = 'Please enter a valid time';
        return;
      }
      
      // Use the existing eightyTwentyCalculate function from calculatorUtils.ts
      calculatedZones = eightyTwentyCalculate(formData.raceDistance, totalSeconds);
      errorMessage = '';
    } catch (error) {
      errorMessage = `Error calculating zones: ${error.message}`;
      calculatedZones = null;
    }
  }
</script>

<div class="px-4 py-6">
  <h2 class="text-2xl font-bold mb-6">80/20 Endurance Zone Calculator</h2>
  
  <div class="text-sm text-gray-600 mb-6">
    <p>Enter your race distance and time to calculate training zones based on Matt Fitzgerald's 80/20 Running method.</p>
  </div>
  
  <!-- Input Form -->
  <form on:submit|preventDefault={calculateZones} class="mb-8">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Race Distance Input -->
      <div class="form-control">
        <label class="label">
          <span class="label-text">Race Distance</span>
        </label>
        <select bind:value={formData.raceDistance} class="select select-bordered w-full">
          {#each eightyTwentyDistanceOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>
      
      <!-- Race Time Input -->
      <div class="form-control">
        <label class="label">
          <span class="label-text">Race Time</span>
        </label>
        <div class="grid grid-cols-3 gap-2">
          <input type="number" bind:value={formData.hours} class="input input-bordered" min="0" placeholder="Hours">
          <input type="number" bind:value={formData.minutes} class="input input-bordered" min="0" max="59" placeholder="Minutes">
          <input type="number" bind:value={formData.seconds} class="input input-bordered" min="0" max="59" placeholder="Seconds">
        </div>
      </div>
    </div>
    
    <button type="submit" class="btn btn-primary mt-4">Calculate Zones</button>
  </form>
  
  <!-- Error Message -->
  {#if errorMessage}
    <div class="alert alert-error shadow-lg mb-6">
      <div>
        <span>{errorMessage}</span>
      </div>
    </div>
  {/if}
  
  <!-- Results -->
  {#if calculatedZones}
    <div class="space-y-6">
      <!-- Basic Info -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h3 class="card-title">Race Information</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p class="text-sm opacity-70">Race Distance</p>
              <p class="font-semibold">
                {eightyTwentyDistanceOptions.find(option => option.value === calculatedZones.race_distance)?.label || calculatedZones.race_distance}
              </p>
            </div>
            <div>
              <p class="text-sm opacity-70">Race Time</p>
              <p class="font-semibold">{calculatedZones.race_time}</p>
            </div>
            <div>
              <p class="text-sm opacity-70">Race Pace</p>
              <p class="font-semibold">{calculatedZones.pace_per_km}/km</p>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <p class="text-sm opacity-70">VT1 Pace (Ventilatory Threshold 1)</p>
              <p class="font-semibold">{calculatedZones.vt1_pace}/km</p>
            </div>
            <div>
              <p class="text-sm opacity-70">VT2 Pace (Ventilatory Threshold 2)</p>
              <p class="font-semibold">{calculatedZones.vt2_pace}/km</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Pace Zones -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h3 class="card-title">80/20 Running Pace Zones</h3>
          <p class="text-sm opacity-70 mb-4">Based on Matt Fitzgerald's 80/20 Running method</p>
          
          <div class="overflow-x-auto">
            <table class="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Zone</th>
                  <th>Description</th>
                  <th>Pace Range</th>
                </tr>
              </thead>
              <tbody>
                {#each Object.entries(calculatedZones.pace_zones) as [zone, data]}
                  <tr>
                    <td class="font-semibold">{zone.toUpperCase()}</td>
                    <td>{data.description}</td>
                    <td>{data.min} - {data.max}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- Heart Rate Zones -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h3 class="card-title">80/20 Heart Rate Zones</h3>
          <p class="text-sm opacity-70 mb-2">Percentages are based on Maximum Heart Rate</p>
          <p class="text-sm opacity-70 mb-4">To calculate actual heart rates, multiply your max heart rate by these percentages</p>
          
          <div class="overflow-x-auto">
            <table class="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Zone</th>
                  <th>Description</th>
                  <th>% of Max HR</th>
                </tr>
              </thead>
              <tbody>
                {#each Object.entries(calculatedZones.hr_zones) as [zone, data]}
                  <tr>
                    <td class="font-semibold">{zone.toUpperCase()}</td>
                    <td>{data.description}</td>
                    <td>
                      {#if data.max_hr_percent && !data.min_max_hr_percent}
                        0-{data.max_hr_percent}%
                      {:else if data.min_max_hr_percent && data.max_max_hr_percent}
                        {data.min_max_hr_percent}-{data.max_max_hr_percent}%
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>