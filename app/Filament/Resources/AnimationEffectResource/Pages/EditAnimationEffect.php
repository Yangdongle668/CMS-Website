<?php

namespace App\Filament\Resources\AnimationEffectResource\Pages;

use App\Filament\Resources\AnimationEffectResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditAnimationEffect extends EditRecord
{
    protected static string $resource = AnimationEffectResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
