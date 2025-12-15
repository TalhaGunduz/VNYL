<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'nullable|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'dob' => 'required|date',
            'gender' => ['required', Rule::in(['Male', 'Female', 'Non-binary', 'Prefer not to say'])],
            'google_id' => 'nullable|string',
            'avatar' => 'nullable|string',
            'location' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = User::create([
            'name' => $request->name,
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'dob' => $request->dob,
            'gender' => $request->gender,
            'google_id' => $request->google_id,
            'avatar' => $request->avatar,
            'location' => $request->location,
        ]);

        return response()->json([
            'message' => 'User registered successfully',
            'user' => $user->load('artist')
        ], 201);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        return response()->json([
            'message' => 'Login successful',
            'user' => $user->load('artist')
        ], 200);
    }

    public function redirectToGoogle()
    {
        return \Laravel\Socialite\Facades\Socialite::driver('google')
            ->with(['prompt' => 'select_account'])
            ->redirect();
    }

    public function handleGoogleCallback()
    {
        try {
            $googleUser = \Laravel\Socialite\Facades\Socialite::driver('google')->user();

            $user = User::where('email', $googleUser->getEmail())->first();

            // Try to get location from locale
            $rawUser = $googleUser->user;
            $locale = isset($rawUser['locale']) ? $rawUser['locale'] : 'en';

            // Map common locales to Countries
            $locationMap = [
                'tr' => 'Turkey',
                'en' => 'USA',
                'en-US' => 'USA',
                'en-GB' => 'United Kingdom',
                'fr' => 'France',
                'de' => 'Germany',
                'hi' => 'India',
                'in' => 'India',
                'es' => 'Spain',
                'it' => 'Italy',
                'jp' => 'Japan',
                'ja' => 'Japan',
                'ru' => 'Russia',
                'pt' => 'Portugal',
                'br' => 'Brazil',
                'pt-BR' => 'Brazil',
            ];

            $location = isset($locationMap[$locale]) ? $locationMap[$locale] : strtoupper($locale);

            if (!$user) {
                // User does not exist, redirect to frontend registration page
                $redirectUrl = "http://localhost:5173/create-account" .
                    "?google_pending=true" .
                    "&email=" . urlencode($googleUser->getEmail()) .
                    "&name=" . urlencode($googleUser->getName()) .
                    "&google_id=" . urlencode($googleUser->getId()) .
                    "&avatar=" . urlencode($googleUser->getAvatar()) .
                    "&location=" . urlencode($location ?? '');
                
                return redirect($redirectUrl);
            } else {
                // User exists, update fields
                $dataToUpdate = [
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar()
                ];
                
                if (empty($user->location) && $location) $dataToUpdate['location'] = $location;
                if (empty($user->name)) $dataToUpdate['name'] = $googleUser->getName();

                $user->update($dataToUpdate);
            }

            // Redirect with user details (Login Success)
            $redirectUrl = "http://localhost:5173?login_success=true" .
                "&username=" . urlencode($user->username) .
                "&name=" . urlencode($user->name) .
                "&avatar=" . urlencode($user->avatar) .
                "&email=" . urlencode($user->email) .
                "&joined_at=" . urlencode($user->created_at->format('F Y')) . 
                "&dob=" . urlencode($user->dob ?? '') .
                "&location=" . urlencode($user->location ?? '') .
                "&role=" . urlencode($user->role ?? 'user');
            
            return redirect($redirectUrl);

        } catch (\Exception $e) {
            return redirect("http://localhost:5173?error=google_login_failed");
        }
    }

    public function deleteAccount(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        User::where('email', $request->email)->delete();

        return response()->json(['message' => 'Account deleted successfully'], 200);
    }

    public function updateProfile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email|exists:users,email',
            'username' => ['nullable', 'string', 'max:255', Rule::unique('users')->ignore(User::where('email', $request->email)->first()->id)],
            'name' => 'nullable|string|max:255',
            'dob' => 'nullable|date',
            'gender' => ['nullable', Rule::in(['Male', 'Female', 'Non-binary', 'Prefer not to say'])],
            'location' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = User::where('email', $request->email)->first();

        $user->update($request->only(['username', 'name', 'dob', 'gender', 'location']));

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user
        ], 200);
    }
}
