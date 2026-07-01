<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ParcelleRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'nom_parcelle' => ['required', 'string', 'max:150'],
            'superficie_m2' => ['required', 'numeric'],
            'latitude' => ['required', 'numeric'],
            'longitude' => ['required', 'numeric'],
        ];
    }

    public function messages(): array
    {
        return [
            'superficie_m2.required' => 'Veuillez entrer une superficie valide',
            'superficie_m2.numeric' => 'Veuillez entrer une superficie valide',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $raw = $this->input('superficie_m2');

            if ($validator->errors()->has('superficie_m2')) {
                return;
            }

            if (! is_numeric($raw)) {
                $validator->errors()->add('superficie_m2', 'Veuillez entrer une superficie valide');
                return;
            }

            $surface = (float) $raw;
            if ($surface <= 0 || $surface < 1) {
                $validator->errors()->add('superficie_m2', 'La superficie doit être supérieure à 0');
                return;
            }

            if (! preg_match('/^\d+(\.\d{1,2})?$/', (string) $raw)) {
                $validator->errors()->add('superficie_m2', 'Veuillez entrer une superficie valide');
                return;
            }

            if ($surface > 100000) {
                $validator->errors()->add('superficie_m2', 'La superficie semble trop grande. Vérifiez la valeur saisie.');
            }
        });
    }
}
