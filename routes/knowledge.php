<?php

use App\Http\Controllers\Knowledge\ArticleAttachmentController;
use App\Http\Controllers\Knowledge\ArticleController;
use App\Http\Controllers\Knowledge\CategoryController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->prefix('api')->group(function () {
    Route::prefix('workspaces/{workspace:slug}/knowledge')->group(function () {
        Route::get('/categories', [CategoryController::class, 'index'])->name('knowledge.categories.index');
        Route::post('/categories', [CategoryController::class, 'store'])->name('knowledge.categories.store');
        Route::patch('/categories/{category}', [CategoryController::class, 'update'])->name('knowledge.categories.update');
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->name('knowledge.categories.destroy');

        Route::get('/articles', [ArticleController::class, 'index'])->name('knowledge.articles.index');
        Route::get('/articles/search', [ArticleController::class, 'search'])->name('knowledge.articles.search');
        Route::get('/articles/{article:slug}', [ArticleController::class, 'show'])->name('knowledge.articles.show');
        Route::post('/articles', [ArticleController::class, 'store'])->name('knowledge.articles.store');
        Route::patch('/articles/{article:slug}', [ArticleController::class, 'update'])->name('knowledge.articles.update');
        Route::delete('/articles/{article:slug}', [ArticleController::class, 'destroy'])->name('knowledge.articles.destroy');

        Route::get('/articles/{article:slug}/attachments', [ArticleAttachmentController::class, 'index'])->name('knowledge.articles.attachments.index');
        Route::post('/articles/{article:slug}/attachments', [ArticleAttachmentController::class, 'store'])->name('knowledge.articles.attachments.store');
        Route::delete('/articles/{article:slug}/attachments/{attachment}', [ArticleAttachmentController::class, 'destroy'])->name('knowledge.articles.attachments.destroy');
        Route::get('/articles/{article:slug}/attachments/{attachment}/download', [ArticleAttachmentController::class, 'download'])->name('knowledge.articles.attachments.download');
    });
});
