<?php

namespace App\Models\Knowledge;

use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Article extends Model
{
    use HasFactory;

    protected $table = 'knowledge_articles';

    protected $fillable = [
        'category_id',
        'workspace_id',
        'author_id',
        'title',
        'slug',
        'content',
        'views',
        'status',
        'published_at',
    ];

    protected $casts = [
        'views' => 'integer',
        'published_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Article $article) {
            if (empty($article->slug)) {
                $article->slug = Str::slug($article->title);
            }
            if ($article->status === 'published' && ! $article->published_at) {
                $article->published_at = now();
            }
        });

        static::updating(function (Article $article) {
            if ($article->isDirty('status') && $article->status === 'published' && ! $article->published_at) {
                $article->published_at = now();
            }
            if ($article->isDirty('title') && ! $article->isDirty('slug')) {
                $article->slug = Str::slug($article->title);
            }
        });
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(ArticleAttachment::class, 'article_id');
    }

    public function incrementViews(): void
    {
        $this->increment('views');
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeInWorkspace($query, Workspace $workspace)
    {
        return $query->where('workspace_id', $workspace->id);
    }
}
