<script>
  import { frielCalculate, timeToSeconds, formatPace } from '$lib/calculatorUtils';
  
  // Form data with reactive state
  let formData = $state({
    ltPaceMinutes: '',
    ltPaceSeconds: '',
    lactateThresholdHr: '',
    functionalThresholdPower: ''
  });
  
  // Results storage
  let zonesResult = $state(null);
  let loading = $state(false);
  let error = $state(null);
  
  // Calculate training zones based on inputs
  function calculateZones() {
    loading = true;
    error = null;
    
    try {
      // At least one of LT pace, LTHR, or FTP must be provided
      if ((formData.ltPaceMinutes === '' && formData.ltPaceSeconds === '') &&
          formData.lactateThresholdHr === '' && 
          formData.functionalThresholdPower === '') {
        throw new Error('Please provide at least one of the threshold values');
      }
      
      // Process LT pace input
      let ltPaceSeconds = null;
      if (formData.ltPaceMinutes !== '' || formData.ltPaceSeconds !== '') {
        const minutes = formData.ltPaceMinutes ? parseInt(formData.ltPaceMinutes, 10) : 0;
        const seconds = formData.ltPaceSeconds ? parseInt(formData.ltPaceSeconds, 10) : 0;
        
        if (minutes === 0 && seconds === 0) {
          throw new Error('Lactate threshold pace cannot be zero');
        }
        
        ltPaceSeconds = minutes * 60 + seconds;
      }
      
      // Process LTHR input
      let lthr = null;
      if (formData.lactateThresholdHr !== '') {
        lthr = parseInt(formData.lactateThresholdHr, 10);
        if (isNaN(lthr) || lthr < 100 || lthr > 220) {
          throw new Error('Please enter a valid LTHR between 100 and 220');
        }
      }
      
      // Process FTP input
      let ftp = null;
      if (formData.functionalThresholdPower !== '') {
        ftp = parseInt(formData.functionalThresholdPower, 10);
        if (isNaN(ftp) || ftp < 50) {
          throw new Error('Please enter a valid FTP (minimum 50 watts)');
        }
      }
      
      // Calculate zones using the calculatorUtils function
      zonesResult = frielCalculate(lthr, ftp, ltPaceSeconds);
      
    } catch (err) {
      error = err.message;
      zonesResult = null;
    } finally {
      loading = false;
    }
  }
</script>

<div class="bg-white shadow-md rounded-lg p-6">
  <h1 class="text-xl font-bold mb-4">Friel Training Zones Calculator</h1>
  <p class="mb-4 text-gray-600">Calculate training zones based on Joe Friel's methodology by entering at least one threshold value.</p>
  
  <div class="grid md:grid-cols-2 gap-6">
    <!-- Left column: Input form -->
    <div>
      <div class="mb-4">
        <label for="lactateThresholdHr" class="block text-gray-700 mb-2">Lactate Threshold Heart Rate (LTHR)</label>
        <input
          type="number"
          id="lactateThresholdHr"
          bind:value={formData.lactateThresholdHr}
          min="100"
          max="220"
          placeholder="Enter LTHR in bpm"
          class="w-full p-2 border rounded"
        />
      </div>
      
      <div class="mb-4">
        <label for="functionalThresholdPower" class="block text-gray-700 mb-2">Functional Threshold Power (FTP)</label>
        <input
          type="number"
          id="functionalThresholdPower"
          bind:value={formData.functionalThresholdPower}
          min="50"
          placeholder="Enter FTP in watts"
          class="w-full p-2 border rounded"
        />
      </div>
      
      <div class="mb-4">
        <label class="block text-gray-700 mb-2">Lactate Threshold Pace (per km)</label>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-gray-600">Minutes</label>
            <input
              type="number"
              bind:value={formData.ltPaceMinutes}
              min="0" 
              placeholder="MM"
              class="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-600">Seconds</label>
            <input
              type="number"
              bind:value={formData.ltPaceSeconds}
              min="0"
              max="59"
              placeholder="SS"
              class="w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>
      
      <button
        class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
        on:click={calculateZones}
        disabled={loading}
      >
        {loading ? 'Calculating...' : 'Calculate Zones'}
      </button>
      
      {#if error}
        <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4" role="alert">
          <p>{error}</p>
        </div>
      {/if}
    </div>
    
    <!-- Right column: Results -->
    <div>
      {#if zonesResult}
        <div>
          <!-- Heart Rate Zones -->
          {#if zonesResult.hr_zones}
            <div class="mb-6">
              <h2 class="font-bold text-lg">Heart Rate Zones (LTHR: {zonesResult.lthr} bpm)</h2>
              <div class="overflow-x-auto mt-2">
                <table class="min-w-full bg-white border">
                  <thead>
                    <tr>
                      <th class="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left">Zone</th>
                      <th class="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left">Range (bpm)</th>
                      <th class="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each Object.entries(zonesResult.hr_zones) as [zone, data]}
                      <tr>
                        <td class="py-2 px-4 border-b border-gray-200">{zone.replace('zone', 'Zone ')}</td>
                        <td class="py-2 px-4 border-b border-gray-200">{data.min} - {data.max}</td>
                        <td class="py-2 px-4 border-b border-gray-200">{data.description}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
          {/if}
          
          <!-- Power Zones -->
          {#if zonesResult.power_zones}
            <div class="mb-6">
              <h2 class="font-bold text-lg">Power Zones (FTP: {zonesResult.ftp} watts)</h2>
              <div class="overflow-x-auto mt-2">
                <table class="min-w-full bg-white border">
                  <thead>
                    <tr>
                      <th class="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left">Zone</th>
                      <th class="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left">Range (watts)</th>
                      <th class="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each Object.entries(zonesResult.power_zones) as [zone, data]}
                      <tr>
                        <td class="py-2 px-4 border-b border-gray-200">{zone.replace('zone', 'Zone ')}</td>
                        <td class="py-2 px-4 border-b border-gray-200">
                          {#if data.min && data.max}
                            {data.min} - {data.max}
                          {:else if data.note}
                            {data.note}
                          {/if}
                        </td>
                        <td class="py-2 px-4 border-b border-gray-200">{data.description}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
          {/if}
          
          <!-- Pace Zones -->
          {#if zonesResult.pace_zones}
            <div class="mb-6">
              <h2 class="font-bold text-lg">Pace Zones (LT pace: {zonesResult.lt_pace} min/km)</h2>
              <div class="overflow-x-auto mt-2">
                <table class="min-w-full bg-white border">
                  <thead>
                    <tr>
                      <th class="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left">Zone</th>
                      <th class="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left">Range (min/km)</th>
                      <th class="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each Object.entries(zonesResult.pace_zones) as [zone, data]}
                      <tr>
                        <td class="py-2 px-4 border-b border-gray-200">{zone.replace('zone', 'Zone ')}</td>
                        <td class="py-2 px-4 border-b border-gray-200">
                          {#if data.min && data.max}
                            {data.min} - {data.max}
                          {:else if data.note}
                            {data.note}
                          {/if}
                        </td>
                        <td class="py-2 px-4 border-b border-gray-200">{data.description}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
          {/if}
        </div>
      {:else}
        <div class="bg-gray-100 p-6 rounded-lg text-center text-gray-500">
          <p>Enter at least one threshold value to calculate your training zones.</p>
        </div>
      {/if}
    </div>
  </div>
</div>