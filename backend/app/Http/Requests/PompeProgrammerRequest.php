<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PompeProgrammerRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'parcelle_id' => $this->route('parcelle_id'),
        ]);
    }

    public function authorize(): bool
    {
        return $this->user()->parcelles()->where('id', $this->input('parcelle_id'))->exists();
    }

    public function rules(): array
    {
        return [
            'parcelle_id' => ['required', 'exists:parcelles,id'],
            'duree_minutes' => ['required', 'numeric', 'min:0.01', 'max:240'],
            'volume_litres' => ['nullable', 'numeric', 'min:1'],
            'heure_programmee' => ['required', 'date_format:Y-m-d H:i:s', 'after:now'],
        ];
    }
}
