<?php

namespace App\Actions\Fortify;

use Illuminate\Http\RedirectResponse;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request): RedirectResponse
    {
        if ($token = session('pending_invitation_token')) {
            session()->forget('pending_invitation_token');

            return redirect()->route('workspace-invitations.accept', [
                'invitation' => $token,
            ]);
        }

        return redirect(config('fortify.home'));
    }
}
