<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDocAttachmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('view', $this->route('doc')) ?? false;
    }

    public function rules(): array
    {
        $allowedExtensions = [
            'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf',
            'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff',
        ];

        $blockedExtensions = [
            'exe', 'sh', 'bat', 'cmd', 'dll', 'msi', 'com', 'scr', 'pif',
            'app', 'dmg', 'pkg', 'deb', 'rpm', 'jar', 'class', 'py', 'rb',
            'php', 'pl', 'cgi', 'sh', 'bash', 'zsh', 'ps1', 'vbs', 'js',
        ];

        return [
            'file' => [
                'required',
                'file',
                'mimes:'.implode(',', $allowedExtensions),
                function ($attribute, $value, $fail) use ($blockedExtensions) {
                    $extension = strtolower($value->getClientOriginalExtension());
                    if (in_array($extension, $blockedExtensions)) {
                        $fail('Executable files are not allowed.');
                    }
                },
                'max:51200',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'A file is required.',
            'file.max' => 'The file must not exceed 50MB.',
            'file.mimes' => 'Only document files (doc, docx, xls, xlsx, ppt, pptx, pdf) and images are allowed.',
        ];
    }
}
