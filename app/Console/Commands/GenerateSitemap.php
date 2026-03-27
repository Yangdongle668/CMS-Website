<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;

class GenerateSitemap extends Command
{
    protected $signature = 'sitemap:generate';
    protected $description = 'Generate XML sitemap for SEO';

    public function handle()
    {
        $xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
        $xml .= "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n";

        // Static pages
        $staticPages = [
            '/' => 'weekly',
            '/products' => 'weekly',
            '/about' => 'monthly',
            '/contact' => 'monthly',
            '/privacy' => 'yearly',
            '/cookies' => 'yearly',
        ];

        foreach ($staticPages as $url => $changefreq) {
            $xml .= $this->urlEntry(url($url), $changefreq);
        }

        // Product pages
        $products = Product::all();
        foreach ($products as $product) {
            $xml .= $this->urlEntry(
                route('products.show', $product->slug),
                'monthly',
                $product->updated_at
            );
        }

        $xml .= "</urlset>";

        file_put_contents(public_path('sitemap.xml'), $xml);
        $this->info('Sitemap generated successfully!');
    }

    private function urlEntry($url, $changefreq, $lastmod = null)
    {
        $entry = "  <url>\n";
        $entry .= "    <loc>" . htmlspecialchars($url) . "</loc>\n";
        if ($lastmod) {
            $entry .= "    <lastmod>" . $lastmod->toDateString() . "</lastmod>\n";
        }
        $entry .= "    <changefreq>" . $changefreq . "</changefreq>\n";
        $entry .= "    <priority>0.8</priority>\n";
        $entry .= "  </url>\n";
        return $entry;
    }
}
