<?php

use Laravel\Fortify\Features;

test('registration is enabled', function () {
    expect(Features::enabled(Features::registration()))->toBeTrue();
});

test('the register route is available', function () {
    $this->get('/register')->assertOk();
});
