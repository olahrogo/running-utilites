<script>
  import { mcmillanCalculate, mcmillanDistanceOptions, timeToSeconds } from '$lib/calculatorUtils';
  
  // Define state for form data
  let formData = $state({
    raceDistance: '5k', // Default to 5k
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  let calculatedPaces = $state(null);
  let errorMessage = $state('');
  
  function calculatePaces() {
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
      
      // Use the existing mcmillanCalculate function from calculatorUtils.ts
      calculatedPaces = mcmillanCalculate(formData.raceDistance, totalSeconds);
      errorMessage = '';
    } catch (error) {
      errorMessage = `Error calculating paces: ${error.message}`;
      calculatedPaces = null;
    }
  }
</script>

<div class="bg-white shadow-md rounded-lg p-6">
  <h1 class="text-xl font-bold mb-4">McMillan Running Calculator</h1>
  <p class="mb-4 text-gray-600">Calculate equivalent race times and training paces based on your race performance.</p>
    
  <div class="mb-4">
    <label class="block text-gray-700 mb-2">Race Distance</label>
    <select bind:value={formData.raceDistance} class="w-full p-2 border rounded">
      {#each mcmillanDistanceOptions as option}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
  </div>
  
  <div class="mb-4">
    <label class="block text-gray-700 mb-2">Race Time</label>
    <div class="grid grid-cols-3 gap-4">
      <div>
        <label class="block text-sm text-gray-600">Hours</label>
        <input type="number" bind:value={formData.hours} class="w-full p-2 border rounded" min="0" placeholder="HH" />
      </div>
      <div>
        <label class="block text-sm text-gray-600">Minutes</label>
        <input type="number" bind:value={formData.minutes} class="w-full p-2 border rounded" min="0" max="59" placeholder="MM" />
      </div>
      <div>
        <label class="block text-sm text-gray-600">Seconds</label>
        <input type="number" bind:value={formData.seconds} class="w-full p-2 border rounded" min="0" max="59" placeholder="SS" />
      </div>
    </div>
  </div>
    
  <button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded" on:click={calculatePaces}>
    Calculate Paces
  </button>
    
  {#if errorMessage}
    <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4" role="alert">
      <p>{errorMessage}</p>
    </div>
  {/if}
    
  {#if calculatedPaces}
    <div class="mt-6">
      <h2 class="text-lg font-bold">Results</h2>
      
      <div class="mt-4">
        <h3 class="font-bold">Race Pace</h3>
        <p class="text-gray-700">{calculatedPaces.pace_per_km} per km</p>
      </div>
      
      <div class="mt-4">
        <h3 class="font-bold">Equivalent Race Times</h3>
        <div class="overflow-x-auto mt-2">
          <table class="min-w-full bg-white border">
            <thead>
              <tr>
                <th class="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left">Distance</th>
                <th class="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left">Predicted Time</th>
              </tr>
            </thead>
            <tbody>
              {#each Object.entries(calculatedPaces.equivalent_races) as [distance, time]}
                <tr>
                  <td class="py-2 px-4 border-b border-gray-200">
                    {mcmillanDistanceOptions.find(option => option.value === distance)?.label || distance}
                  </td>
                  <td class="py-2 px-4 border-b border-gray-200">{time}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="mt-4">
        <h3 class="font-bold">Training Paces (per km)</h3>
        <div class="overflow-x-auto mt-2">
          <table class="min-w-full bg-white border">
            <thead>
              <tr>
                <th class="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left">Training Type</th>
                <th class="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left">Pace Range</th>
              </tr>
            </thead>
            <tbody>
              {#each Object.entries(calculatedPaces.training_paces) as [type, range]}
                <tr>
                  <td class="py-2 px-4 border-b border-gray-200">
                    {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </td>
                  <td class="py-2 px-4 border-b border-gray-200">{range.min} - {range.max}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  {/if}
</div>