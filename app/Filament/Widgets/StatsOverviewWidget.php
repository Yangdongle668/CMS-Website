<?php

namespace App\Filament\Widgets;

use App\Models\AnimationEffect;
use App\Models\PageSection;
use App\Models\Product;
use App\Models\SiteContent;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class StatsOverviewWidget extends BaseWidget
{
    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        return [
            Stat::make('Total Products', Product::count())
                ->description('Active product listings')
                ->icon('heroicon-o-cube')
                ->color('info'),
            Stat::make('Page Sections', PageSection::count())
                ->description('Managed page sections')
                ->icon('heroicon-o-squares-2x2')
                ->color('success'),
            Stat::make('Site Content Items', SiteContent::count())
                ->description('Global site content')
                ->icon('heroicon-o-document-text')
                ->color('warning'),
            Stat::make('Animation Effects', AnimationEffect::count())
                ->description('Active animations')
                ->icon('heroicon-o-sparkles')
                ->color('danger'),
        ];
    }
}
