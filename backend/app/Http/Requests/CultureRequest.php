<?php

namespace App\Http\Requests;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class CultureRequest extends FormRequest
{
    private const CROP_CYCLES = [
        'tomate' => 14,
        'piment' => 12,
        'oignon' => 12,
        'laitue' => 8,
        'mais' => 14,
        'carotte' => 12,
    ];

    private const CROP_LABELS = [
        'tomate' => 'Tomates',
        'piment' => 'Piments',
        'oignon' => 'Oignons',
        'laitue' => 'Laitues',
        'mais' => 'Maïs',
        'carotte' => 'Carottes',
    ];

    public function rules(): array
    {
        return [
            'parcelle_id' => ['required', 'exists:parcelles,id'],
            'type_culture' => ['required', 'in:tomate,piment,oignon,laitue,mais,carotte'],
            'date_semis' => ['required', 'date_format:d/m/Y'],
            'superficie_m2' => ['nullable', 'numeric', 'min:1', 'max:100000', 'decimal:0,2'],
        ];
    }

    public function messages(): array
    {
        return [
            'type_culture.required' => 'Veuillez sélectionner une culture',
            'type_culture.in' => 'Veuillez sélectionner une culture',
            'date_semis.required' => 'Veuillez entrer une date de semis valide',
            'date_semis.date_format' => 'Veuillez entrer une date de semis valide',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $culture = (string) $this->input('type_culture');
            $dateValue = (string) $this->input('date_semis');

            if (! array_key_exists($culture, self::CROP_CYCLES) || $validator->errors()->has('date_semis')) {
                return;
            }

            $dateSemis = Carbon::createFromFormat('d/m/Y', $dateValue);

            if (! $dateSemis || $dateSemis->format('d/m/Y') !== $dateValue) {
                $validator->errors()->add('date_semis', 'Veuillez entrer une date de semis valide');
                return;
            }

            $today = now()->startOfDay();
            $futureLimit = $today->copy()->addDays(7);
            if ($dateSemis->startOfDay()->greaterThan($futureLimit)) {
                $validator->errors()->add('date_semis', 'La date de semis ne peut pas être dans le futur de plus de 7 jours');
                return;
            }

            $limit = $today->copy()->subWeeks(self::CROP_CYCLES[$culture]);
            if ($dateSemis->lessThan($limit)) {
                $label = self::CROP_LABELS[$culture];
                $validator->errors()->add(
                    'date_semis',
                    "D'après cette date vos {$label} seraient déjà récoltées. Veuillez entrer une date de semis correcte. Date limite acceptable : {$limit->format('d/m/Y')}."
                );
            }
        });
    }

    public static function cycleWeeksFor(string $culture): int
    {
        return self::CROP_CYCLES[$culture] ?? 12;
    }
}
