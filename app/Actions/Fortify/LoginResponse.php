<?php

namespace App\Actions\Fortify;

use Illuminate\Http\RedirectResponse;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request): RedirectResponse
    {
        if ($token = session('pending_invitation_token')) {
            return redirect()->route('password.setup');
        }

        return redirect(config('fortify.home'));
    }
}
