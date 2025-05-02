<script>  
  import { onMount } from 'svelte';
  
  // Reuse the same calculator categories from the layout
  const calculatorCategories = [
    {
      title: "Pace Training Calculators",
      items: [
        { href: '/mcmillan-calculator', label: 'McMillan Running Calculator' },
        { href: '/humphrey-calculator', label: 'Humphrey Running Calculator' },
        { href: '/vdot-calculator', label: 'VDOT Calculator' },
        { href: '/tinman-calculator', label: 'Tinman Calculator' }
      ]
    },
    {
      title: "Training Zone Calculators",
      items: [
        { href: '/eighty-twenty-calculator', label: '80/20 Endurance Zone Calculator' },
        { href: '/friel-calculator', label: 'Joe Friel Training Zone Calculator' }
      ]
    },
    {
      title: "Advanced Analysis Tools",
      items: [
        { href: '/km-effort-calculator', label: 'KM-Effort Calculator' },
        { href: '/gpx-elevation-calculator', label: 'GPX Elevation Gain Calculator' },
        { href: 'https://gpx.studio', label: 'GPX Analytic & Building Tools', external: true }
      ]
    }
  ];

  // Map routes to component paths for dynamic loading
  const calculatorComponentMap = {
    '/mcmillan-calculator': () => import('../lib/components/calculators/McMillanCalculator.svelte'),
    '/humphrey-calculator': () => import('../lib/components/calculators/HumphreyCalculator.svelte'),
    '/vdot-calculator': () => import('../lib/components/calculators/VdotCalculator.svelte'),
    '/tinman-calculator': () => import('../lib/components/calculators/TinmanCalculator.svelte'),
    '/eighty-twenty-calculator': () => import('../lib/components/calculators/EightyTwentyCalculator.svelte'),
    '/friel-calculator': () => import('../lib/components/calculators/FrielCalculator.svelte'),
    '/km-effort-calculator': () => import('../lib/components/calculators/KmEffortCalculator.svelte'),
    '/gpx-elevation-calculator': () => import('../lib/components/calculators/GpxElevationCalculator.svelte'),
  };

  let selectedCalculator = null;
  let loading = false;
  let calculatorComponent = null;
  let calculatorError = null;

  async function setSelectedCalculator(href) {
    loading = true;
    calculatorError = null;
    calculatorComponent = null;
    
    try {
      // Check if we have a component mapping for this route
      if (calculatorComponentMap[href]) {
        // Dynamically import the component
        const module = await calculatorComponentMap[href]();
        calculatorComponent = module.default;
        selectedCalculator = href;
      } else {
        throw new Error(`No component found for calculator: ${href}`);
      }
    } catch (error) {
      console.error(`Error loading calculator component: ${error.message}`);
      calculatorError = `Failed to load calculator: ${error.message}`;
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    // Optional: Check URL for initial calculator to load
    const path = window.location.pathname;
    if (calculatorComponentMap[path]) {
      setSelectedCalculator(path);
    }
  });
</script>

<svelte:head>
  <title>Running Calculator Utilities - OlahRogo</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-2xl font-bold mb-6">Running Calculator Utilities</h1>
  
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each calculatorCategories as category}
      <div class="bg-white shadow-md rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">{category.title}</h2>
        <ul class="space-y-2">
          {#each category.items as item}
            <li>
              {#if item.external}
                <a href={item.href}
                   target="_blank" 
                   rel="noopener noreferrer" 
                   class="text-blue-500 hover:text-blue-700">
                  {item.label}
                </a>
              {:else}
                <a href={item.href}
                   class="text-blue-500 hover:text-blue-700"
                   on:click|preventDefault={() => setSelectedCalculator(item.href)}>
                  {item.label}
                </a>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </div>
  
  <!-- Loading indicator -->
  {#if loading}
    <div class="flex justify-center my-4">
      <svg class="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  {/if}
  
  <!-- Container for calculator content -->
  {#if calculatorComponent && !loading}
    <div class="mt-8 bg-white shadow-md rounded-lg p-6">
      <svelte:component this={calculatorComponent} />
    </div>
  {/if}

  <!-- Error message -->
  {#if calculatorError}
    <div class="mt-4 text-red-500">
      {calculatorError}
    </div>
  {/if}
</div>
