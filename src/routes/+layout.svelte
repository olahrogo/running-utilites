<script>
  import '../app.css';
  
</script>

<div class="min-h-screen flex flex-col bg-gray-100">
  <!-- Header/Navbar -->
  <header class="bg-primary text-white shadow">
    <div class="container mx-auto px-4 py-6">
        <div class="flex justify-between items-center">
            <h1 class="text-3xl font-bold">
                <a href="/">Olahrogo</a>
            </h1>
        </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-grow container mx-auto px-4 py-8">
    <slot />
  </main>

  <!-- Footer -->
  <footer class="footer footer-center p-4 bg-primary text-white">
    <div>
      <p>Copyright © {new Date().getFullYear()} - Olahrogo</p>
      <div class="flex gap-3 justify-center">
        <a href="https://utas.me/barebearfoot-gan" class="underline hover:text-secondary">Contact Us</a>
      </div>
    </div>
  </footer>
</div>
