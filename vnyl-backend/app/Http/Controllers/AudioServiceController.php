<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AudioServiceController extends Controller
{
    public function checkHealth()
    {
        try {
            // Using port 8003 as established previously
            $response = \Illuminate\Support\Facades\Http::get('http://127.0.0.1:8003/health');
            return $response->json();
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}
