<div id="cookie-banner" class="hidden fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 shadow-lg z-50">
    <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="flex-1">
            <p class="text-sm">
                We use cookies to enhance your experience. By clicking "Accept All Cookies", you agree to the storing of cookies on your device to enhance site navigation, analyze site usage, and assist in our marketing efforts.
                <a href="/cookies" class="underline hover:text-blue-200">Learn more</a>
            </p>
        </div>
        <div class="flex gap-3 flex-shrink-0">
            <button id="cookie-reject" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-semibold transition">
                Reject
            </button>
            <button id="cookie-accept" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-semibold transition">
                Accept All Cookies
            </button>
        </div>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        const banner = document.getElementById('cookie-banner');
        const cookieConsent = localStorage.getItem('cookieConsent');

        // Show banner if consent not given
        if (!cookieConsent) {
            banner.classList.remove('hidden');
        }

        // Accept button
        document.getElementById('cookie-accept').addEventListener('click', function() {
            localStorage.setItem('cookieConsent', 'accepted');
            banner.classList.add('hidden');
            // Load analytics or other tracking scripts here
        });

        // Reject button
        document.getElementById('cookie-reject').addEventListener('click', function() {
            localStorage.setItem('cookieConsent', 'rejected');
            banner.classList.add('hidden');
        });
    });
</script>
