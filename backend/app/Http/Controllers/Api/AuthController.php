<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AuthLoginRequest;
use App\Http\Requests\AuthRegisterRequest;
use App\Models\User;
use App\Services\ApiResponseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Inscrit un maraicher et retourne un token Sanctum.
     */
    public function register(AuthRegisterRequest $request)
    {
        $data = $request->validated();
        $data['date_naissance'] = $request->date_naissance; // Get the formatted Y-m-d date
        $data['langue'] = $data['langue'] ?? 'fr';
        $data['source_donnees'] = $data['source_donnees'] ?? 'simulation';
        $data['mot_de_passe'] = Hash::make($data['password']);
        // Let the model cast handle the hashing for 'password' column

        $user = User::create($data);
        $token = $user->createToken('react-native')->plainTextToken;

        return ApiResponseService::success('Compte cree avec succes', compact('user', 'token'), 201);
    }

    /**
     * Connecte un utilisateur par telephone et mot de passe.
     */
    public function login(AuthLoginRequest $request)
    {
        $user = User::where('telephone', $request->telephone)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return ApiResponseService::error('Telephone ou mot de passe incorrect', null, 401);
        }

        if ($request->filled('fcm_token')) {
            $user->update(['fcm_token' => $request->fcm_token]);
        }

        $token = $user->createToken('react-native')->plainTextToken;

        return ApiResponseService::success('Connexion reussie', compact('user', 'token'));
    }

    public function getProfile(Request $request)
    {
        return ApiResponseService::success('Profil recupere', ['user' => $request->user()]);
    }

    public function updateProfile(Request $request)
    {
        $request->validate([
            'prenom' => ['nullable', 'string', 'max:50', 'regex:/^[\p{L}\s\-]+$/u'],
            'nom' => ['nullable', 'string', 'max:50', 'regex:/^[\p{L}\s\-]+$/u'],
            'telephone' => ['nullable', 'string', 'regex:/^22901\d{8}$/', 'unique:users,telephone,' . $request->user()->id],
            'password' => ['nullable', 'string', 'min:6'],
        ], [
            'prenom.regex' => 'Le prénom ne peut contenir que des lettres.',
            'nom.regex' => 'Le nom ne peut contenir que des lettres.',
            'telephone.regex' => 'Le numéro de téléphone est invalide.',
            'telephone.unique' => 'Ce numéro de téléphone est déjà utilisé.'
        ]);

        $user = $request->user();
        if ($request->filled('prenom')) {
            $user->prenom = $request->prenom;
        }
        if ($request->filled('nom')) {
            $user->nom = $request->nom;
        }
        if ($request->filled('telephone')) {
            $user->telephone = $request->telephone;
        }
        if ($request->filled('password')) {
            $user->password = $request->password;
            $user->mot_de_passe = \Illuminate\Support\Facades\Hash::make($request->password);
        }
        $user->save();

        return ApiResponseService::success('Profil mis a jour', ['user' => $user]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return ApiResponseService::success('Deconnexion reussie');
    }
}
