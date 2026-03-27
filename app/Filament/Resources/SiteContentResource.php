<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SiteContentResource\Pages;
use App\Models\SiteContent;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class SiteContentResource extends Resource
{
    protected static ?string $model = SiteContent::class;

    protected static ?string $navigationIcon = 'heroicon-o-document-text';

    protected static ?string $navigationLabel = 'Site Content';

    protected static ?string $recordTitleAttribute = 'key';

    protected static ?string $navigationGroup = 'Content Management';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Content Settings')
                    ->description('Manage global website content and settings')
                    ->schema([
                        Forms\Components\TextInput::make('key')
                            ->label('Key')
                            ->required()
                            ->unique(SiteContent::class, 'key', ignoreRecord: true)
                            ->maxLength(255)
                            ->helperText('Unique identifier for this content (e.g., site_title, navigation_home)')
                            ->columnSpanFull(),

                        Forms\Components\Select::make('type')
                            ->label('Content Type')
                            ->options([
                                'text' => 'Text',
                                'textarea' => 'Textarea',
                                'image' => 'Image',
                            ])
                            ->required()
                            ->reactive()
                            ->columnSpanFull(),

                        Forms\Components\TextInput::make('value')
                            ->label('Value')
                            ->visible(fn (Forms\Get $get) => $get('type') === 'text')
                            ->maxLength(500)
                            ->columnSpanFull(),

                        Forms\Components\Textarea::make('value')
                            ->label('Value')
                            ->visible(fn (Forms\Get $get) => $get('type') === 'textarea')
                            ->rows(6)
                            ->columnSpanFull(),

                        Forms\Components\FileUpload::make('value')
                            ->label('Image')
                            ->visible(fn (Forms\Get $get) => $get('type') === 'image')
                            ->image()
                            ->directory('site-content')
                            ->imageEditor()
                            ->columnSpanFull(),

                        Forms\Components\Textarea::make('description')
                            ->label('Description / Notes')
                            ->rows(3)
                            ->nullable()
                            ->columnSpanFull()
                            ->helperText('Internal notes about this content item'),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('key')
                    ->label('Key')
                    ->searchable()
                    ->sortable()
                    ->fontFamily('mono'),
                Tables\Columns\TextColumn::make('type')
                    ->label('Type')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'text' => 'blue',
                        'textarea' => 'purple',
                        'image' => 'green',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('value')
                    ->label('Value')
                    ->limit(50)
                    ->searchable(),
                Tables\Columns\ImageColumn::make('value')
                    ->label('Image')
                    ->visible(fn (SiteContent $record) => $record->type === 'image'),
                Tables\Columns\TextColumn::make('updated_at')
                    ->label('Updated')
                    ->dateTime()
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('type')
                    ->label('Type')
                    ->options([
                        'text' => 'Text',
                        'textarea' => 'Textarea',
                        'image' => 'Image',
                    ]),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
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
            'index' => Pages\ListSiteContents::route('/'),
            'create' => Pages\CreateSiteContent::route('/create'),
            'edit' => Pages\EditSiteContent::route('/{record}/edit'),
        ];
    }
}
