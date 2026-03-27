<?php

namespace App\Filament\Widgets;

use App\Models\PageSection;
use Filament\Tables;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class PageContentUpdatesWidget extends BaseWidget
{
    protected static ?int $sort = 3;

    protected int | string | array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        return $table
            ->query(PageSection::query()->latest('updated_at')->limit(8))
            ->columns([
                TextColumn::make('page')
                    ->label('Page')
                    ->badge()
                    ->color('info'),
                TextColumn::make('section_name')
                    ->label('Section')
                    ->searchable(),
                TextColumn::make('title')
                    ->label('Title')
                    ->searchable(),
                ImageColumn::make('image')
                    ->label('Image')
                    ->square()
                    ->toggleable(),
                IconColumn::make('is_active')
                    ->label('Active')
                    ->boolean(),
                TextColumn::make('updated_at')
                    ->label('Updated')
                    ->dateTime('M d, Y H:i'),
            ])
            ->paginated(false);
    }

    public static function canView(): bool
    {
        return true;
    }
}
