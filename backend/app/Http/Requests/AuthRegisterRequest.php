<?php

namespace App\Http\Requests;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class AuthRegisterRequest extends FormRequest
{
    private const REGIONS_BENIN = [
        'Cotonou',
        'Porto-Novo',
        'Parakou',
        'Djougou',
        'Abomey-Calavi',
        'Bohicon',
        'Natitingou',
        'Ouidah',
    ];

    public function rules(): array
    {
        return [
            'nom' => ['nullable', 'string', 'max:120'],
            'prenom' => ['required', 'string', 'min:2', 'max:50', 'regex:/^\p{L}+(?:[ -]\p{L}+)*$/u'],
            'telephone' => ['required', 'string', 'max:30', 'unique:users,telephone'],
            'region' => ['required', 'string', 'in:'.implode(',', self::REGIONS_BENIN)],
            'date_naissance' => ['required', 'date_format:d/m/Y'],
            'langue' => ['nullable', 'in:fr,fon,yoruba'],
            'fcm_token' => ['nullable', 'string'],
            'source_donnees' => ['nullable', 'in:simulation,esp32'],
            'password' => ['required', 'string', 'min:6', 'regex:/^(?=.*\p{L})(?=.*\d).+$/u', 'confirmed'],
        ];
    }

    public function messages(): array
    {
        return [
            'prenom.regex' => 'Le prenom ne peut contenir que des lettres, un tiret ou un espace entre les lettres',
            'prenom.min' => 'Le prenom doit contenir au moins 2 lettres',
            'prenom.max' => 'Le prenom ne peut pas depasser 50 caracteres',
            'region.in' => 'Veuillez selectionner une region valide',
            'date_naissance.required' => 'Veuillez entrer une date de naissance valide',
            'date_naissance.date_format' => 'Veuillez entrer une date de naissance valide',
            'password.min' => 'Le mot de passe doit contenir au moins 6 caracteres dont une lettre et un chiffre',
            'password.regex' => 'Le mot de passe doit contenir au moins 6 caracteres dont une lettre et un chiffre',
            'password.confirmed' => 'Les deux mots de passe ne correspondent pas',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $value = $this->input('date_naissance');
            try {
                $date = Carbon::createFromFormat('d/m/Y', (string) $value);
                $validDate = $date && $date->format('d/m/Y') === $value;
            } catch (\Throwable) {
                $validDate = false;
                $date = null;
            }

            if (! $validDate) {
                $validator->errors()->add('date_naissance', 'Veuillez entrer une date de naissance valide');
                return;
            }

            if ($date->isFuture()) {
                $validator->errors()->add('date_naissance', 'La date de naissance ne peut pas etre dans le futur');
                return;
            }

            $age = (int) $date->age;
            if ($age < 18) {
                $validator->errors()->add('date_naissance', 'Vous devez avoir au moins 18 ans pour utiliser cette application');
            }

            if ($age > 90) {
                $validator->errors()->add('date_naissance', 'Veuillez entrer une date de naissance valide');
            }
        });
    }

    protected function passedValidation(): void
    {
        $date = Carbon::createFromFormat('d/m/Y', $this->input('date_naissance'));
        $this->merge([
            'date_naissance' => $date->format('Y-m-d'),
            'nom' => $this->input('nom') ?: '',
        ]);
    }
}
