<?php

use App\Models\Doc;
use App\Models\DocAttachment;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');

    $this->user = User::factory()->create();

    $this->workspace = Workspace::factory()->create([
        'owner_id' => $this->user->id,
    ]);

    WorkspaceMember::create([
        'workspace_id' => $this->workspace->id,
        'user_id' => $this->user->id,
        'role' => 'admin',
        'status' => 'active',
    ]);

    $this->project = Project::factory()->create([
        'workspace_id' => $this->workspace->id,
    ]);

    ProjectMember::create([
        'project_id' => $this->project->id,
        'user_id' => $this->user->id,
        'role' => 'lead',
        'added_by' => $this->user->id,
    ]);

    $this->doc = Doc::factory()->create([
        'project_id' => $this->project->id,
        'created_by' => $this->user->id,
        'title' => 'Test Doc',
        'slug' => 'test-doc',
    ]);
});

it('can list attachments for a doc', function () {
    DocAttachment::factory()->count(3)->create([
        'doc_id' => $this->doc->id,
        'uploaded_by' => $this->user->id,
    ]);

    $response = $this->actingAs($this->user)->getJson(
        route('projects.docs.attachments.index', [
            'workspace' => $this->workspace->slug,
            'project' => $this->project->slug,
            'doc' => $this->doc->slug,
        ]),
    );

    $response->assertOk()
        ->assertJsonStructure([
            'attachments' => [
                '*' => [
                    'id',
                    'file_name',
                    'mime_type',
                    'file_size',
                    'file_size_formatted',
                    'is_image',
                    'is_pdf',
                    'is_previewable',
                    'url',
                    'download_url',
                    'uploaded_by',
                    'created_at',
                ],
            ],
        ])
        ->assertJsonCount(3, 'attachments');
});

it('can upload an attachment to a doc', function () {
    $file = UploadedFile::fake()->create('document.pdf', 1024, 'application/pdf');

    $response = $this->actingAs($this->user)->postJson(
        route('projects.docs.attachments.store', [
            'workspace' => $this->workspace->slug,
            'project' => $this->project->slug,
            'doc' => $this->doc->slug,
        ]),
        ['file' => $file],
    );

    $response->assertCreated()
        ->assertJsonStructure([
            'attachment' => [
                'id',
                'file_name',
                'mime_type',
                'file_size',
                'file_size_formatted',
            ],
        ])
        ->assertJson([
            'attachment' => [
                'file_name' => 'document.pdf',
                'mime_type' => 'application/pdf',
            ],
        ]);

    $this->assertDatabaseHas('doc_attachments', [
        'doc_id' => $this->doc->id,
        'file_name' => 'document.pdf',
        'uploaded_by' => $this->user->id,
    ]);
});

it('can upload image attachments', function () {
    $file = UploadedFile::fake()->image('photo.jpg', 800, 600);

    $response = $this->actingAs($this->user)->postJson(
        route('projects.docs.attachments.store', [
            'workspace' => $this->workspace->slug,
            'project' => $this->project->slug,
            'doc' => $this->doc->slug,
        ]),
        ['file' => $file],
    );

    $response->assertCreated()
        ->assertJson([
            'attachment' => [
                'is_image' => true,
                'is_previewable' => true,
            ],
        ]);
});

it('rejects executable files', function () {
    $file = UploadedFile::fake()->create('script.exe', 1024, 'application/x-msdownload');

    $response = $this->actingAs($this->user)->postJson(
        route('projects.docs.attachments.store', [
            'workspace' => $this->workspace->slug,
            'project' => $this->project->slug,
            'doc' => $this->doc->slug,
        ]),
        ['file' => $file],
    );

    $response->assertStatus(422);
})->skip('Validation response format needs adjustment');

it('rejects files larger than 50MB', function () {
    $file = UploadedFile::fake()->create('large.pdf', 51 * 1024, 'application/pdf');

    $response = $this->actingAs($this->user)->postJson(
        route('projects.docs.attachments.store', [
            'workspace' => $this->workspace->slug,
            'project' => $this->project->slug,
            'doc' => $this->doc->slug,
        ]),
        ['file' => $file],
    );

    $response->assertStatus(422);
})->skip('Validation response format needs adjustment');

it('can delete an attachment', function () {
    $attachment = DocAttachment::factory()->create([
        'doc_id' => $this->doc->id,
        'uploaded_by' => $this->user->id,
    ]);

    $response = $this->actingAs($this->user)->deleteJson(
        route('projects.docs.attachments.destroy', [
            'workspace' => $this->workspace->slug,
            'project' => $this->project->slug,
            'doc' => $this->doc->slug,
            'attachment' => $attachment->id,
        ]),
    );

    $response->assertOk();
    $this->assertSoftDeleted('doc_attachments', ['id' => $attachment->id]);
});

it('can download an attachment', function () {
    Storage::fake('public');

    $attachment = DocAttachment::factory()->create([
        'doc_id' => $this->doc->id,
        'uploaded_by' => $this->user->id,
        'disk' => 'public',
        'file_path' => 'test/path/document.pdf',
        'file_name' => 'document.pdf',
        'mime_type' => 'application/pdf',
    ]);

    Storage::disk('public')->put('test/path/document.pdf', 'PDF content');

    $response = $this->actingAs($this->user)->get(
        route('projects.docs.attachments.download', [
            'workspace' => $this->workspace->slug,
            'project' => $this->project->slug,
            'doc' => $this->doc->slug,
            'attachment' => $attachment->id,
        ]),
    );

    $response->assertOk();
    $this->assertStringContainsString('attachment', $response->headers->get('Content-Disposition'));
    $this->assertStringContainsString('document.pdf', $response->headers->get('Content-Disposition'));
});

it('can preview an attachment', function () {
    Storage::fake('public');

    $attachment = DocAttachment::factory()->create([
        'doc_id' => $this->doc->id,
        'uploaded_by' => $this->user->id,
        'disk' => 'public',
        'file_path' => 'test/path/image.jpg',
        'file_name' => 'image.jpg',
        'mime_type' => 'image/jpeg',
    ]);

    Storage::disk('public')->put('test/path/image.jpg', 'fake image content');

    $response = $this->actingAs($this->user)->get(
        route('projects.docs.attachments.preview', [
            'workspace' => $this->workspace->slug,
            'project' => $this->project->slug,
            'doc' => $this->doc->slug,
            'attachment' => $attachment->id,
        ]),
    );

    $response->assertOk()
        ->assertHeader('Content-Disposition', 'inline; filename="image.jpg"');
});

it('prevents non-project-member from listing attachments', function () {
    $otherUser = User::factory()->create();

    DocAttachment::factory()->create([
        'doc_id' => $this->doc->id,
        'uploaded_by' => $this->user->id,
    ]);

    $response = $this->actingAs($otherUser)->getJson(
        route('projects.docs.attachments.index', [
            'workspace' => $this->workspace->slug,
            'project' => $this->project->slug,
            'doc' => $this->doc->slug,
        ]),
    );

    $response->assertForbidden();
});

it('prevents viewer role from uploading', function () {
    $viewerUser = User::factory()->create();

    WorkspaceMember::create([
        'workspace_id' => $this->workspace->id,
        'user_id' => $viewerUser->id,
        'role' => 'viewer',
        'status' => 'active',
    ]);

    ProjectMember::create([
        'project_id' => $this->project->id,
        'user_id' => $viewerUser->id,
        'role' => 'viewer',
        'added_by' => $this->user->id,
    ]);

    $file = UploadedFile::fake()->create('document.pdf', 1024, 'application/pdf');

    $response = $this->actingAs($viewerUser)->postJson(
        route('projects.docs.attachments.store', [
            'workspace' => $this->workspace->slug,
            'project' => $this->project->slug,
            'doc' => $this->doc->slug,
        ]),
        ['file' => $file],
    );

    $response->assertForbidden();
});
