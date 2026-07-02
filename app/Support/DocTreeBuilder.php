<?php

namespace App\Support;

use Illuminate\Support\Collection;

class DocTreeBuilder
{
    public static function buildTree(Collection $docs): array
    {
        $grouped = $docs->groupBy('parent_id');

        return self::buildBranch($grouped, null);
    }

    private static function buildBranch(Collection $grouped, ?int $parentId): array
    {
        return $grouped->get($parentId, collect())->map(fn ($doc) => [
            'id' => $doc->id,
            'title' => $doc->title,
            'slug' => $doc->slug,
            'parent_id' => $doc->parent_id,
            'sort_order' => $doc->sort_order,
            'created_at' => $doc->created_at,
            'updated_at' => $doc->updated_at,
            'author' => $doc->relationLoaded('author') && $doc->author ? [
                'id' => $doc->author->id,
                'name' => $doc->author->name,
                'avatar' => $doc->author->avatar,
            ] : null,
            'children' => self::buildBranch($grouped, $doc->id),
        ])->values()->toArray();
    }
}
