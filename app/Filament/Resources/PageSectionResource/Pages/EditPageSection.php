<?php

namespace App\Filament\Resources\PageSectionResource\Pages;

use App\Filament\Resources\PageSectionResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditPageSection extends EditRecord
{
    protected static string $resource = PageSectionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
