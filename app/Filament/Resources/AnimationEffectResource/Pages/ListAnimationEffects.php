<?php

namespace App\Filament\Resources\AnimationEffectResource\Pages;

use App\Filament\Resources\AnimationEffectResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListAnimationEffects extends ListRecords
{
    protected static string $resource = AnimationEffectResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
