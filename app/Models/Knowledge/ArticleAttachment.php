<?php

namespace App\Models\Knowledge;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class ArticleAttachment extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'article_attachments';

    protected $fillable = [
        'article_id',
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

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class, 'article_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function isImage(): bool
    {
        return $this->mime_type && str_starts_with($this->mime_type, 'image/');
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
        if (in_array($this->disk, ['local', 'public'])) {
            return url("/storage/{$this->file_path}");
        }

        return Storage::disk($this->disk)->url($this->file_path);
    }

    public function getFormattedSizeAttribute(): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];

        $size = $this->file_size;
        for ($i = 0; $size > 1024 && $i < count($units) - 1; $i++) {
            $size /= 1024;
        }

        return round($size, 1) . ' ' . $units[$i];
    }

    protected static function booted(): void
    {
        static::deleting(function (ArticleAttachment $attachment) {
            Storage::disk($attachment->disk)->delete($attachment->file_path);
        });
    }
}
