<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class MeteoService
{
    /**
     * Recupere les previsions OpenWeatherMap et les garde 30 minutes.
     */
    public function getPrevisionsActuelles(float $lat, float $lon): array
    {
        return Cache::remember($this->cacheKey($lat, $lon), 1800, function () use ($lat, $lon) {
            if (! config('services.openweather.key')) {
                Log::warning('OpenWeatherMap non configure');

                return [
                    'source' => 'openweathermap',
                    'available' => false,
                    'message' => 'Météo indisponible — vérifiez votre connexion',
                    'list' => [],
                ];
            }

            try {
                $response = Http::timeout(20)
                    ->withoutVerifying()
                    ->withOptions(['curl' => [\CURLOPT_IPRESOLVE => \CURL_IPRESOLVE_V4]])
                    ->get('https://api.openweathermap.org/data/2.5/forecast', [
                    'lat' => $lat,
                    'lon' => $lon,
                    'appid' => config('services.openweather.key'),
                    'units' => 'metric',
                    'lang' => 'fr',
                ]);
            } catch (Throwable $error) {
                Log::warning('OpenWeatherMap erreur reseau', [
                    'message' => $error->getMessage(),
                ]);

                return [
                    'source' => 'openweathermap',
                    'available' => false,
                    'message' => 'Météo indisponible — vérifiez votre connexion',
                    'list' => [],
                ];
            }

            if (! $response->successful()) {
                Log::warning('OpenWeatherMap indisponible', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [
                    'source' => 'openweathermap',
                    'available' => false,
                    'message' => 'Météo indisponible — vérifiez votre connexion',
                    'list' => [],
                ];
            }

            return array_merge($response->json(), [
                'source' => 'openweathermap',
                'available' => true,
            ]);
        });
    }

    /**
     * Prepare une reponse meteo directement exploitable par l'application mobile.
     */
    public function getPrevisionsMobiles(float $lat, float $lon): array
    {
        $forecast = $this->getPrevisionsActuelles($lat, $lon);
        $current = $this->getMeteoActuelle($lat, $lon);
        $oneCall = $this->getOneCall($lat, $lon);
        $city = data_get($current, 'name') ?: data_get($forecast, 'city.name') ?: 'Votre position';

        $currentWeather = (array) data_get($current, 'weather.0', data_get($this->firstForecast($lat, $lon), 'weather.0', []));
        $currentMain = (array) data_get($current, 'main', data_get($this->firstForecast($lat, $lon), 'main', []));
        $currentWind = (array) data_get($current, 'wind', data_get($this->firstForecast($lat, $lon), 'wind', []));
        $rainProbability = (float) data_get($this->firstForecast($lat, $lon), 'pop', 0);

        return [
            'source' => 'openweathermap',
            'available' => (bool) data_get($forecast, 'available', false),
            'city' => $city,
            'timezone' => data_get($forecast, 'city.timezone', data_get($current, 'timezone', 0)),
            'current' => [
                'temperature' => $this->roundNullable(data_get($currentMain, 'temp')),
                'feels_like' => $this->roundNullable(data_get($currentMain, 'feels_like')),
                'description' => $this->formatDescription((string) data_get($currentWeather, 'description', '')),
                'icon' => data_get($currentWeather, 'icon'),
                'weather_id' => data_get($currentWeather, 'id'),
                'rain_probability' => (int) round($rainProbability * 100),
                'wind_kmh' => round(((float) data_get($currentWind, 'speed', 0)) * 3.6),
                'humidity' => data_get($currentMain, 'humidity'),
                'pressure' => data_get($currentMain, 'pressure'),
                'sunrise' => $this->formatUnixTime(data_get($current, 'sys.sunrise')),
                'sunset' => $this->formatUnixTime(data_get($current, 'sys.sunset')),
                'uv_index' => data_get($oneCall, 'current.uvi'),
                'uv_label' => $this->uvLabel(data_get($oneCall, 'current.uvi')),
            ],
            'hourly_48h' => $this->formatHourly48h((array) data_get($forecast, 'list', []), $current),
            'daily' => $this->formatDaily($forecast, $oneCall),
            'updated_at' => now()->format('H:i'),
        ];
    }

    /**
     * Recupere la meteo courante OpenWeather.
     */
    public function getMeteoActuelle(float $lat, float $lon): array
    {
        return Cache::remember($this->currentCacheKey($lat, $lon), 1800, function () use ($lat, $lon) {
            if (! config('services.openweather.key')) {
                return ['available' => false];
            }

            try {
                $response = Http::timeout(20)
                    ->withoutVerifying()
                    ->withOptions(['curl' => [\CURLOPT_IPRESOLVE => \CURL_IPRESOLVE_V4]])
                    ->get('https://api.openweathermap.org/data/2.5/weather', [
                    'lat' => $lat,
                    'lon' => $lon,
                    'appid' => config('services.openweather.key'),
                    'units' => 'metric',
                    'lang' => 'fr',
                ]);

                if (! $response->successful()) {
                    Log::warning('OpenWeatherMap current indisponible', [
                        'status' => $response->status(),
                        'body' => $response->body(),
                    ]);

                    return ['available' => false];
                }

                return array_merge($response->json(), ['available' => true]);
            } catch (Throwable $error) {
                Log::warning('OpenWeatherMap current erreur reseau', [
                    'message' => $error->getMessage(),
                ]);

                return ['available' => false];
            }
        });
    }

    /**
     * Tente One Call pour UV et previsions journalieres, si la cle le permet.
     */
    public function getOneCall(float $lat, float $lon): array
    {
        return Cache::remember($this->oneCallCacheKey($lat, $lon), 1800, function () use ($lat, $lon) {
            if (! config('services.openweather.key')) {
                return ['available' => false];
            }

            try {
                $response = Http::timeout(20)
                    ->withoutVerifying()
                    ->withOptions(['curl' => [\CURLOPT_IPRESOLVE => \CURL_IPRESOLVE_V4]])
                    ->get('https://api.openweathermap.org/data/3.0/onecall', [
                    'lat' => $lat,
                    'lon' => $lon,
                    'appid' => config('services.openweather.key'),
                    'units' => 'metric',
                    'lang' => 'fr',
                    'exclude' => 'minutely,hourly,alerts',
                ]);

                if (! $response->successful()) {
                    return ['available' => false];
                }

                return array_merge($response->json(), ['available' => true]);
            } catch (Throwable $error) {
                Log::info('OpenWeatherMap One Call non disponible', [
                    'message' => $error->getMessage(),
                ]);

                return ['available' => false];
            }
        });
    }

    /**
     * Retourne la temperature courante connue.
     */
    public function getTemperatureActuelle(float $lat, float $lon): ?float
    {
        $current = $this->getMeteoActuelle($lat, $lon);
        if (data_get($current, 'main.temp') !== null) {
            return (float) data_get($current, 'main.temp');
        }

        $first = $this->firstForecast($lat, $lon);

        return data_get($first, 'main.temp') === null ? null : (float) data_get($first, 'main.temp');
    }

    /**
     * Indique si une pluie est prevue dans les prochaines 48 heures.
     */
    public function getPluiePrevue(float $lat, float $lon): bool
    {
        return collect(data_get($this->getPrevisionsActuelles($lat, $lon), 'list', []))
            ->take(8) // Seulement les prochaines 24h (8 tranches de 3h)
            ->contains(fn ($item) => (float) data_get($item, 'pop', 0) >= 0.5 || (float) data_get($item, 'rain.3h', 0) > 0);
    }

    /**
     * Detecte une chaleur forte demain.
     */
    public function getChaleurPrevueDemain(float $lat, float $lon): bool
    {
        return collect(data_get($this->getPrevisionsActuelles($lat, $lon), 'list', []))
            ->filter(fn ($item) => now()->parse(data_get($item, 'dt_txt'))->isTomorrow())
            ->max(fn ($item) => (float) data_get($item, 'main.temp', 0)) > 35;
    }

    /**
     * Retourne le vent maximal prevu en km/h.
     */
    public function getVentPrevu(float $lat, float $lon): float
    {
        $maxMs = collect(data_get($this->getPrevisionsActuelles($lat, $lon), 'list', []))
            ->max(fn ($item) => (float) data_get($item, 'wind.speed', 0));

        return round(((float) $maxMs) * 3.6, 2);
    }

    /**
     * Calcule un coefficient meteo simple pour ajuster l'eau.
     */
    public function calculerCoefficientMeteo(float $lat, float $lon): float
    {
        $coefficient = 1.0;

        $temperature = $this->getTemperatureActuelle($lat, $lon);

        if ($temperature !== null && $temperature > 35) {
            $coefficient += 0.1;
        }

        if ($this->getVentPrevu($lat, $lon) > 20) {
            $coefficient += 0.2;
        }

        return $coefficient;
    }

    public function refresh(float $lat, float $lon): void
    {
        Cache::forget($this->cacheKey($lat, $lon));
        $this->getPrevisionsActuelles($lat, $lon);
    }

    private function firstForecast(float $lat, float $lon): array
    {
        return (array) collect(data_get($this->getPrevisionsActuelles($lat, $lon), 'list', []))->first();
    }

    private function cacheKey(float $lat, float $lon): string
    {
        return 'meteo_previsions_'.md5($lat.'_'.$lon);
    }

    private function currentCacheKey(float $lat, float $lon): string
    {
        return 'meteo_current_'.md5($lat.'_'.$lon);
    }

    private function oneCallCacheKey(float $lat, float $lon): string
    {
        return 'meteo_onecall_'.md5($lat.'_'.$lon);
    }

    private function formatHourly48h(array $items, array $current = []): array
    {
        $currentWeather = (array) data_get($current, 'weather.0', []);
        $currentMain = (array) data_get($current, 'main', []);
        $currentWind = (array) data_get($current, 'wind', []);
        $firstForecast = (array) collect($items)->first();

        $now = [
            'label' => 'Maintenant',
            'datetime' => now()->toDateTimeString(),
            'temperature' => $this->roundNullable(data_get($currentMain, 'temp', data_get($firstForecast, 'main.temp'))),
            'description' => $this->formatDescription((string) data_get($currentWeather, 'description', data_get($firstForecast, 'weather.0.description', ''))),
            'icon' => data_get($currentWeather, 'icon', data_get($firstForecast, 'weather.0.icon')),
            'weather_id' => data_get($currentWeather, 'id', data_get($firstForecast, 'weather.0.id')),
            'rain_probability' => (int) round(((float) data_get($firstForecast, 'pop', 0)) * 100),
            'wind_kmh' => round(((float) data_get($currentWind, 'speed', data_get($firstForecast, 'wind.speed', 0))) * 3.6),
        ];

        $forecastHours = collect($items)
            ->take(15)
            ->values()
            ->map(function ($item) {
                $date = now()->parse(data_get($item, 'dt_txt'));
                $weather = (array) data_get($item, 'weather.0', []);

                return [
                    'label' => $date->format('H\hi'),
                    'datetime' => data_get($item, 'dt_txt'),
                    'temperature' => $this->roundNullable(data_get($item, 'main.temp')),
                    'description' => $this->formatDescription((string) data_get($weather, 'description', '')),
                    'icon' => data_get($weather, 'icon'),
                    'weather_id' => data_get($weather, 'id'),
                    'rain_probability' => (int) round(((float) data_get($item, 'pop', 0)) * 100),
                    'wind_kmh' => round(((float) data_get($item, 'wind.speed', 0)) * 3.6),
                ];
            })
            ->all();

        return array_values(array_merge([$now], $forecastHours));
    }

    private function formatDaily(array $forecast, array $oneCall): array
    {
        if ((bool) data_get($oneCall, 'available', false) && is_array(data_get($oneCall, 'daily'))) {
            return collect(data_get($oneCall, 'daily', []))
                ->skip(1)
                ->take(7)
                ->values()
                ->map(function ($day, int $index) {
                    $date = now()->createFromTimestamp((int) data_get($day, 'dt'));
                    $weather = (array) data_get($day, 'weather.0', []);

                    return [
                        'day' => $index === 0 ? 'Demain' : $this->shortDay($date),
                        'date' => $date->toDateString(),
                        'icon' => data_get($weather, 'icon'),
                        'weather_id' => data_get($weather, 'id'),
                        'rain_probability' => (int) round(((float) data_get($day, 'pop', 0)) * 100),
                        'temp_max' => $this->roundNullable(data_get($day, 'temp.max')),
                        'temp_min' => $this->roundNullable(data_get($day, 'temp.min')),
                    ];
                })
                ->all();
        }

        return collect(data_get($forecast, 'list', []))
            ->groupBy(fn ($item) => now()->parse(data_get($item, 'dt_txt'))->toDateString())
            ->skip(1)
            ->take(7)
            ->values()
            ->map(function ($items, int $index) {
                $first = (array) collect($items)->first();
                $date = now()->parse(data_get($first, 'dt_txt'));
                $weather = (array) data_get($first, 'weather.0', []);

                return [
                    'day' => $index === 0 ? 'Demain' : $this->shortDay($date),
                    'date' => $date->toDateString(),
                    'icon' => data_get($weather, 'icon'),
                    'weather_id' => data_get($weather, 'id'),
                    'rain_probability' => (int) round(((float) collect($items)->max(fn ($item) => (float) data_get($item, 'pop', 0))) * 100),
                    'temp_max' => round((float) collect($items)->max(fn ($item) => (float) data_get($item, 'main.temp_max', data_get($item, 'main.temp', 0)))),
                    'temp_min' => round((float) collect($items)->min(fn ($item) => (float) data_get($item, 'main.temp_min', data_get($item, 'main.temp', 0)))),
                ];
            })
            ->all();
    }

    private function formatUnixTime(mixed $value): ?string
    {
        if (! $value) {
            return null;
        }

        return now()->createFromTimestamp((int) $value)->format('H:i');
    }

    private function formatDescription(string $description): string
    {
        if ($description === '') {
            return 'Meteo disponible';
        }

        return mb_strtoupper(mb_substr($description, 0, 1)).mb_substr($description, 1);
    }

    private function shortDay($date): string
    {
        $days = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];

        return $days[(int) $date->format('w')].' '.$date->format('d');
    }

    private function uvLabel(mixed $uv): ?string
    {
        if ($uv === null) {
            return null;
        }

        $uv = (float) $uv;

        if ($uv >= 11) return 'Extrême';
        if ($uv >= 8) return 'Très élevé';
        if ($uv >= 6) return 'Élevé';
        if ($uv >= 3) return 'Modéré';

        return 'Faible';
    }

    private function roundNullable(mixed $value): ?int
    {
        return $value === null ? null : (int) round((float) $value);
    }
}
