<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class DocAttachment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'doc_id',
        'uploaded_by',
        'disk',
        'file_name',
        'file_path',
        'mime_type',
        'file_size',
    ];

    protected $casts = [
        'file_size' => 'integer',
    ];

    public function doc(): BelongsTo
    {
        return $this->belongsTo(Doc::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function isImage(): bool
    {
        if (! $this->mime_type) {
            return false;
        }

        return str_starts_with($this->mime_type, 'image/');
    }

    public function isPdf(): bool
    {
        return $this->mime_type === 'application/pdf';
    }

    public function isPreviewable(): bool
    {
        return $this->isImage() || $this->isPdf();
    }

    public function getUrlAttribute(): ?string
    {
        return $this->getDownloadUrl();
    }

    public function getPreviewUrlAttribute(): ?string
    {
        return $this->getPreviewUrl();
    }

    public function getDownloadUrl(): ?string
    {
        if ($this->disk === 'local' || $this->disk === 'public') {
            return url("/storage/{$this->file_path}");
        }

        return Storage::disk($this->disk)->url($this->file_path);
    }

    public function getPreviewUrl(): ?string
    {
        if ($this->isImage()) {
            return $this->getDownloadUrl();
        }

        return $this->getDownloadUrl();
    }

    public function getFormattedSizeAttribute(): string
    {
        return $this->formatFileSize($this->file_size);
    }

    public static function formatFileSize(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 1).' '.$units[$i];
    }

    protected static function booted(): void
    {
        static::deleting(function (DocAttachment $attachment) {
            Storage::disk($attachment->disk)->delete($attachment->file_path);
        });
    }
}
