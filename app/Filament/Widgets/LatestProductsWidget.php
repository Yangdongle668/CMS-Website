<?php

namespace App\Filament\Widgets;

use App\Models\Product;
use Filament\Tables;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class LatestProductsWidget extends BaseWidget
{
    protected static ?int $sort = 2;

    protected int | string | array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        return $table
            ->query(Product::query()->latest()->limit(5))
            ->columns([
                ImageColumn::make('image')
                    ->label('Image')
                    ->square(),
                TextColumn::make('name')
                    ->label('Product Name')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('model')
                    ->label('Model')
                    ->searchable(),
                TextColumn::make('capacity')
                    ->label('Capacity (mAh)')
                    ->numeric(),
                TextColumn::make('created_at')
                    ->label('Created')
                    ->dateTime('M d, Y'),
            ])
            ->paginated(false);
    }

    public static function canView(): bool
    {
        return true;
    }
}
