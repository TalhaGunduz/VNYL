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
    public function streamAudio(Request $request, $filename)
    {
        $path = storage_path('app/public/tracks/' . $filename);

        if (!file_exists($path)) {
            abort(404);
        }

        $fileSize = filesize($path);
        $length = $fileSize;
        $start = 0;
        $end = $fileSize - 1;

        $headers = [
            'Content-Type' => 'audio/mpeg',
            'Accept-Ranges' => 'bytes',
        ];

        if ($request->hasHeader('Range')) {
            $range = $request->header('Range');
            if (preg_match('/bytes=(\d+)-(\d*)/', $range, $matches)) {
                $start = intval($matches[1]);
                if (!empty($matches[2])) {
                    $end = intval($matches[2]);
                }
            }
            
            $length = $end - $start + 1;
            $headers['Content-Length'] = $length;
            $headers['Content-Range'] = "bytes $start-$end/$fileSize";
            
            return response()->stream(function() use ($path, $start, $length) {
                $stream = fopen($path, 'rb');
                fseek($stream, $start);
                echo fread($stream, $length);
                fclose($stream);
            }, 206, $headers);
        }

        $headers['Content-Length'] = $fileSize;

        return response()->file($path, $headers);
    }

    public function proxyAudio(Request $request)
    {
        $url = $request->query('url');
        if (!$url) {
            return response()->json(['error' => 'No URL provided'], 400);
        }

        return response()->stream(function() use ($url) {
            @readfile($url);
        }, 200, [
            'Content-Type' => 'audio/mpeg',
            'Access-Control-Allow-Origin' => '*',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
        ]);
    }
}
