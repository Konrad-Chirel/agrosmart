<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PompeDemarrerRequest extends FormRequest
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
            'duree_minutes' => ['nullable', 'numeric', 'min:0.01', 'max:1440'],
            'volume_litres' => ['nullable', 'numeric', 'min:1'],
        ];
    }
}
