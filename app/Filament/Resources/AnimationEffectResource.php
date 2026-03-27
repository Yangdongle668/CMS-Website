<?php

namespace App\Filament\Resources;

use App\Filament\Resources\AnimationEffectResource\Pages;
use App\Models\AnimationEffect;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class AnimationEffectResource extends Resource
{
    protected static ?string $model = AnimationEffect::class;

    protected static ?string $navigationIcon = 'heroicon-o-sparkles';

    protected static ?string $navigationLabel = 'Animation Effects';

    protected static ?string $recordTitleAttribute = 'target_element';

    protected static ?string $navigationGroup = 'Content Management';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Animation Configuration')
                    ->description('Configure animation effects for page elements')
                    ->schema([
                        Forms\Components\TextInput::make('target_element')
                            ->label('Target Element')
                            ->required()
                            ->placeholder('e.g., hero-section, feature-card, testimonial')
                            ->maxLength(255)
                            ->helperText('CSS class or element ID to apply animation to'),

                        Forms\Components\Select::make('effect_type')
                            ->label('Animation Type')
                            ->required()
                            ->options(AnimationEffect::ANIMATION_TYPES)
                            ->native(false),

                        Forms\Components\TextInput::make('duration')
                            ->label('Duration (ms)')
                            ->required()
                            ->numeric()
                            ->default(1000)
                            ->minValue(100)
                            ->maxValue(10000)
                            ->step(100)
                            ->helperText('Animation duration in milliseconds (100-10000)'),

                        Forms\Components\TextInput::make('delay')
                            ->label('Delay (ms)')
                            ->numeric()
                            ->default(0)
                            ->minValue(0)
                            ->maxValue(5000)
                            ->step(100)
                            ->helperText('Delay before animation starts (0-5000)'),

                        Forms\Components\Toggle::make('is_active')
                            ->label('Is Active')
                            ->default(true)
                            ->inline(),
                    ])->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('target_element')
                    ->label('Target Element')
                    ->searchable()
                    ->sortable()
                    ->fontFamily('mono'),
                Tables\Columns\TextColumn::make('effect_type')
                    ->label('Effect Type')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'fadeIn' => 'blue',
                        'slideInUp', 'slideInDown', 'slideInLeft', 'slideInRight' => 'purple',
                        'scaleIn' => 'green',
                        'pulse' => 'yellow',
                        'bounce' => 'orange',
                        'glow' => 'pink',
                        default => 'gray',
                    })
                    ->sortable(),
                Tables\Columns\TextColumn::make('duration')
                    ->label('Duration')
                    ->formatStateUsing(fn (int $state) => "{$state}ms")
                    ->sortable(),
                Tables\Columns\TextColumn::make('delay')
                    ->label('Delay')
                    ->formatStateUsing(fn (int $state) => "{$state}ms")
                    ->sortable()
                    ->toggleable(),
                Tables\Columns\IconColumn::make('is_active')
                    ->label('Active')
                    ->boolean()
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Created')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('effect_type')
                    ->label('Effect Type')
                    ->options(AnimationEffect::ANIMATION_TYPES),
                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('Status')
                    ->queries(
                        true: fn (Builder $query) => $query->where('is_active', true),
                        false: fn (Builder $query) => $query->where('is_active', false),
                    ),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\BulkAction::make('activate')
                        ->label('Activate')
                        ->icon('heroicon-m-check-circle')
                        ->action(fn (Collection $records) => $records->each->update(['is_active' => true]))
                        ->deselectRecordsAfterCompletion(),
                    Tables\Actions\BulkAction::make('deactivate')
                        ->label('Deactivate')
                        ->icon('heroicon-m-x-circle')
                        ->action(fn (Collection $records) => $records->each->update(['is_active' => false]))
                        ->deselectRecordsAfterCompletion(),
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListAnimationEffects::route('/'),
            'create' => Pages\CreateAnimationEffect::route('/create'),
            'edit' => Pages\EditAnimationEffect::route('/{record}/edit'),
        ];
    }
}
