<script>
  import { kmEffortCalculate } from '../../calculatorUtils';
  
  // Initial form data
  let formData = {
    distance: '',
    elevationGain: '',
    hours: '',
    minutes: '',
    seconds: ''
  };
  
  // Results storage
  let effortResults = null;
  let loading = false;
  let error = null;
  
  // Calculate KM effort based on inputs
  function calculateEffort() {
    loading = true;
    error = null;
    
    try {
      // Validate inputs
      if (!formData.distance || !formData.elevationGain) {
        throw new Error('Please enter both distance and elevation gain');
      }
      
      const distance = parseFloat(formData.distance);
      const elevationGain = parseFloat(formData.elevationGain);
      
      if (isNaN(distance) || distance <= 0) {
        throw new Error('Please enter a valid distance (greater than 0)');
      }
      
      if (isNaN(elevationGain) || elevationGain < 0) {
        throw new Error('Please enter a valid elevation gain (0 or greater)');
      }
      
      // Convert time inputs to numbers
      const hours = formData.hours !== '' ? parseInt(formData.hours, 10) : 0;
      const minutes = formData.minutes !== '' ? parseInt(formData.minutes, 10) : 0;
      const seconds = formData.seconds !== '' ? parseInt(formData.seconds, 10) : 0;
      
      // Check if any time field has been filled in (even with zeros)
      const hasTimeInput = formData.hours !== '' || formData.minutes !== '' || formData.seconds !== '';
      
      // Always pass time values if any time field has been entered
      if (hasTimeInput) {
        effortResults = kmEffortCalculate(distance, elevationGain, hours, minutes, seconds);
      } else {
        effortResults = kmEffortCalculate(distance, elevationGain);
      }
      
    } catch (err) {
      error = err.message;
      effortResults = null;
    } finally {
      loading = false;
    }
  }
</script>

<div class="px-4 py-6">
  <h2 class="text-2xl font-bold mb-6">KM-Effort Calculator</h2>
  
  <div class="text-sm text-gray-600 mb-6">
    <p>The KM-Effort calculator helps you understand the real effort of your runs by accounting for elevation gain. For every 100m of elevation gain, it adds 1km to the effective distance.</p>
  </div>
  
  <!-- Input Form -->
  <form on:submit|preventDefault={calculateEffort} class="mb-8">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Distance Input -->
      <div class="form-control">
        <label class="label">
          <span class="label-text">Distance (km)</span>
        </label>
        <input 
          type="number" 
          bind:value={formData.distance}
          placeholder="Enter distance"
          min="0.1"
          step="0.01"
          class="input input-bordered w-full" 
        />
      </div>
      
      <!-- Elevation Gain Input -->
      <div class="form-control">
        <label class="label">
          <span class="label-text">Elevation Gain (meters)</span>
        </label>
        <input 
          type="number" 
          bind:value={formData.elevationGain}
          placeholder="Enter elevation gain"
          min="0"
          step="1"
          class="input input-bordered w-full" 
        />
      </div>
      
      <!-- Optional Time Input -->
      <div class="form-control md:col-span-2">
        <label class="label">
          <span class="label-text">Time (optional - for pace calculations)</span>
        </label>
        <div class="join">
          <input 
            type="number" 
            bind:value={formData.hours} 
            placeholder="h"
            min="0"
            class="input input-bordered join-item w-1/3" 
          />
          <input 
            type="number" 
            bind:value={formData.minutes} 
            placeholder="m"
            min="0" 
            max="59"
            class="input input-bordered join-item w-1/3" 
          />
          <input 
            type="number" 
            bind:value={formData.seconds} 
            placeholder="s"
            min="0" 
            max="59"
            class="input input-bordered join-item w-1/3" 
          />
        </div>
      </div>
      
      <!-- Calculate Button -->
      <div class="form-control md:col-span-2">
        <button type="submit" class="btn btn-primary w-full md:w-auto md:ml-auto" disabled={loading}>
          {#if loading}
            <span class="loading loading-spinner"></span> Calculating...
          {:else}
            Calculate KM-Effort
          {/if}
        </button>
      </div>
    </div>
  </form>
  
  <!-- Error Message -->
  {#if error}
    <div class="alert alert-error mb-6">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{error}</span>
    </div>
  {/if}
  
  <!-- Results -->
  {#if effortResults}
    <div class="bg-base-200 p-6 rounded-lg">
      <h3 class="text-lg font-semibold mb-4">KM-Effort Results</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 class="font-semibold mb-2">Input Details</h4>
          <ul class="list-disc pl-5 space-y-1">
            <li>Distance: {effortResults.distance_km} km</li>
            <li>Elevation Gain: {effortResults.elevation_gain_m} meters</li>
            {#if effortResults.total_time}
              <li>Time: {effortResults.total_time}</li>
            {/if}
          </ul>
        </div>
        
        <div>
          <h4 class="font-semibold mb-2">Effort Calculations</h4>
          <ul class="list-disc pl-5 space-y-1">
            <li>
              <span class="font-medium">KM-Effort: {effortResults.km_effort} km</span> 
              <span class="text-sm text-gray-600">(+{effortResults.km_effort_percent}% increase)</span>
            </li>
            <li>Elevation Factor: {effortResults.factors.elevation_factor}x</li>
            <li>Added by Elevation: +{effortResults.contributions.elevation} km</li>
          </ul>
        </div>
      </div>
      
      {#if effortResults.pace_per_km}
        <div class="mt-6">
          <h4 class="font-semibold mb-2">Pace Calculations</h4>
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Actual Pace</td>
                  <td>{effortResults.pace_per_km}/km</td>
                </tr>
                <tr>
                  <td>Effort-Adjusted Pace</td>
                  <td>{effortResults.effort_pace_per_km}/km</td>
                </tr>
                <tr>
                  <td>KM-Effort per Hour</td>
                  <td>{effortResults.km_effort_per_hour} km</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      {/if}
      
      <div class="mt-4 text-sm text-gray-600">
        <p>Note: KM-Effort calculations help compare runs with different elevation profiles. For example, a flat 10km run requires similar effort to an 8km run with 200m of elevation gain.</p>
      </div>
    </div>
  {/if}
</div>