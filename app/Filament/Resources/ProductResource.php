<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ProductResource\Pages;
use App\Filament\Resources\ProductResource\RelationManagers;
use App\Models\Product;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class ProductResource extends Resource
{
    protected static ?string $model = Product::class;

    protected static ?string $navigationIcon = 'heroicon-o-cube';

    protected static ?string $navigationLabel = 'Products';

    protected static ?string $recordTitleAttribute = 'name';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Basic Information')
                    ->schema([
                        Forms\Components\TextInput::make('name')
                            ->label('Product Name')
                            ->required()
                            ->maxLength(255),
                        Forms\Components\TextInput::make('model')
                            ->label('Model')
                            ->maxLength(255),
                        Forms\Components\TextInput::make('capacity')
                            ->label('Capacity (mAh)')
                            ->numeric(),
                        Forms\Components\TextInput::make('voltage')
                            ->label('Voltage (V)')
                            ->numeric()
                            ->step(0.1),
                        Forms\Components\TextInput::make('size')
                            ->label('Size')
                            ->maxLength(255),
                        Forms\Components\Textarea::make('description')
                            ->label('Description')
                            ->columnSpanFull(),
                        Forms\Components\FileUpload::make('image')
                            ->label('Product Image')
                            ->image()
                            ->directory('products')
                            ->imageEditor(),
                    ])->columns(2),

                Forms\Components\Section::make('聚合物电池技术参数')
                    ->schema([
                        Forms\Components\Select::make('process_type')
                            ->label('工艺类型')
                            ->options([
                                'wound' => '卷绕工艺 (成本低、交期快)',
                                'stacked' => '叠片工艺 (低内阻、循环强)',
                            ])
                            ->placeholder('选择工艺类型'),
                        Forms\Components\TextInput::make('capacity_min')
                            ->label('最小容量 (mAh)')
                            ->numeric(),
                        Forms\Components\TextInput::make('capacity_max')
                            ->label('最大容量 (mAh)')
                            ->numeric(),
                        Forms\Components\TextInput::make('internal_resistance')
                            ->label('内阻 (mΩ)')
                            ->numeric()
                            ->step(0.01),
                        Forms\Components\TextInput::make('cycle_life')
                            ->label('循环寿命')
                            ->placeholder('例: >1000'),
                        Forms\Components\TextInput::make('energy_density')
                            ->label('能量密度')
                            ->placeholder('例: 200+ Wh/L'),
                        Forms\Components\TextInput::make('operating_temperature')
                            ->label('工作温度范围')
                            ->placeholder('例: -20°C ~ 60°C'),
                        Forms\Components\TextInput::make('weight')
                            ->label('重量')
                            ->placeholder('例: 10g'),
                    ])->columns(2),

                Forms\Components\Section::make('应用与定制')
                    ->schema([
                        Forms\Components\Textarea::make('applications')
                            ->label('应用领域')
                            ->placeholder('例: 智能手表、医疗设备、可穿戴设备'),
                        Forms\Components\Textarea::make('highlights')
                            ->label('核心亮点')
                            ->placeholder('突出该产品的主要优势和特点'),
                        Forms\Components\Textarea::make('customization_info')
                            ->label('定制说明')
                            ->placeholder('描述定制能力、周期、起订量等'),
                        Forms\Components\TextInput::make('certifications')
                            ->label('认证信息')
                            ->placeholder('例: UL、CE、FCC'),
                    ])->columns(1),

                Forms\Components\Section::make('SEO Settings')
                    ->schema([
                        Forms\Components\TextInput::make('slug')
                            ->label('URL Slug')
                            ->required()
                            ->unique(Product::class, 'slug', ignoreRecord: true)
                            ->maxLength(255)
                            ->helperText('用于SEO友好的URL，如 /products/{slug}'),
                        Forms\Components\TextInput::make('meta_title')
                            ->label('SEO标题')
                            ->maxLength(255)
                            ->helperText('搜索引擎标题（建议50-60字符）'),
                        Forms\Components\Textarea::make('meta_description')
                            ->label('SEO描述')
                            ->maxLength(160)
                            ->helperText('搜索引擎描述（建议150-160字符）'),
                    ])->columns(1),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Product Name')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('model')
                    ->label('Model')
                    ->searchable()
                    ->toggleable(),
                Tables\Columns\TextColumn::make('capacity')
                    ->label('Capacity (mAh)')
                    ->numeric()
                    ->sortable()
                    ->toggleable(),
                Tables\Columns\TextColumn::make('voltage')
                    ->label('Voltage')
                    ->numeric()
                    ->toggleable(),
                Tables\Columns\ImageColumn::make('image')
                    ->label('Image')
                    ->square(),
                Tables\Columns\TextColumn::make('slug')
                    ->label('URL Slug')
                    ->searchable()
                    ->toggleable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Created')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
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
            'index' => Pages\ListProducts::route('/'),
            'create' => Pages\CreateProduct::route('/create'),
            'edit' => Pages\EditProduct::route('/{record}/edit'),
        ];
    }
}
